-- FASE 6 — Relatórios PDF gerados

-- Bucket para PDFs (privado — acesso via signed URL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audit-reports', 'audit-reports', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth upload audit-reports"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audit-reports');

CREATE POLICY "auth read audit-reports"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'audit-reports');

-- Registro de PDFs gerados
CREATE TABLE public.audit_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  audit_id        uuid NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  storage_path    text NOT NULL,
  file_name       text NOT NULL,
  file_size_bytes integer,
  generated_by    uuid REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_select" ON public.audit_reports
  FOR SELECT USING (org_id = public.org_id());

CREATE POLICY "reports_insert" ON public.audit_reports
  FOR INSERT WITH CHECK (org_id = public.org_id());

CREATE INDEX idx_audit_reports_org   ON public.audit_reports(org_id, created_at DESC);
CREATE INDEX idx_audit_reports_audit ON public.audit_reports(audit_id);
