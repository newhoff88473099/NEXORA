-- FASE 5 — Registro de uso de IA
CREATE TABLE public.ai_usage (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  feature     text NOT NULL,
  tokens_in   integer,
  tokens_out  integer,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage_insert" ON public.ai_usage
  FOR INSERT TO authenticated WITH CHECK (org_id = public.org_id());

CREATE POLICY "ai_usage_select" ON public.ai_usage
  FOR SELECT USING (org_id = public.org_id());

CREATE INDEX idx_ai_usage_org ON public.ai_usage(org_id, created_at DESC);
