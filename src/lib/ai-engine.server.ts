import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { computeSlots, formatSlot, type HourRow } from "@/lib/scheduling";
import { SEGMENT_LABEL, formatMoney } from "@/lib/segments";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-5.6-sol";

type ToolResult = Record<string, unknown>;

type ToolArgs = {
  date?: string;
  service_id?: string;
  professional_id?: string;
  name?: string;
  phone?: string;
  email?: string;
  starts_at?: string;
  client_name?: string;
  client_phone?: string;
  appointment_id?: string;
  reason?: string;
};

const TOOLS = [
  {
    type: "function",
    name: "get_services",
    description: "Lista os serviços ativos da empresa com preço e duração.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "get_professionals",
    description: "Lista os profissionais ativos da empresa.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "get_business_hours",
    description: "Retorna os horários de funcionamento da empresa.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "check_availability",
    description:
      "Consulta horários realmente disponíveis para uma data (formato AAAA-MM-DD) e um serviço. Use sempre antes de oferecer horários.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "Data desejada no formato AAAA-MM-DD" },
        service_id: { type: "string", description: "ID do serviço" },
        professional_id: { type: "string", description: "ID do profissional (opcional)" },
      },
      required: ["date", "service_id"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "create_client",
    description: "Cadastra ou atualiza o cliente pelo telefone.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
      },
      required: ["name", "phone"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "create_appointment",
    description: "Cria o agendamento somente depois que o cliente confirmar o horário exato.",
    parameters: {
      type: "object",
      properties: {
        starts_at: { type: "string", description: "Início em ISO 8601, exatamente um dos horários disponíveis" },
        service_id: { type: "string" },
        professional_id: { type: "string" },
        client_name: { type: "string" },
        client_phone: { type: "string" },
      },
      required: ["starts_at", "service_id", "client_name", "client_phone"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_client_appointments",
    description: "Busca os próximos agendamentos de um cliente pelo telefone.",
    parameters: {
      type: "object",
      properties: { phone: { type: "string" } },
      required: ["phone"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "cancel_appointment",
    description: "Cancela um agendamento após confirmação explícita do cliente.",
    parameters: {
      type: "object",
      properties: { appointment_id: { type: "string" } },
      required: ["appointment_id"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "reschedule_appointment",
    description: "Reagenda um agendamento para um novo horário disponível já confirmado pelo cliente.",
    parameters: {
      type: "object",
      properties: { appointment_id: { type: "string" }, starts_at: { type: "string" } },
      required: ["appointment_id", "starts_at"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "transfer_to_human",
    description: "Encaminha a conversa para a equipe humana.",
    parameters: {
      type: "object",
      properties: { reason: { type: "string" } },
      required: ["reason"],
      additionalProperties: false,
    },
  },
];

async function loadContext(organizationId: string) {
  const db = supabaseAdmin;
  const [org, ai, services, professionals, hours, faqs] = await Promise.all([
    db.from("organizations").select("*").eq("id", organizationId).maybeSingle(),
    db.from("ai_settings").select("*").eq("organization_id", organizationId).maybeSingle(),
    db.from("services").select("*").eq("organization_id", organizationId).eq("is_active", true),
    db.from("professionals").select("*").eq("organization_id", organizationId).eq("is_active", true),
    db.from("business_hours").select("*").eq("organization_id", organizationId),
    db.from("faqs").select("question, answer").eq("organization_id", organizationId),
  ]);
  return {
    org: org.data,
    ai: ai.data,
    services: services.data ?? [],
    professionals: professionals.data ?? [],
    hours: (hours.data ?? []) as HourRow[],
    faqs: faqs.data ?? [],
  };
}

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function buildSystemPrompt(ctx: Awaited<ReturnType<typeof loadContext>>) {
  const org = ctx.org;
  const name = ctx.ai?.assistant_name ?? "Recepcionista";
  const tone = ctx.ai?.tone ?? "amigavel";
  const hoursText = ctx.hours
    .slice()
    .sort((a, b) => a.weekday - b.weekday)
    .map((h) =>
      h.is_open
        ? `${DAYS[h.weekday]}: ${h.opens_at.slice(0, 5)} às ${h.closes_at.slice(0, 5)}${
            h.break_start ? ` (intervalo ${h.break_start.slice(0, 5)}-${h.break_end?.slice(0, 5)})` : ""
          }`
        : `${DAYS[h.weekday]}: fechado`,
    )
    .join("\n");

  const servicesText = ctx.services
    .map((s) => `- ${s.name} (id: ${s.id}) — ${formatMoney(s.price_cents)} — ${s.duration_minutes} min`)
    .join("\n");
  const proText = ctx.professionals.map((p) => `- ${p.name} (id: ${p.id})${p.role_title ? ` — ${p.role_title}` : ""}`).join("\n");
  const faqText = ctx.faqs.map((f) => `P: ${f.question}\nR: ${f.answer}`).join("\n\n");

  return `Você é ${name}, recepcionista virtual da empresa "${org?.name}" (${SEGMENT_LABEL[(org?.segment ?? "outro") as keyof typeof SEGMENT_LABEL]}).
Tom de voz: ${tone}. Responda sempre em português do Brasil, de forma curta, clara e educada. Data e hora atual: ${new Date().toLocaleString("pt-BR")}.

Sobre a empresa:
${org?.description ?? "—"}
Telefone: ${org?.phone ?? "—"} | Endereço: ${[org?.address, org?.city, org?.state].filter(Boolean).join(", ") || "—"}
${org?.policies ? `Políticas: ${org.policies}` : ""}

Horários de funcionamento:
${hoursText || "Não informado"}

Serviços:
${servicesText || "Nenhum serviço cadastrado"}

Profissionais:
${proText || "Nenhum profissional cadastrado"}

Base de conhecimento:
${faqText || "—"}

${ctx.ai?.custom_rules ? `Regras específicas da empresa:\n${ctx.ai.custom_rules}` : ""}

REGRAS OBRIGATÓRIAS:
- Nunca invente horários, preços, serviços ou profissionais. Use somente as ferramentas e os dados acima.
- Sempre use check_availability antes de oferecer horários e ofereça no máximo 5 opções.
- Só chame create_appointment depois que o cliente confirmar explicitamente o horário, e depois de ter nome e telefone.
- Só cancele após confirmação explícita.
- Nunca exponha dados de outros clientes.
- Nunca dê diagnóstico, orientação médica ou substitua um profissional de saúde.
- Se não souber algo, responda: "Não tenho essa informação no momento. Posso encaminhar você para nossa equipe." e ofereça transfer_to_human.
- Mantenha as respostas com no máximo 4 linhas quando possível.`;
}

async function runTool(
  organizationId: string,
  conversationId: string | null,
  name: string,
  args: ToolArgs,
  ctx: Awaited<ReturnType<typeof loadContext>>,
): Promise<ToolResult> {
  const db = supabaseAdmin;

  switch (name) {
    case "get_services":
      return {
        services: ctx.services.map((s) => ({
          id: s.id,
          nome: s.name,
          preco: formatMoney(s.price_cents),
          duracao_min: s.duration_minutes,
        })),
      };
    case "get_professionals":
      return { professionals: ctx.professionals.map((p) => ({ id: p.id, nome: p.name, cargo: p.role_title })) };
    case "get_business_hours":
      return { hours: ctx.hours };
    case "check_availability": {
      const service = ctx.services.find((s) => s.id === args.service_id);
      if (!service) return { error: "Serviço não encontrado." };
      const date = args.date ?? "";
      const weekday = new Date(`${date}T12:00:00`).getDay();
      const hours = ctx.hours.find((h) => h.weekday === weekday);
      const dayStart = new Date(`${date}T00:00:00`).toISOString();
      const dayEnd = new Date(`${date}T23:59:59`).toISOString();
      let q = db
        .from("appointments")
        .select("starts_at, ends_at, professional_id")
        .eq("organization_id", organizationId)
        .gte("starts_at", dayStart)
        .lte("starts_at", dayEnd)
        .neq("status", "cancelado");
      const { data: busy } = await q;
      const filtered = (busy ?? []).filter((b) =>
        args.professional_id ? b.professional_id === args.professional_id : true,
      );
      const slots = computeSlots({
        date,
        hours,
        durationMinutes: service.duration_minutes,
        busy: filtered,
      }).slice(0, 5);
      return {
        date,
        service: service.name,
        available: slots.map((s) => ({ iso: s, horario: formatSlot(s) })),
        message: slots.length ? undefined : "Sem horários disponíveis nesta data.",
      };
    }
    case "create_client": {
      const { data } = await db
        .from("clients")
        .upsert(
          {
            organization_id: organizationId,
            name: args.name ?? "",
            phone: args.phone ?? "",
            email: args.email ?? null,
          },
          { onConflict: "id" },
        )
        .select("id")
        .maybeSingle();
      return { client_id: data?.id };
    }
    case "create_appointment": {
      const service = ctx.services.find((s) => s.id === args.service_id);
      if (!service) return { error: "Serviço não encontrado." };
      const start = new Date(args.starts_at ?? "");
      const end = new Date(start.getTime() + service.duration_minutes * 60000);

      const { data: conflicts } = await db
        .from("appointments")
        .select("id, professional_id")
        .eq("organization_id", organizationId)
        .neq("status", "cancelado")
        .lt("starts_at", end.toISOString())
        .gt("ends_at", start.toISOString());
      const relevant = (conflicts ?? []).filter((c) =>
        args.professional_id ? c.professional_id === args.professional_id : true,
      );
      if (relevant.length > 0) return { error: "Esse horário acabou de ser ocupado. Ofereça outro horário." };

      let clientId: string | null = null;
      const { data: existing } = await db
        .from("clients")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("phone", args.client_phone ?? "")
        .maybeSingle();
      if (existing) {
        clientId = existing.id;
      } else {
        const { data: created } = await db
          .from("clients")
          .insert({ organization_id: organizationId, name: args.client_name ?? "", phone: args.client_phone ?? "" })
          .select("id")
          .maybeSingle();
        clientId = created?.id ?? null;
      }

      const { data: appt, error } = await db
        .from("appointments")
        .insert({
          organization_id: organizationId,
          client_id: clientId,
          service_id: service.id,
          professional_id: args.professional_id ?? service.professional_id ?? null,
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
          status: "agendado",
          created_by_ai: true,
        })
        .select("id")
        .maybeSingle();
      if (error) return { error: "Não foi possível criar o agendamento." };

      if (conversationId) await db.from("conversations").update({ client_id: clientId }).eq("id", conversationId);
      await db.from("notifications").insert({
        organization_id: organizationId,
        type: "novo_agendamento",
        title: "Novo agendamento pela IA",
        body: `${args.client_name} — ${service.name} em ${start.toLocaleString("pt-BR")}`,
      });
      return { appointment_id: appt?.id, confirmado: true, horario: start.toLocaleString("pt-BR") };
    }
    case "get_client_appointments": {
      const { data: client } = await db
        .from("clients")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("phone", args.phone ?? "")
        .maybeSingle();
      if (!client) return { appointments: [] };
      const { data: appts } = await db
        .from("appointments")
        .select("id, starts_at, status, service_id")
        .eq("organization_id", organizationId)
        .eq("client_id", client.id)
        .gte("starts_at", new Date().toISOString())
        .neq("status", "cancelado")
        .order("starts_at");
      return {
        appointments: (appts ?? []).map((a) => ({
          id: a.id,
          quando: new Date(a.starts_at).toLocaleString("pt-BR"),
          servico: ctx.services.find((s) => s.id === a.service_id)?.name,
          status: a.status,
        })),
      };
    }
    case "cancel_appointment": {
      await db
        .from("appointments")
        .update({ status: "cancelado" })
        .eq("id", args.appointment_id ?? "")
        .eq("organization_id", organizationId);
      await db.from("notifications").insert({
        organization_id: organizationId,
        type: "cancelamento",
        title: "Agendamento cancelado pela IA",
        body: `Agendamento ${args.appointment_id} cancelado.`,
      });
      return { cancelado: true };
    }
    case "reschedule_appointment": {
      const { data: appt } = await db
        .from("appointments")
        .select("id, service_id")
        .eq("id", args.appointment_id ?? "")
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (!appt) return { error: "Agendamento não encontrado." };
      const service = ctx.services.find((s) => s.id === appt.service_id);
      const start = new Date(args.starts_at ?? "");
      const end = new Date(start.getTime() + (service?.duration_minutes ?? 30) * 60000);
      const { data: conflicts } = await db
        .from("appointments")
        .select("id")
        .eq("organization_id", organizationId)
        .neq("id", appt.id)
        .neq("status", "cancelado")
        .lt("starts_at", end.toISOString())
        .gt("ends_at", start.toISOString());
      if ((conflicts ?? []).length > 0) return { error: "Horário indisponível." };
      await db
        .from("appointments")
        .update({ starts_at: start.toISOString(), ends_at: end.toISOString(), status: "agendado" })
        .eq("id", appt.id);
      await db.from("notifications").insert({
        organization_id: organizationId,
        type: "reagendamento",
        title: "Agendamento remarcado pela IA",
        body: `Novo horário: ${start.toLocaleString("pt-BR")}`,
      });
      return { reagendado: true, novo_horario: start.toLocaleString("pt-BR") };
    }
    case "transfer_to_human": {
      if (conversationId) await db.from("conversations").update({ status: "humano" }).eq("id", conversationId);
      await db.from("notifications").insert({
        organization_id: organizationId,
        type: "atendimento_humano",
        title: "Cliente pediu atendimento humano",
        body: args.reason ?? "Solicitação de atendimento humano",
      });
      return { transferido: true };
    }
    default:
      return { error: "Ação desconhecida." };
  }
}

export type EngineMessage = { role: "client" | "ai" | "agent" | "system"; content: string };

/** Central AI processing layer shared by every channel (site widget, painel, WhatsApp). */
export async function processMessage(params: {
  organizationId: string;
  conversationId: string | null;
  history: EngineMessage[];
}): Promise<{ reply: string; transferred: boolean }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { reply: "A recepcionista IA ainda não está configurada.", transferred: false };

  const ctx = await loadContext(params.organizationId);
  if (!ctx.org || ctx.org.is_blocked) return { reply: "Atendimento indisponível no momento.", transferred: false };

  const input: unknown[] = [
    { role: "system", content: buildSystemPrompt(ctx) },
    ...params.history.slice(-20).map((m) => ({
      role: m.role === "client" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  let transferred = false;

  for (let step = 0; step < 6; step++) {
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, input, tools: TOOLS }),
    });

    if (res.status === 429) return { reply: "Estamos com muitas conversas agora. Tente novamente em instantes.", transferred };
    if (!res.ok) {
      console.error("AI gateway error", res.status, await res.text());
      return { reply: "Tive um problema para responder agora. Posso encaminhar você para nossa equipe.", transferred };
    }

    const data = (await res.json()) as {
      output?: Array<{
        type: string;
        name?: string;
        arguments?: string;
        call_id?: string;
        content?: Array<{ type: string; text?: string }>;
      }>;
      output_text?: string;
    };

    const output = data.output ?? [];
    const calls = output.filter((o) => o.type === "function_call");

    if (calls.length === 0) {
      const text =
        data.output_text ??
        output
          .flatMap((o) => o.content ?? [])
          .filter((c) => c.type === "output_text")
          .map((c) => c.text ?? "")
          .join("\n");
      return { reply: text.trim() || "Não tenho essa informação no momento. Posso encaminhar você para nossa equipe.", transferred };
    }

    for (const call of calls) {
      input.push(call);
      let args: ToolArgs = {};
      try {
        args = JSON.parse(call.arguments ?? "{}");
      } catch {
        args = {};
      }
      const result = await runTool(params.organizationId, params.conversationId, call.name ?? "", args, ctx);
      if (call.name === "transfer_to_human") transferred = true;
      input.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) });
    }
  }

  return { reply: "Vou encaminhar você para nossa equipe para concluir seu atendimento.", transferred: true };
}
