CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM public, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE TABLE IF NOT EXISTS private.integration_credentials (
  integration_id uuid PRIMARY KEY REFERENCES public.integrations(id) ON DELETE CASCADE,
  vault_secret_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.integration_credentials FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.integration_credentials TO service_role;

ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS connected_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_event_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_test_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text;

CREATE TABLE IF NOT EXISTS public.integration_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_event_id text NOT NULL,
  sender text,
  event_type text NOT NULL DEFAULT 'message',
  status text NOT NULL DEFAULT 'received',
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (integration_id, provider_event_id)
);

CREATE INDEX IF NOT EXISTS integration_webhook_events_org_created_idx ON public.integration_webhook_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS integration_webhook_events_sender_idx ON public.integration_webhook_events(integration_id, sender, created_at DESC);

ALTER TABLE public.integration_webhook_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.integration_webhook_events TO authenticated;
GRANT ALL ON public.integration_webhook_events TO service_role;

DROP POLICY IF EXISTS "integration event managers read" ON public.integration_webhook_events;
CREATE POLICY "integration event managers read" ON public.integration_webhook_events
FOR SELECT TO authenticated
USING (public.is_org_manager(organization_id));

DROP POLICY IF EXISTS "tenant access" ON public.integrations;
DROP POLICY IF EXISTS "integration managers read" ON public.integrations;
DROP POLICY IF EXISTS "integration managers insert" ON public.integrations;
DROP POLICY IF EXISTS "integration managers update" ON public.integrations;
DROP POLICY IF EXISTS "integration managers delete" ON public.integrations;

CREATE POLICY "integration managers read" ON public.integrations
FOR SELECT TO authenticated USING (public.is_org_manager(organization_id));
CREATE POLICY "integration managers insert" ON public.integrations
FOR INSERT TO authenticated WITH CHECK (public.is_org_manager(organization_id));
CREATE POLICY "integration managers update" ON public.integrations
FOR UPDATE TO authenticated USING (public.is_org_manager(organization_id)) WITH CHECK (public.is_org_manager(organization_id));
CREATE POLICY "integration managers delete" ON public.integrations
FOR DELETE TO authenticated USING (public.is_org_manager(organization_id));

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = private AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION private.set_updated_at() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS integration_credentials_updated ON private.integration_credentials;
CREATE TRIGGER integration_credentials_updated BEFORE UPDATE ON private.integration_credentials
FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
