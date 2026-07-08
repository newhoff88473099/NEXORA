-- FASE 2 — Execução de Auditoria
-- Tabelas: audits, audit_answers, findings, actions, audit_log
-- RLS em todas; triggers de updated_at, geração de código NC e audit_log

-- ── Buckets de Storage ────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('audit-photos',     'audit-photos',     true, 5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('audit-signatures', 'audit-signatures', true, 1048576,  ARRAY['image/png'])
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage — qualquer autenticado pode ler/gravar seus próprios buckets
CREATE POLICY "auth upload audit-photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audit-photos');

CREATE POLICY "auth read audit-photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'audit-photos');

CREATE POLICY "auth upload audit-signatures"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audit-signatures');

CREATE POLICY "auth read audit-signatures"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'audit-signatures');

-- ── audits ───────────────────────────────────────────────────
CREATE TABLE public.audits (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id           uuid NOT NULL REFERENCES public.templates(id),
  template_version      integer NOT NULL DEFAULT 1,
  plant_id              uuid REFERENCES public.plants(id),
  area_id               uuid,
  auditee_name          text,
  auditor_id            uuid NOT NULL REFERENCES auth.users(id),
  scheduled_at          timestamptz,
  started_at            timestamptz DEFAULT now(),
  finished_at           timestamptz,
  status                text NOT NULL DEFAULT 'em_andamento'
                          CHECK (status IN ('agendada','em_andamento','concluida','cancelada')),
  score                 numeric(5,2),
  observations          text,
  auditee_signature_url text,
  synced_offline        boolean NOT NULL DEFAULT false,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audits_select" ON public.audits
  FOR SELECT USING (org_id = public.org_id());

CREATE POLICY "audits_insert" ON public.audits
  FOR INSERT WITH CHECK (org_id = public.org_id());

CREATE POLICY "audits_update" ON public.audits
  FOR UPDATE USING (org_id = public.org_id());

CREATE POLICY "audits_delete" ON public.audits
  FOR DELETE USING (org_id = public.org_id());

CREATE TRIGGER set_audits_updated_at
  BEFORE UPDATE ON public.audits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── audit_answers ─────────────────────────────────────────────
CREATE TABLE public.audit_answers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id         uuid NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  template_item_id uuid NOT NULL REFERENCES public.template_items(id),
  response         text,
  note             text,
  photos           jsonb NOT NULL DEFAULT '[]',
  answered_at      timestamptz DEFAULT now(),
  UNIQUE (audit_id, template_item_id)
);

ALTER TABLE public.audit_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_answers_select" ON public.audit_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_id AND a.org_id = public.org_id())
  );

CREATE POLICY "audit_answers_insert" ON public.audit_answers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_id AND a.org_id = public.org_id())
  );

CREATE POLICY "audit_answers_update" ON public.audit_answers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_id AND a.org_id = public.org_id())
  );

-- ── findings (NCs) ────────────────────────────────────────────
CREATE TABLE public.findings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  audit_id           uuid NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  answer_id          uuid REFERENCES public.audit_answers(id),
  code               text,
  severity           text NOT NULL DEFAULT 'menor'
                       CHECK (severity IN ('critica','maior','menor','observacao')),
  description        text,
  norm_clause        text,
  root_cause         text,
  root_cause_method  text CHECK (root_cause_method IN ('5whys','ishikawa')),
  status             text NOT NULL DEFAULT 'aberta'
                       CHECK (status IN ('aberta','em_analise','em_execucao','verificacao','encerrada')),
  due_date           date,
  closed_at          timestamptz,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "findings_select" ON public.findings
  FOR SELECT USING (org_id = public.org_id());

CREATE POLICY "findings_insert" ON public.findings
  FOR INSERT WITH CHECK (org_id = public.org_id());

CREATE POLICY "findings_update" ON public.findings
  FOR UPDATE USING (org_id = public.org_id());

CREATE POLICY "findings_delete" ON public.findings
  FOR DELETE USING (org_id = public.org_id());

