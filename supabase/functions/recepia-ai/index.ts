import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { formatInTimeZone, fromZonedTime } from "https://esm.sh/date-fns-tz@3.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MessageRow = { role: "client" | "ai" | "agent" | "system"; content: string };
type FunctionCall = { type: "function_call"; call_id: string; name: string; arguments: string };
type OpenAIResponse = { id?: string; output_text?: string; output?: Array<Record<string, unknown>> };
type ServiceRow = { id: string; name: string; description: string | null; price_cents: number; duration_minutes: number; professional_id: string | null };
type ProfessionalRow = { id: string; name: string; role_title: string | null };
type HoursRow = { weekday: number; is_open: boolean; opens_at: string; closes_at: string; break_start: string | null; break_end: string | null };

type ToolContext = {
  admin: ReturnType<typeof createClient>;
  organizationId: string;
  conversationId: string;
  clientId: string | null;
  contactName: string | null;
  contactPhone: string | null;
  timezone: string;
  services: ServiceRow[];
  professionals: ProfessionalRow[];
  businessHours: HoursRow[];
};

function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
function extractOutputText(payload: OpenAIResponse) {
  if (payload.output_text?.trim()) return payload.output_text.trim();
  for (const item of payload.output ?? []) {
    const content = Array.isArray(item.content) ? item.content as Array<Record<string, unknown>> : [];
    for (const part of content) if (part.type === "output_text" && typeof part.text === "string" && part.text.trim()) return part.text.trim();
  }
  return "";
}
function hhmm(value: string) { return value.slice(0, 5); }
function minutes(value: string) { const [h, m] = value.slice(0, 5).split(":").map(Number); return h * 60 + m; }
function weekdayForDate(date: string, timezone: string) { const midday = fromZonedTime(`${date}T12:00:00`, timezone); return Number(formatInTimeZone(midday, timezone, "i")); }
function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) { return startA < endB && endA > startB; }

async function loadProfessionalHours(ctx: ToolContext, professionalId: string, weekday: number) {
  const { data } = await ctx.admin.from("professional_hours").select("weekday,is_open,opens_at,closes_at").eq("organization_id", ctx.organizationId).eq("professional_id", professionalId).eq("weekday", weekday).maybeSingle();
  return data as { weekday: number; is_open: boolean; opens_at: string; closes_at: string } | null;
}

async function resolveClientId(ctx: ToolContext) {
  if (ctx.clientId) return ctx.clientId;
  const phone = ctx.contactPhone?.trim();
  if (!phone) return null;
  const { data } = await ctx.admin.from("clients").select("id").eq("organization_id", ctx.organizationId).eq("phone", phone).maybeSingle();
  return data?.id ?? null;
}

async function availableSlots(ctx: ToolContext, args: { service_id: string; professional_id: string | null; date: string; exclude_appointment_id?: string | null }) {
  const service = ctx.services.find((item) => item.id === args.service_id);
  if (!service) return { ok: false, error: "Serviço inválido" };
  const weekday = weekdayForDate(args.date, ctx.timezone);
  const orgHours = ctx.businessHours.find((item) => item.weekday === weekday);
  if (!orgHours?.is_open) return { ok: true, slots: [], message: "A empresa não atende nesta data." };

  let candidates = ctx.professionals;
  if (service.professional_id) candidates = candidates.filter((p) => p.id === service.professional_id);
  if (args.professional_id) candidates = candidates.filter((p) => p.id === args.professional_id);
  if (!candidates.length) return { ok: true, slots: [], message: "Nenhum profissional disponível para este serviço." };

  const dayStart = fromZonedTime(`${args.date}T00:00:00`, ctx.timezone);
  const dayEnd = fromZonedTime(`${args.date}T23:59:59`, ctx.timezone);
  const { data: appointments } = await ctx.admin.from("appointments").select("id,professional_id,starts_at,ends_at").eq("organization_id", ctx.organizationId).neq("status", "cancelado").gte("starts_at", dayStart.toISOString()).lte("starts_at", dayEnd.toISOString());
  const now = new Date();
  const results: Array<{ professional_id: string; professional_name: string; date: string; time: string; starts_at: string }> = [];

  for (const professional of candidates) {
    const professionalHours = await loadProfessionalHours(ctx, professional.id, weekday);
    if (professionalHours && !professionalHours.is_open) continue;
    const openingMinutes = Math.max(minutes(hhmm(professionalHours?.opens_at ?? orgHours.opens_at)), minutes(hhmm(orgHours.opens_at)));
    const closingMinutes = Math.min(minutes(hhmm(professionalHours?.closes_at ?? orgHours.closes_at)), minutes(hhmm(orgHours.closes_at)));
    const breakStart = orgHours.break_start ? minutes(hhmm(orgHours.break_start)) : null;
    const breakEnd = orgHours.break_end ? minutes(hhmm(orgHours.break_end)) : null;

    for (let cursor = openingMinutes; cursor + service.duration_minutes <= closingMinutes; cursor += 30) {
      if (breakStart !== null && breakEnd !== null && cursor < breakEnd && cursor + service.duration_minutes > breakStart) continue;
      const hour = String(Math.floor(cursor / 60)).padStart(2, "0");
      const minute = String(cursor % 60).padStart(2, "0");
      const start = fromZonedTime(`${args.date}T${hour}:${minute}:00`, ctx.timezone);
      const end = new Date(start.getTime() + service.duration_minutes * 60_000);
      if (start <= now) continue;
      const conflict = (appointments ?? []).some((item) => item.id !== args.exclude_appointment_id && item.professional_id === professional.id && overlaps(start, end, new Date(item.starts_at), new Date(item.ends_at)));
      if (!conflict) results.push({ professional_id: professional.id, professional_name: professional.name, date: args.date, time: `${hour}:${minute}`, starts_at: start.toISOString() });
      if (results.length >= 5) break;
    }
    if (results.length >= 5) break;
  }
  return { ok: true, service: { id: service.id, name: service.name, duration_minutes: service.duration_minutes }, slots: results.slice(0, 5) };
}

