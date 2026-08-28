CREATE OR REPLACE FUNCTION public.ensure_organization_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    base_slug := lower(regexp_replace(unaccent(coalesce(NEW.name, 'empresa')), '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    IF base_slug = '' THEN base_slug := 'empresa'; END IF;
    NEW.slug := base_slug || '-' || substr(replace(NEW.id::text, '-', ''), 1, 6);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organizations_ensure_slug ON public.organizations;
CREATE TRIGGER organizations_ensure_slug
BEFORE INSERT OR UPDATE OF name, slug ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.ensure_organization_slug();

UPDATE public.organizations SET slug = NULL WHERE slug IS NULL OR btrim(slug) = '';
