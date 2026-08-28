CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_valid_range
  CHECK (ends_at > starts_at);

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_professional_overlap
  EXCLUDE USING gist (
    organization_id WITH =,
    professional_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  )
  WHERE (professional_id IS NOT NULL AND status <> 'cancelado');
