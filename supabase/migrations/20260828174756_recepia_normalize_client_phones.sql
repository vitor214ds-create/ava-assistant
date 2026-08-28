CREATE OR REPLACE FUNCTION public.normalize_contact_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF tg_table_name = 'clients' THEN
    new.phone := nullif(regexp_replace(coalesce(new.phone,''), '\D', '', 'g'), '');
  ELSIF tg_table_name = 'conversations' THEN
    new.contact_phone := nullif(regexp_replace(coalesce(new.contact_phone,''), '\D', '', 'g'), '');
  END IF;
  RETURN new;
END;
$$;

UPDATE public.clients SET phone = regexp_replace(phone, '\D', '', 'g') WHERE phone IS NOT NULL;
UPDATE public.conversations SET contact_phone = regexp_replace(contact_phone, '\D', '', 'g') WHERE contact_phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS clients_org_phone_unique_idx
  ON public.clients(organization_id, phone)
  WHERE phone IS NOT NULL AND phone <> '';

CREATE INDEX IF NOT EXISTS conversations_org_phone_idx
  ON public.conversations(organization_id, contact_phone, last_message_at DESC)
  WHERE contact_phone IS NOT NULL;

DROP TRIGGER IF EXISTS clients_normalize_phone ON public.clients;
CREATE TRIGGER clients_normalize_phone BEFORE INSERT OR UPDATE OF phone ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.normalize_contact_phone();

DROP TRIGGER IF EXISTS conversations_normalize_phone ON public.conversations;
CREATE TRIGGER conversations_normalize_phone BEFORE INSERT OR UPDATE OF contact_phone ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.normalize_contact_phone();
