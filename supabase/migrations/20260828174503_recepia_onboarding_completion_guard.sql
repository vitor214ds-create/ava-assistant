CREATE OR REPLACE FUNCTION public.guard_organization_onboarding_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_professional_name text;
BEGIN
  IF coalesce(old.onboarding_completed,false) = false AND new.onboarding_completed = true THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.professionals
      WHERE organization_id = new.id AND is_active = true
    ) THEN
      SELECT nullif(btrim(full_name),'') INTO v_professional_name
      FROM public.profiles
      WHERE id = coalesce(auth.uid(), new.created_by)
      LIMIT 1;

      INSERT INTO public.professionals(organization_id,name,role_title,is_active)
      VALUES (new.id, coalesce(v_professional_name,'Profissional principal'), 'Profissional principal', true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.services WHERE organization_id = new.id AND is_active = true)
       OR NOT EXISTS (SELECT 1 FROM public.business_hours WHERE organization_id = new.id AND is_open = true)
       OR NOT EXISTS (SELECT 1 FROM public.ai_settings WHERE organization_id = new.id AND is_enabled = true) THEN
      new.onboarding_completed := false;
    END IF;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS organizations_guard_onboarding_completion ON public.organizations;
CREATE TRIGGER organizations_guard_onboarding_completion
BEFORE UPDATE OF onboarding_completed ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.guard_organization_onboarding_completion();

CREATE OR REPLACE FUNCTION public.finalize_organization_onboarding_from_ai_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF new.is_enabled = true
     AND EXISTS (SELECT 1 FROM public.professionals WHERE organization_id = new.organization_id AND is_active = true)
     AND EXISTS (SELECT 1 FROM public.services WHERE organization_id = new.organization_id AND is_active = true)
     AND EXISTS (SELECT 1 FROM public.business_hours WHERE organization_id = new.organization_id AND is_open = true) THEN
    UPDATE public.organizations
    SET onboarding_completed = true, updated_at = now()
    WHERE id = new.organization_id AND onboarding_completed = false;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS ai_settings_finalize_onboarding ON public.ai_settings;
CREATE TRIGGER ai_settings_finalize_onboarding
AFTER INSERT OR UPDATE OF is_enabled ON public.ai_settings
FOR EACH ROW EXECUTE FUNCTION public.finalize_organization_onboarding_from_ai_settings();
