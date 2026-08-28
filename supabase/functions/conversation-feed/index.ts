import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json({ error: "Serviço indisponível" }, 500);

  let body: { publicToken?: string };
  try { body = await req.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  if (!body.publicToken) return json({ error: "Token obrigatório" }, 400);

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: conversation } = await db.from("conversations")
    .select("id,status,contact_name,contact_phone,public_token")
    .eq("public_token", body.publicToken)
    .maybeSingle();
  if (!conversation) return json({ error: "Conversa inválida" }, 404);

  const { data: messages } = await db.from("messages")
    .select("id,role,content,created_at")
    .eq("conversation_id", conversation.id)
    .in("role", ["client","ai","agent","system"])
    .order("created_at", { ascending: true })
    .limit(120);

  return json({
    status: conversation.status,
    contactName: conversation.contact_name,
    contactPhone: conversation.contact_phone,
    messages: messages ?? [],
  });
});
