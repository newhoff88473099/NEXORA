-- FASE 7 — Período de teste (trial de 15 dias)

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Backfill: organizações já em trial ganham 15 dias a partir da criação da assinatura.
UPDATE public.subscriptions
SET trial_ends_at = created_at + interval '15 days'
WHERE plan = 'trial' AND trial_ends_at IS NULL;
