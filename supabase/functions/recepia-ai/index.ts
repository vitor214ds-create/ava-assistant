import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MessageRow = { role: "client" | "ai" | "agent" | "system"; content: string };

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function extractOutputText(payload: OpenAIResponse) {
  if (payload.output_text?.trim()) return payload.output_text.trim();
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text?.trim()) return content.text.trim();
    }
  }
  return "";
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

  const authHeader = req.headers.get("Authorization") || "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return json({ error: "Não autenticado" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
  if (userError || !userData.user) return json({ error: "Sessão inválida" }, 401);

  let body: { conversationId?: string };
  try { body = await req.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  if (!body.conversationId) return json({ error: "conversationId é obrigatório" }, 400);

  const { data: conversation, error: conversationError } = await admin
    .from("conversations")
    .select("id,organization_id,status,contact_name,contact_phone,client_id")
    .eq("id", body.conversationId)
    .maybeSingle();

  if (conversationError || !conversation) return json({ error: "Conversa não encontrada" }, 404);
  if (conversation.status !== "ia") return json({ error: "A conversa não está sob atendimento da IA" }, 409);

  const { data: membership } = await admin
    .from("organization_members")
    .select("id")
    .eq("organization_id", conversation.organization_id)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!membership) return json({ error: "Sem acesso a esta organização" }, 403);

  const now = new Date();
  const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [orgRes, settingsRes, servicesRes, professionalsRes, hoursRes, faqRes, messagesRes, busyRes] = await Promise.all([
    admin.from("organizations").select("name,segment,phone,email,address,city,state,description,policies,timezone").eq("id", conversation.organization_id).single(),
    admin.from("ai_settings").select("assistant_name,tone,greeting,custom_rules,is_enabled").eq("organization_id", conversation.organization_id).maybeSingle(),
    admin.from("services").select("id,name,description,price_cents,duration_minutes,professional_id").eq("organization_id", conversation.organization_id).eq("is_active", true).order("name"),
    admin.from("professionals").select("id,name,role_title").eq("organization_id", conversation.organization_id).eq("is_active", true).order("name"),
    admin.from("business_hours").select("weekday,is_open,opens_at,closes_at,break_start,break_end").eq("organization_id", conversation.organization_id).order("weekday"),
    admin.from("faqs").select("question,answer").eq("organization_id", conversation.organization_id).order("created_at"),
    admin.from("messages").select("role,content").eq("conversation_id", conversation.id).order("created_at", { ascending: false }).limit(20),
    admin.from("appointments").select("professional_id,starts_at,ends_at,status").eq("organization_id", conversation.organization_id).neq("status", "cancelado").gte("starts_at", now.toISOString()).lte("starts_at", horizon.toISOString()).order("starts_at"),
  ]);

  const settings = settingsRes.data;
  if (settings && settings.is_enabled === false) return json({ error: "A IA está desativada para esta empresa" }, 409);

  const history = ((messagesRes.data ?? []) as MessageRow[]).reverse();
  if (!history.length) return json({ error: "Não há mensagens para responder" }, 409);
  const lastMessage = history[history.length - 1];
  if (lastMessage.role !== "client") return json({ error: "A última mensagem não é do cliente" }, 409);

  const organization = orgRes.data;
  const services = servicesRes.data ?? [];
  const professionals = professionalsRes.data ?? [];
  const businessHours = hoursRes.data ?? [];
  const faqs = faqRes.data ?? [];
  const busySlots = busyRes.data ?? [];

  const fallback = "Não tenho essa informação no momento. Posso encaminhar você para nossa equipe.";
  const instructions = `Você é ${settings?.assistant_name || "Júlia"}, recepcionista virtual da empresa ${organization?.name || "empresa"}.
Responda sempre em português do Brasil, com tom ${settings?.tone || "amigável"}, de forma objetiva, acolhedora e profissional.

REGRAS OBRIGATÓRIAS:
- Use apenas as informações fornecidas no contexto abaixo. Nunca invente preços, horários, serviços, profissionais, políticas ou disponibilidade.
- Se a informação necessária não estiver no contexto, responda exatamente ou de forma muito próxima a: "${fallback}"
- Não dê diagnósticos, orientações médicas ou promessas clínicas.
- Não diga que um agendamento está confirmado. Nesta etapa você pode orientar, coletar nome/telefone/serviço/data desejada e informar que a disponibilidade precisa ser validada pelo sistema.
- Horários ocupados são apenas indisponibilidades. Não revele nomes nem dados de outros clientes.
- Se houver atendimento humano solicitado ou necessidade de exceção, ofereça encaminhamento para a equipe.
- Evite respostas longas. Faça no máximo uma pergunta por vez quando estiver coletando dados.
${settings?.custom_rules ? `- Regras personalizadas da empresa: ${settings.custom_rules}` : ""}

CONTEXTO DA EMPRESA:
${JSON.stringify({
  organization,
  services: services.map((s) => ({ id: s.id, name: s.name, description: s.description, price: (s.price_cents ?? 0) / 100, duration_minutes: s.duration_minutes, professional_id: s.professional_id })),
  professionals,
  business_hours: businessHours,
  faq: faqs,
  busy_intervals_next_14_days: busySlots.map((slot) => ({ professional_id: slot.professional_id, starts_at: slot.starts_at, ends_at: slot.ends_at })),
  current_datetime: now.toISOString(),
  contact: { name: conversation.contact_name, phone: conversation.contact_phone },
})}`;

  const input = history.map((message) => ({
    role: message.role === "client" ? "user" : "assistant",
    content: message.content,
  }));

  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: openaiModel, instructions, input, max_output_tokens: 500 }),
  });

  if (!aiResponse.ok) {
    const detail = await aiResponse.text();
    console.error("OpenAI error", aiResponse.status, detail);
    return json({ error: "Não foi possível gerar a resposta da IA" }, 502);
  }

  const aiPayload = await aiResponse.json() as OpenAIResponse;
  const answer = extractOutputText(aiPayload);
  if (!answer) return json({ error: "A IA não retornou uma resposta utilizável" }, 502);

  const { data: inserted, error: insertError } = await admin.from("messages").insert({
    organization_id: conversation.organization_id,
    conversation_id: conversation.id,
    role: "ai",
    content: answer,
    metadata: { provider: "openai", model: openaiModel },
  }).select("id,role,content,created_at").single();

  if (insertError) return json({ error: "Resposta gerada, mas não foi possível salvá-la" }, 500);
  await admin.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversation.id);

  return json({ message: inserted });
});
