create or replace function public.platform_admin_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null or not public.has_role(v_user_id, 'platform_admin'::public.app_role) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'metrics', jsonb_build_object(
      'organizations', (select count(*) from public.organizations),
      'active_subscriptions', (select count(*) from public.subscriptions where status = 'active'),
      'trials', (select count(*) from public.subscriptions where status = 'trial' and (trial_ends_at is null or trial_ends_at > now())),
      'expired_trials', (select count(*) from public.subscriptions where status = 'trial' and trial_ends_at is not null and trial_ends_at <= now()),
      'past_due', (select count(*) from public.subscriptions where status = 'past_due'),
      'mrr_cents', coalesce((select sum(p.price_cents) from public.subscriptions s join public.plans p on p.id=s.plan_id where s.status='active'),0),
      'appointments_30d', (select count(*) from public.appointments where created_at >= now() - interval '30 days'),
      'conversations_30d', (select count(*) from public.conversations where created_at >= now() - interval '30 days')
    ),
    'organizations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug,
        'segment', o.segment,
        'is_blocked', o.is_blocked,
        'created_at', o.created_at,
        'subscription_status', s.status,
        'trial_ends_at', s.trial_ends_at,
        'plan_name', p.name,
        'plan_slug', p.slug,
        'members', (select count(*) from public.organization_members om where om.organization_id=o.id),
        'appointments_30d', (select count(*) from public.appointments a where a.organization_id=o.id and a.created_at >= now() - interval '30 days'),
        'conversations_30d', (select count(*) from public.conversations c where c.organization_id=o.id and c.created_at >= now() - interval '30 days')
      ) order by o.created_at desc)
      from public.organizations o
      left join public.subscriptions s on s.organization_id=o.id
      left join public.plans p on p.id=s.plan_id
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.platform_admin_overview() from public, anon;
grant execute on function public.platform_admin_overview() to authenticated;
