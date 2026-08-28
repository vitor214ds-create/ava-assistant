CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_organization_id uuid,
  p_organization jsonb,
  p_professional jsonb,
  p_services jsonb,
  p_hours jsonb,
  p_ai jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_professional_id uuid;
  v_service jsonb;
  v_hour jsonb;
  v_segment segment_type;
  v_name text;
  v_role_title text;
  v_email text;
  v_phone text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT public.is_org_manager(p_organization_id) THEN RAISE EXCEPTION 'not_authorized'; END IF;

  SELECT segment INTO v_segment FROM public.organizations WHERE id = p_organization_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'organization_not_found'; END IF;

  v_name := nullif(btrim(coalesce(p_professional->>'name','')), '');
  IF v_name IS NULL THEN RAISE EXCEPTION 'professional_name_required'; END IF;
  v_role_title := nullif(btrim(coalesce(p_professional->>'role_title','')), '');
  v_email := nullif(lower(btrim(coalesce(p_professional->>'email',''))), '');
  v_phone := nullif(btrim(coalesce(p_professional->>'phone','')), '');

  UPDATE public.organizations
  SET name = coalesce(nullif(btrim(p_organization->>'name'),''), name),
      phone = nullif(btrim(coalesce(p_organization->>'phone','')), ''),
      address = nullif(btrim(coalesce(p_organization->>'address','')), ''),
      city = nullif(btrim(coalesce(p_organization->>'city','')), ''),
      state = nullif(btrim(coalesce(p_organization->>'state','')), ''),
      description = nullif(btrim(coalesce(p_organization->>'description','')), ''),
      segment = coalesce(nullif(p_organization->>'segment','')::segment_type, segment),
      onboarding_completed = false,
      updated_at = now()
  WHERE id = p_organization_id;

  SELECT id INTO v_professional_id FROM public.professionals
  WHERE organization_id = p_organization_id ORDER BY created_at ASC LIMIT 1;

  IF v_professional_id IS NULL THEN
    INSERT INTO public.professionals(organization_id,name,role_title,email,phone,is_active)
    VALUES (p_organization_id,v_name,v_role_title,v_email,v_phone,true)
    RETURNING id INTO v_professional_id;
  ELSE
    UPDATE public.professionals SET name=v_name, role_title=v_role_title, email=v_email, phone=v_phone, is_active=true, updated_at=now()
    WHERE id=v_professional_id;
  END IF;

  DELETE FROM public.services WHERE organization_id = p_organization_id;
  FOR v_service IN SELECT value FROM jsonb_array_elements(coalesce(p_services,'[]'::jsonb)) LOOP
    IF nullif(btrim(coalesce(v_service->>'name','')), '') IS NOT NULL THEN
      INSERT INTO public.services(organization_id,name,description,price_cents,duration_minutes,professional_id,is_active)
      VALUES (
        p_organization_id,
        btrim(v_service->>'name'),
        nullif(btrim(coalesce(v_service->>'description','')), ''),
        greatest(0, coalesce((v_service->>'price_cents')::int,0)),
        greatest(5, coalesce((v_service->>'duration_minutes')::int,30)),
        CASE WHEN coalesce((v_service->>'use_primary_professional')::boolean,true) THEN v_professional_id ELSE null END,
        true
      );
    END IF;
  END LOOP;

  IF NOT EXISTS(select 1 from public.services where organization_id=p_organization_id and is_active=true) THEN
    RAISE EXCEPTION 'at_least_one_service_required';
  END IF;

  FOR v_hour IN SELECT value FROM jsonb_array_elements(coalesce(p_hours,'[]'::jsonb)) LOOP
    INSERT INTO public.business_hours(organization_id,weekday,is_open,opens_at,closes_at)
    VALUES (
      p_organization_id,
      (v_hour->>'weekday')::smallint,
      coalesce((v_hour->>'is_open')::boolean,false),
      coalesce(nullif(v_hour->>'opens_at','')::time,'08:00'::time),
      coalesce(nullif(v_hour->>'closes_at','')::time,'18:00'::time)
    )
    ON CONFLICT (organization_id,weekday)
    DO UPDATE SET is_open=excluded.is_open, opens_at=excluded.opens_at, closes_at=excluded.closes_at;
  END LOOP;

  IF NOT EXISTS(select 1 from public.business_hours where organization_id=p_organization_id and is_open=true) THEN
    RAISE EXCEPTION 'at_least_one_open_day_required';
  END IF;

  INSERT INTO public.ai_settings(organization_id,assistant_name,tone,greeting,custom_rules,is_enabled)
  VALUES (
    p_organization_id,
    coalesce(nullif(btrim(p_ai->>'assistant_name'),''),'Júlia'),
    coalesce(nullif(btrim(p_ai->>'tone'),''),'amigavel'),
    coalesce(nullif(btrim(p_ai->>'greeting'),''),'Olá! Sou a recepcionista virtual. Como posso ajudar?'),
    nullif(btrim(coalesce(p_ai->>'custom_rules','')), ''),
    true
  )
  ON CONFLICT (organization_id)
  DO UPDATE SET assistant_name=excluded.assistant_name, tone=excluded.tone, greeting=excluded.greeting, custom_rules=excluded.custom_rules, is_enabled=true, updated_at=now();

  UPDATE public.organizations SET onboarding_completed=true, updated_at=now() WHERE id=p_organization_id;
  RETURN jsonb_build_object('ok',true,'professional_id',v_professional_id);
END;
$$;

REVOKE ALL ON FUNCTION public.complete_onboarding(uuid,jsonb,jsonb,jsonb,jsonb,jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(uuid,jsonb,jsonb,jsonb,jsonb,jsonb) TO authenticated;