async function createBooking(ctx: ToolContext, args: { service_id: string; professional_id: string; date: string; time: string; client_name: string; client_phone: string }) {
  const service = ctx.services.find((item) => item.id === args.service_id);
  const professional = ctx.professionals.find((item) => item.id === args.professional_id);
  if (!service || !professional) return { ok: false, error: "Serviço ou profissional inválido" };
  if (service.professional_id && service.professional_id !== professional.id) return { ok: false, error: "Este profissional não atende o serviço escolhido" };
  const availability = await availableSlots(ctx, { service_id: service.id, professional_id: professional.id, date: args.date });
  const selected = availability.ok ? availability.slots?.find((slot: { time: string }) => slot.time === args.time) : null;
  if (!selected) return { ok: false, error: "Esse horário não está mais disponível. Consulte os horários novamente." };

  const startsAt = fromZonedTime(`${args.date}T${args.time}:00`, ctx.timezone);
  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60_000);
  let clientId = await resolveClientId(ctx);
  const phone = (args.client_phone || ctx.contactPhone || "").trim();
  const name = (args.client_name || ctx.contactName || "Cliente").trim();
  if (!clientId && phone) {
    const { data: existing } = await ctx.admin.from("clients").select("id").eq("organization_id", ctx.organizationId).eq("phone", phone).maybeSingle();
    clientId = existing?.id ?? null;
  }
  if (!clientId) {
    const { data: created, error: clientError } = await ctx.admin.from("clients").insert({ organization_id: ctx.organizationId, name, phone: phone || null, status: "novo" }).select("id").single();
    if (clientError || !created) return { ok: false, error: "Não foi possível cadastrar o cliente." };
    clientId = created.id;
  }
  if (clientId !== ctx.clientId) await ctx.admin.from("conversations").update({ client_id: clientId }).eq("id", ctx.conversationId);

  const { data: appointment, error } = await ctx.admin.from("appointments").insert({ organization_id: ctx.organizationId, client_id: clientId, service_id: service.id, professional_id: professional.id, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), status: "agendado", created_by_ai: true }).select("id,starts_at,ends_at,status").single();
  if (error || !appointment) return { ok: false, error: "Não foi possível concluir o agendamento. O horário pode ter acabado de ser ocupado." };
  return { ok: true, appointment: { ...appointment, service: service.name, professional: professional.name, date: args.date, time: args.time } };
}