CREATE TRIGGER set_findings_updated_at
  BEFORE UPDATE ON public.findings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Geração automática do código NC-AAAA-NNNN
CREATE OR REPLACE FUNCTION public.generate_finding_code(p_org_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_year text;
  v_count integer;
BEGIN
  v_year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.findings
  WHERE org_id = p_org_id
    AND extract(year FROM created_at) = extract(year FROM now());
  RETURN 'NC-' || v_year || '-' || lpad(v_count::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_finding_code()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := public.generate_finding_code(NEW.org_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_findings_code
  BEFORE INSERT ON public.findings
  FOR EACH ROW EXECUTE FUNCTION public.set_finding_code();

-- ── actions (CAPA) ────────────────────────────────────────────
CREATE TABLE public.actions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  finding_id       uuid NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
  type             text NOT NULL DEFAULT 'corretiva'
                     CHECK (type IN ('corretiva','preventiva','contencao')),
  description      text,
  owner_id         uuid REFERENCES auth.users(id),
  due_date         date,
  status           text NOT NULL DEFAULT 'a_fazer'
                     CHECK (status IN ('a_fazer','em_andamento','concluida','verificada')),
  evidence_photos  jsonb NOT NULL DEFAULT '[]',
  verified_by      uuid REFERENCES auth.users(id),
  verified_at      timestamptz,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actions_select" ON public.actions
  FOR SELECT USING (org_id = public.org_id());

CREATE POLICY "actions_insert" ON public.actions
  FOR INSERT WITH CHECK (org_id = public.org_id());

CREATE POLICY "actions_update" ON public.actions
  FOR UPDATE USING (org_id = public.org_id());

CREATE TRIGGER set_actions_updated_at
  BEFORE UPDATE ON public.actions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── audit_log (append-only) ───────────────────────────────────
CREATE TABLE public.audit_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL,
  actor_id   uuid,
  entity     text NOT NULL,
  entity_id  uuid NOT NULL,
  action     text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  diff       jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas leitura via RLS; inserções apenas via trigger SECURITY DEFINER
CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT USING (org_id = public.org_id());

-- Função de trigger para audit_log
CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_org_id  uuid;
  v_actor   uuid;
  v_diff    jsonb;
BEGIN
  v_actor := auth.uid();

  IF TG_OP = 'DELETE' THEN
    v_org_id := OLD.org_id;
    v_diff   := to_jsonb(OLD);
    INSERT INTO public.audit_log (org_id, actor_id, entity, entity_id, action, diff)
    VALUES (v_org_id, v_actor, TG_TABLE_NAME, OLD.id, 'DELETE', v_diff);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_org_id := NEW.org_id;
    v_diff   := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    INSERT INTO public.audit_log (org_id, actor_id, entity, entity_id, action, diff)
    VALUES (v_org_id, v_actor, TG_TABLE_NAME, NEW.id, 'UPDATE', v_diff);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    v_org_id := NEW.org_id;
    INSERT INTO public.audit_log (org_id, actor_id, entity, entity_id, action, diff)
    VALUES (v_org_id, v_actor, TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$;

-- Triggers de audit_log nas tabelas críticas
CREATE TRIGGER audit_log_audits
  AFTER INSERT OR UPDATE OR DELETE ON public.audits
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_log_findings
  AFTER INSERT OR UPDATE OR DELETE ON public.findings
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_log_actions
  AFTER INSERT OR UPDATE OR DELETE ON public.actions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- Índices de performance
CREATE INDEX idx_audits_org      ON public.audits(org_id);
CREATE INDEX idx_audits_status   ON public.audits(status);
CREATE INDEX idx_answers_audit   ON public.audit_answers(audit_id);
CREATE INDEX idx_findings_org    ON public.findings(org_id);
CREATE INDEX idx_findings_audit  ON public.findings(audit_id);
CREATE INDEX idx_actions_finding ON public.actions(finding_id);
CREATE INDEX idx_audit_log_org   ON public.audit_log(org_id, created_at DESC);
