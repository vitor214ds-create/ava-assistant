CREATE OR REPLACE FUNCTION public.bootstrap_organization_from_metadata()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid UUID := auth.uid();
  existing_org UUID;
  meta JSONB;
  org_name TEXT;
  org_segment public.segment_type;
  org_phone TEXT;
  org_email TEXT;
  basic_plan UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT organization_id INTO existing_org
  FROM public.organization_members
  WHERE user_id = uid
  ORDER BY created_at
  LIMIT 1;
  IF existing_org IS NOT NULL THEN RETURN existing_org; END IF;

  SELECT raw_user_meta_data, email INTO meta, org_email
  FROM auth.users WHERE id = uid;

  org_name := NULLIF(trim(meta->>'company_name'), '');
  IF org_name IS NULL THEN RAISE EXCEPTION 'company metadata missing'; END IF;
  org_phone := NULLIF(trim(meta->>'phone'), '');
  BEGIN
    org_segment := COALESCE((meta->>'segment')::public.segment_type, 'outro');
  EXCEPTION WHEN OTHERS THEN org_segment := 'outro'; END;

  INSERT INTO public.organizations(name, segment, phone, email, created_by)
  VALUES (org_name, org_segment, org_phone, org_email, uid)
  RETURNING id INTO existing_org;

  INSERT INTO public.organization_members(organization_id, user_id, role)
  VALUES (existing_org, uid, 'owner');

  SELECT id INTO basic_plan FROM public.plans WHERE slug = 'basico' LIMIT 1;
  INSERT INTO public.subscriptions(organization_id, plan_id, status)
  VALUES (existing_org, basic_plan, 'trial')
  ON CONFLICT (organization_id) DO NOTHING;

  RETURN existing_org;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_organization_from_metadata() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_organization_from_metadata() TO authenticated;