async function listClientAppointments(ctx: ToolContext) {
  const clientId = await resolveClientId(ctx);
  if (!clientId) return { ok: true, appointments: [], message: "Não foi possível identificar um cliente cadastrado para esta conversa." };
  const { data } = await ctx.admin.from("appointments").select("id,starts_at,ends_at,status,service_id,professional_id,services(name),professionals(name)").eq("organization_id", ctx.organizationId).eq("client_id", clientId).neq("status", "cancelado").gte("starts_at", new Date().toISOString()).order("starts_at").limit(8);
  return { ok: true, appointments: (data ?? []).map((item) => ({ id: item.id, starts_at: item.starts_at, ends_at: item.ends_at, status: item.status, service_id: item.service_id, service_name: item.services?.name, professional_id: item.professional_id, professional_name: item.professionals?.name, local_date: formatInTimeZone(new Date(item.starts_at), ctx.timezone, "yyyy-MM-dd"), local_time: formatInTimeZone(new Date(item.starts_at), ctx.timezone, "HH:mm") })) };
}

async function cancelBooking(ctx: ToolContext, args: { appointment_id: string }) {
  const clientId = await resolveClientId(ctx);
  if (!clientId) return { ok: false, error: "Cliente não identificado." };
  const { data: appointment } = await ctx.admin.from("appointments").select("id,status,starts_at,services(name),professionals(name)").eq("id", args.appointment_id).eq("organization_id", ctx.organizationId).eq("client_id", clientId).maybeSingle();
  if (!appointment) return { ok: false, error: "Agendamento não encontrado para este cliente." };
  if (appointment.status === "cancelado") return { ok: false, error: "Este agendamento já está cancelado." };
  if (new Date(appointment.starts_at) <= new Date()) return { ok: false, error: "Não é possível cancelar um agendamento que já começou." };
  const { error } = await ctx.admin.from("appointments").update({ status: "cancelado" }).eq("id", appointment.id);
  if (error) return { ok: false, error: "Não foi possível cancelar o agendamento." };
  return { ok: true, appointment: { id: appointment.id, service: appointment.services?.name, professional: appointment.professionals?.name, local_date: formatInTimeZone(new Date(appointment.starts_at), ctx.timezone, "dd/MM/yyyy"), local_time: formatInTimeZone(new Date(appointment.starts_at), ctx.timezone, "HH:mm") } };
}

async function rescheduleBooking(ctx: ToolContext, args: { appointment_id: string; professional_id: string; date: string; time: string }) {
  const clientId = await resolveClientId(ctx);
  if (!clientId) return { ok: false, error: "Cliente não identificado." };
  const { data: appointment } = await ctx.admin.from("appointments").select("id,status,service_id,professional_id,starts_at,services(name,duration_minutes)").eq("id", args.appointment_id).eq("organization_id", ctx.organizationId).eq("client_id", clientId).maybeSingle();
  if (!appointment || !appointment.service_id) return { ok: false, error: "Agendamento não encontrado para este cliente." };
  if (appointment.status === "cancelado") return { ok: false, error: "Agendamentos cancelados não podem ser remarcados." };
  if (new Date(appointment.starts_at) <= new Date()) return { ok: false, error: "Não é possível remarcar um agendamento que já começou." };

  const service = ctx.services.find((item) => item.id === appointment.service_id);
  if (!service) return { ok: false, error: "O serviço deste agendamento não está mais ativo." };
  const availability = await availableSlots(ctx, { service_id: service.id, professional_id: args.professional_id, date: args.date, exclude_appointment_id: appointment.id });
  const selected = availability.ok ? availability.slots?.find((slot: { time: string; professional_id: string }) => slot.time === args.time && slot.professional_id === args.professional_id) : null;
  if (!selected) return { ok: false, error: "O novo horário não está disponível. Consulte novos horários." };

  const startsAt = fromZonedTime(`${args.date}T${args.time}:00`, ctx.timezone);
  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60_000);
  const { data: updated, error } = await ctx.admin.from("appointments").update({ professional_id: args.professional_id, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), status: "agendado" }).eq("id", appointment.id).select("id,starts_at,ends_at,status").single();
  if (error || !updated) return { ok: false, error: "Não foi possível remarcar. O horário pode ter acabado de ser ocupado." };
  const professional = ctx.professionals.find((item) => item.id === args.professional_id);
  return { ok: true, appointment: { ...updated, service: service.name, professional: professional?.name, date: args.date, time: args.time } };
}

