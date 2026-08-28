create or replace function public.attach_ai_appointment_source_conversation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.created_by_ai = true and new.source_conversation_id is null and new.client_id is not null then
    select c.id into new.source_conversation_id
    from public.conversations c
    where c.organization_id = new.organization_id
      and c.client_id = new.client_id
      and c.status <> 'encerrada'
      and c.last_message_at >= now() - interval '30 minutes'
    order by c.last_message_at desc
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_attach_ai_source_conversation on public.appointments;
create trigger appointments_attach_ai_source_conversation
before insert on public.appointments
for each row execute function public.attach_ai_appointment_source_conversation();

create index if not exists appointments_org_source_conversation_idx
  on public.appointments(organization_id, source_conversation_id)
  where source_conversation_id is not null;
