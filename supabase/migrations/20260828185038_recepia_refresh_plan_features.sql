update public.plans
set features = case slug
  when 'basico' then '["Recepcionista IA 24h","Agenda completa","Cadastro de clientes","Chat no site"]'::jsonb
  when 'profissional' then '["Tudo do Básico","Integração oficial com WhatsApp Cloud API","Relatórios","Base de conhecimento da IA","Múltiplos usuários"]'::jsonb
  when 'premium' then '["Tudo do Profissional","Até 30 profissionais","Relatórios avançados","Suporte prioritário"]'::jsonb
  else features
end,
updated_at = now()
where slug in ('basico','profissional','premium');
