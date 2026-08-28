ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS source_conversation_id uuid NULL REFERENCES public.conversations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS appointments_source_conversation_id_idx
  ON public.appointments(source_conversation_id)
  WHERE source_conversation_id IS NOT NULL;

UPDATE public.plans
SET features = (
  SELECT jsonb_agg(CASE WHEN value = 'WhatsApp (em breve)' THEN 'WhatsApp oficial integrado' ELSE value END)
  FROM jsonb_array_elements_text(features) AS t(value)
)
WHERE slug = 'profissional' AND features ? 'WhatsApp (em breve)';
