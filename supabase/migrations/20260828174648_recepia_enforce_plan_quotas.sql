CREATE OR REPLACE FUNCTION public.current_plan_limits(p_organization_id uuid)
RETURNS TABLE (
  status text,
  max_professionals integer,
  max_appointments integer,
  max_conversations integer,
  max_messages integer,
  integrations_enabled boolean,
  ai_enabled boolean
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
  SELECT
    coalesce(s.status, 'trial') AS status,
    p.max_professionals,
    p.max_appointments,
    p.max_conversations,
    p.max_messages,
    p.integrations_enabled,
    p.ai_enabled
  FROM public.plans p
  LEFT JOIN public.subscriptions s
    ON s.organization_id = p_organization_id AND s.plan_id = p.id
  WHERE p.id = coalesce(
    (SELECT s2.plan_id FROM public.subscriptions s2 WHERE s2.organization_id = p_organization_id LIMIT 1),
    (SELECT p2.id FROM public.plans p2 WHERE p2.slug = 'basico' LIMIT 1)
  )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_plan_limits(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.current_plan_limits(uuid) FROM anon;

CREATE OR REPLACE FUNCTION public.enforce_professional_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_count integer;
BEGIN
  IF new.is_active = true AND (tg_op = 'INSERT' OR coalesce(old.is_active,false) = false) THEN
    SELECT max_professionals INTO v_limit FROM public.current_plan_limits(new.organization_id);
    SELECT count(*) INTO v_count FROM public.professionals WHERE organization_id = new.organization_id AND is_active = true;
    IF v_limit IS NOT NULL AND v_count >= v_limit THEN
      RAISE EXCEPTION 'PLAN_LIMIT_PROFESSIONALS:%', v_limit USING errcode = 'P0001';
    END IF;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS professionals_plan_quota ON public.professionals;
CREATE TRIGGER professionals_plan_quota BEFORE INSERT OR UPDATE OF is_active ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.enforce_professional_quota();

CREATE OR REPLACE FUNCTION public.enforce_monthly_org_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_count integer;
  v_month_start timestamptz := date_trunc('month', now());
BEGIN
  IF tg_table_name = 'appointments' THEN
    SELECT max_appointments INTO v_limit FROM public.current_plan_limits(new.organization_id);
    SELECT count(*) INTO v_count FROM public.appointments WHERE organization_id = new.organization_id AND created_at >= v_month_start;
    IF v_limit IS NOT NULL AND v_count >= v_limit THEN RAISE EXCEPTION 'PLAN_LIMIT_APPOINTMENTS:%',v_limit USING errcode='P0001'; END IF;
  ELSIF tg_table_name = 'conversations' THEN
    SELECT max_conversations INTO v_limit FROM public.current_plan_limits(new.organization_id);
    SELECT count(*) INTO v_count FROM public.conversations WHERE organization_id = new.organization_id AND created_at >= v_month_start;
    IF v_limit IS NOT NULL AND v_count >= v_limit THEN RAISE EXCEPTION 'PLAN_LIMIT_CONVERSATIONS:%',v_limit USING errcode='P0001'; END IF;
  ELSIF tg_table_name = 'messages' THEN
    SELECT max_messages INTO v_limit FROM public.current_plan_limits(new.organization_id);
    SELECT count(*) INTO v_count FROM public.messages WHERE organization_id = new.organization_id AND created_at >= v_month_start;
    IF v_limit IS NOT NULL AND v_count >= v_limit THEN RAISE EXCEPTION 'PLAN_LIMIT_MESSAGES:%',v_limit USING errcode='P0001'; END IF;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS appointments_plan_quota ON public.appointments;
CREATE TRIGGER appointments_plan_quota BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.enforce_monthly_org_quota();
DROP TRIGGER IF EXISTS conversations_plan_quota ON public.conversations;
CREATE TRIGGER conversations_plan_quota BEFORE INSERT ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.enforce_monthly_org_quota();
DROP TRIGGER IF EXISTS messages_plan_quota ON public.messages;
CREATE TRIGGER messages_plan_quota BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.enforce_monthly_org_quota();

CREATE OR REPLACE FUNCTION public.enforce_integration_entitlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_enabled boolean;
BEGIN
  IF new.provider = 'whatsapp_cloud' THEN
    SELECT status, integrations_enabled INTO v_status, v_enabled FROM public.current_plan_limits(new.organization_id);
    IF coalesce(v_status,'trial') <> 'trial' AND coalesce(v_enabled,false) = false THEN
      RAISE EXCEPTION 'PLAN_FEATURE_INTEGRATIONS_REQUIRED' USING errcode='P0001';
    END IF;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS integrations_plan_entitlement ON public.integrations;
CREATE TRIGGER integrations_plan_entitlement BEFORE INSERT OR UPDATE OF provider,organization_id ON public.integrations
FOR EACH ROW EXECUTE FUNCTION public.enforce_integration_entitlement();