async function callOpenAI(apiKey: string, model: string, body: Record<string, unknown>) {
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, max_output_tokens: 650, parallel_tool_calls: false, ...body }) });
  if (!response.ok) { console.error("OpenAI error", response.status, await response.text()); throw new Error("OPENAI_ERROR"); }
  return await response.json() as OpenAIResponse;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  const openaiModel = Deno.env.get("OPENAI_MODEL") || "gpt-5.6-luna";
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase não configurado" }, 500);
  if (!openaiApiKey) return json({ error: "OPENAI_API_KEY não configurada" }, 500);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Não autenticado" }, 401);
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Sessão inválida" }, 401);

  let body: { conversationId?: string };
  try { body = await req.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  if (!body.conversationId) return json({ error: "conversationId é obrigatório" }, 400);
  const { data: conversation } = await admin.from("conversations").select("id,organization_id,status,contact_name,contact_phone,client_id").eq("id", body.conversationId).maybeSingle();
  if (!conversation) return json({ error: "Conversa não encontrada" }, 404);
  if (conversation.status !== "ia") return json({ error: "A conversa não está sob atendimento da IA" }, 409);
  const { data: membership } = await admin.from("organization_members").select("id").eq("organization_id", conversation.organization_id).eq("user_id", userData.user.id).maybeSingle();
  if (!membership) return json({ error: "Sem acesso a esta organização" }, 403);

  const [orgRes, settingsRes, servicesRes, professionalsRes, hoursRes, faqRes, messagesRes] = await Promise.all([
    admin.from("organizations").select("name,segment,phone,email,address,city,state,description,policies,timezone").eq("id", conversation.organization_id).single(),
    admin.from("ai_settings").select("assistant_name,tone,greeting,custom_rules,is_enabled").eq("organization_id", conversation.organization_id).maybeSingle(),
    admin.from("services").select("id,name,description,price_cents,duration_minutes,professional_id").eq("organization_id", conversation.organization_id).eq("is_active", true).order("name"),
    admin.from("professionals").select("id,name,role_title").eq("organization_id", conversation.organization_id).eq("is_active", true).order("name"),
    admin.from("business_hours").select("weekday,is_open,opens_at,closes_at,break_start,break_end").eq("organization_id", conversation.organization_id).order("weekday"),
    admin.from("faqs").select("question,answer").eq("organization_id", conversation.organization_id).order("created_at"),
    admin.from("messages").select("role,content").eq("conversation_id", conversation.id).order("created_at", { ascending: false }).limit(24),
  ]);
  const settings = settingsRes.data;
  if (settings?.is_enabled === false) return json({ error: "A IA está desativada para esta empresa" }, 409);
  const history = ((messagesRes.data ?? []) as MessageRow[]).reverse();
  if (!history.length || history.at(-1)?.role !== "client") return json({ error: "A última mensagem precisa ser do cliente" }, 409);

  const organization = orgRes.data;
  const services = (servicesRes.data ?? []) as ServiceRow[];
  const professionals = (professionalsRes.data ?? []) as ProfessionalRow[];
  const businessHours = (hoursRes.data ?? []) as HoursRow[];
  const timezone = organization?.timezone || "America/Sao_Paulo";
  const fallback = "Não tenho essa informação no momento. Posso encaminhar você para nossa equipe.";

  const instructions = `Você é ${settings?.assistant_name || "Júlia"}, recepcionista virtual da empresa ${organization?.name || "empresa"}.
Responda em português do Brasil, com tom ${settings?.tone || "amigável"}, de forma curta, acolhedora e profissional.
REGRAS:
- Nunca invente preços, serviços, profissionais, políticas, horários ou disponibilidade.
- Para disponibilidade, SEMPRE use list_available_slots.
- Para localizar compromissos do cliente antes de cancelar ou remarcar, SEMPRE use list_client_appointments.
- Ofereça no máximo 3 horários por mensagem.
- create_appointment só pode ser usado após confirmação explícita do cliente para serviço + profissional + data + hora.
- cancel_appointment só pode ser usado depois de identificar inequivocamente o agendamento e o cliente confirmar explicitamente que deseja cancelar.
- Para remarcação: primeiro identifique o agendamento; depois consulte o novo horário com list_available_slots; só use reschedule_appointment após o cliente confirmar explicitamente o novo horário.
- Nunca cancele ou remarque por inferência, sugestão ou pergunta do cliente.
- Se houver mais de um agendamento possível, mostre opções sem revelar dados de terceiros e peça ao cliente qual deles deseja alterar.
- Se faltar nome ou telefone para novo agendamento, peça apenas o dado que falta, uma pergunta por vez.
- Após qualquer operação, só confirme sucesso se a ferramenta retornar ok=true.
- Não dê diagnósticos ou orientações médicas.
- Se a resposta não estiver no contexto, use: "${fallback}"
${settings?.custom_rules ? `- Regras da empresa: ${settings.custom_rules}` : ""}
DADOS DA EMPRESA:
${JSON.stringify({ organization, services: services.map((s) => ({ id: s.id, name: s.name, description: s.description, price: s.price_cents / 100, duration_minutes: s.duration_minutes, professional_id: s.professional_id })), professionals, business_hours: businessHours, faq: faqRes.data ?? [], current_datetime: new Date().toISOString(), timezone, known_contact: { name: conversation.contact_name, phone: conversation.contact_phone } })}`;

  const tools = [
    { type: "function", name: "list_available_slots", description: "Consulta horários realmente livres para um serviço em uma data.", strict: true, parameters: { type: "object", properties: { service_id: { type: "string" }, professional_id: { type: ["string", "null"] }, date: { type: "string", description: "YYYY-MM-DD" } }, required: ["service_id", "professional_id", "date"], additionalProperties: false } },
    { type: "function", name: "create_appointment", description: "Cria agendamento após confirmação explícita do cliente.", strict: true, parameters: { type: "object", properties: { service_id: { type: "string" }, professional_id: { type: "string" }, date: { type: "string" }, time: { type: "string" }, client_name: { type: "string" }, client_phone: { type: "string" } }, required: ["service_id", "professional_id", "date", "time", "client_name", "client_phone"], additionalProperties: false } },
    { type: "function", name: "list_client_appointments", description: "Lista os próximos agendamentos do cliente desta conversa para identificar qual deve ser alterado.", strict: true, parameters: { type: "object", properties: {}, required: [], additionalProperties: false } },
    { type: "function", name: "cancel_appointment", description: "Cancela um agendamento futuro identificado, somente após confirmação explícita do cliente.", strict: true, parameters: { type: "object", properties: { appointment_id: { type: "string" } }, required: ["appointment_id"], additionalProperties: false } },
    { type: "function", name: "reschedule_appointment", description: "Remarca um agendamento futuro para um horário previamente consultado e confirmado pelo cliente.", strict: true, parameters: { type: "object", properties: { appointment_id: { type: "string" }, professional_id: { type: "string" }, date: { type: "string", description: "YYYY-MM-DD" }, time: { type: "string", description: "HH:MM" } }, required: ["appointment_id", "professional_id", "date", "time"], additionalProperties: false } },
  ];

  const toolContext: ToolContext = { admin, organizationId: conversation.organization_id, conversationId: conversation.id, clientId: conversation.client_id, contactName: conversation.contact_name, contactPhone: conversation.contact_phone, timezone, services, professionals, businessHours };
  let input: Array<Record<string, unknown>> = history.map((message) => ({ role: message.role === "client" ? "user" : "assistant", content: message.content }));
  let response: OpenAIResponse;
  try {
    response = await callOpenAI(openaiApiKey, openaiModel, { instructions, input, tools, tool_choice: "auto" });
    for (let round = 0; round < 5; round++) {
      const calls = (response.output ?? []).filter((item) => item.type === "function_call") as FunctionCall[];
      if (!calls.length) break;
      input = [...input, ...(response.output ?? [])];
      for (const call of calls) {
        let result: unknown;
        try {
          const args = JSON.parse(call.arguments || "{}");
          if (call.name === "list_available_slots") result = await availableSlots(toolContext, args);
          else if (call.name === "create_appointment") result = await createBooking(toolContext, args);
          else if (call.name === "list_client_appointments") result = await listClientAppointments(toolContext);
          else if (call.name === "cancel_appointment") result = await cancelBooking(toolContext, args);
          else if (call.name === "reschedule_appointment") result = await rescheduleBooking(toolContext, args);
          else result = { ok: false, error: "Função desconhecida" };
        } catch (error) { console.error("Tool error", call.name, error); result = { ok: false, error: "Não foi possível executar esta operação." }; }
        input.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) });
      }
      response = await callOpenAI(openaiApiKey, openaiModel, { instructions, input, tools, tool_choice: "auto" });
    }
  } catch { return json({ error: "Não foi possível gerar a resposta da IA" }, 502); }

  const answer = extractOutputText(response!);
  if (!answer) return json({ error: "A IA não retornou uma resposta utilizável" }, 502);
  const { data: inserted, error: insertError } = await admin.from("messages").insert({ organization_id: conversation.organization_id, conversation_id: conversation.id, role: "ai", content: answer, metadata: { provider: "openai", model: openaiModel } }).select("id,role,content,created_at").single();
  if (insertError) return json({ error: "Resposta gerada, mas não foi possível salvá-la" }, 500);
  await admin.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversation.id);
  return json({ message: inserted });
});
