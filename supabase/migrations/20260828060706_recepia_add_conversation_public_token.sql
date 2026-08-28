ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS public_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS conversations_public_token_idx
  ON public.conversations (public_token);

COMMENT ON COLUMN public.conversations.public_token IS
  'Opaque token used by public chat channels to resume a conversation without exposing sequential identifiers or granting tenant access.';
