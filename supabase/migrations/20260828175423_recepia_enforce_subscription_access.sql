create or replace function public.organization_has_service_access(p_organization_id uuid)
returns boolean
language sql
security invoker
set search_path = public
stable
as $$
  select coalesce((
    select case
      when s.status = 'active' then true
      when s.status = 'trial' then s.trial_ends_at is null or s.trial_ends_at > now()
      else false
    end
    from public.subscriptions s
    where s.organization_id = p_organization_id
    limit 1
  ), false);
$$;

grant execute on function public.organization_has_service_access(uuid) to authenticated, service_role;
revoke execute on function public.organization_has_service_access(uuid) from anon;

create or replace function public.current_plan_limits(p_organization_id uuid)
returns table (
  status text,
  max_professionals integer,
  max_appointments integer,
  max_conversations integer,
  max_messages integer,
  integrations_enabled boolean,
  ai_enabled boolean
)
language sql
security invoker
set search_path = public
stable
as $$
  select
    case
      when s.status = 'trial' and s.trial_ends_at is not null and s.trial_ends_at <= now() then 'trial_expired'
      else coalesce(s.status, 'inactive')
    end as status,
    p.max_professionals,
    p.max_appointments,
    p.max_conversations,
    p.max_messages,
    p.integrations_enabled,
    p.ai_enabled
  from public.plans p
  left join public.subscriptions s
    on s.organization_id = p_organization_id and s.plan_id = p.id
  where p.id = coalesce(
    (select s2.plan_id from public.subscriptions s2 where s2.organization_id = p_organization_id limit 1),
    (select p2.id from public.plans p2 where p2.slug = 'basico' limit 1)
  )
  limit 1;
$$;

create or replace function public.enforce_monthly_org_quota()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_limit integer;
  v_count integer;
  v_month_start timestamptz := date_trunc('month', now());
begin
  if not public.organization_has_service_access(new.organization_id) then
    raise exception 'SUBSCRIPTION_INACTIVE' using errcode='P0001';
  end if;

  if tg_table_name = 'appointments' then
    select max_appointments into v_limit from public.current_plan_limits(new.organization_id);
    select count(*) into v_count from public.appointments where organization_id = new.organization_id and created_at >= v_month_start;
    if v_limit is not null and v_count >= v_limit then raise exception 'PLAN_LIMIT_APPOINTMENTS:%',v_limit using errcode='P0001'; end if;
  elsif tg_table_name = 'conversations' then
    select max_conversations into v_limit from public.current_plan_limits(new.organization_id);
    select count(*) into v_count from public.conversations where organization_id = new.organization_id and created_at >= v_month_start;
    if v_limit is not null and v_count >= v_limit then raise exception 'PLAN_LIMIT_CONVERSATIONS:%',v_limit using errcode='P0001'; end if;
  elsif tg_table_name = 'messages' then
    select max_messages into v_limit from public.current_plan_limits(new.organization_id);
    select count(*) into v_count from public.messages where organization_id = new.organization_id and created_at >= v_month_start;
    if v_limit is not null and v_count >= v_limit then raise exception 'PLAN_LIMIT_MESSAGES:%',v_limit using errcode='P0001'; end if;
  end if;
  return new;
end;
$$;

create or replace function public.enforce_professional_quota()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_limit integer;
  v_count integer;
begin
  if new.is_active = true and (tg_op = 'INSERT' or coalesce(old.is_active,false) = false) then
    if not public.organization_has_service_access(new.organization_id) then
      raise exception 'SUBSCRIPTION_INACTIVE' using errcode='P0001';
    end if;
    select max_professionals into v_limit from public.current_plan_limits(new.organization_id);
    select count(*) into v_count from public.professionals where organization_id = new.organization_id and is_active = true;
    if v_limit is not null and v_count >= v_limit then
      raise exception 'PLAN_LIMIT_PROFESSIONALS:%', v_limit using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;
