import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";
import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const API_VERSION = "v26.0";

function cleanBaseUrl(value: string) {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) throw new Error("URL pública inválida");
  return url.origin;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!supabaseUrl || !serviceKey || !dbUrl) return json({ error: "Backend não configurado" }, 500);

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Não autenticado" }, 401);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  if (userError || !userData.user) return json({ error: "Sessão inválida" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  const organizationId = String(body.organizationId || "");
  const action = String(body.action || "status");
  if (!organizationId) return json({ error: "organizationId obrigatório" }, 400);

  const { data: membership } = await admin.from("organization_members").select("role").eq("organization_id", organizationId).eq("user_id", userData.user.id).maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) return json({ error: "Sem permissão para gerenciar integrações" }, 403);

  const sql = postgres(dbUrl, { prepare: false });
  try {
    if (action === "status") {
      const { data } = await admin.from("integrations").select("id,status,config,connected_at,last_event_at,last_test_at,last_error").eq("organization_id", organizationId).eq("provider", "whatsapp_cloud").maybeSingle();
      return json({ integration: data ?? null });
    }

    if (action === "disconnect") {
      const { data: integration } = await admin.from("integrations").select("id").eq("organization_id", organizationId).eq("provider", "whatsapp_cloud").maybeSingle();
      if (integration) {
        const credentials = await sql`select vault_secret_id from private.integration_credentials where integration_id = ${integration.id}::uuid`;
        if (credentials[0]?.vault_secret_id) await sql`delete from vault.secrets where id = ${credentials[0].vault_secret_id}::uuid`;
        await admin.from("integrations").delete().eq("id", integration.id);
      }
      return json({ ok: true });
    }

    if (action !== "connect") return json({ error: "Ação inválida" }, 400);

    const phoneNumberId = String(body.phoneNumberId || "").trim();
    const wabaId = String(body.wabaId || "").trim();
    const accessToken = String(body.accessToken || "").trim();
    const appSecret = String(body.appSecret || "").trim();
    const publicBaseUrl = cleanBaseUrl(String(body.publicBaseUrl || ""));
    const autoReplyMessage = String(body.autoReplyMessage || "Olá! 👋 Para falar com nossa recepcionista virtual e consultar horários disponíveis, acesse o link abaixo:").trim().slice(0, 900);
    if (!phoneNumberId || !wabaId || !accessToken || !appSecret) return json({ error: "Preencha Phone Number ID, WABA ID, Access Token e App Secret" }, 400);

    const phoneResponse = await fetch(`https://graph.facebook.com/${API_VERSION}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const phonePayload = await phoneResponse.json();
    if (!phoneResponse.ok) return json({ error: "Não foi possível validar o número no WhatsApp Cloud API", details: phonePayload?.error?.message ?? null }, 400);

    const subscribeResponse = await fetch(`https://graph.facebook.com/${API_VERSION}/${encodeURIComponent(wabaId)}/subscribed_apps`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
    const subscribePayload = await subscribeResponse.json();
    if (!subscribeResponse.ok) return json({ error: "Credenciais válidas, mas não foi possível assinar o WABA para webhooks", details: subscribePayload?.error?.message ?? null }, 400);

    const { data: existing } = await admin.from("integrations").select("id,config").eq("organization_id", organizationId).eq("provider", "whatsapp_cloud").maybeSingle();
    const webhookKey = existing?.config?.webhook_key || crypto.randomUUID();
    const verifyToken = existing?.config?.verify_token || `recepia_${crypto.randomUUID().replaceAll("-", "")}`;
    const config = {
      phone_number_id: phoneNumberId,
      waba_id: wabaId,
      display_phone_number: phonePayload.display_phone_number ?? null,
      verified_name: phonePayload.verified_name ?? null,
      api_version: API_VERSION,
      webhook_key: webhookKey,
      verify_token: verifyToken,
      webhook_verified: false,
      auto_reply_enabled: true,
      auto_reply_message: autoReplyMessage,
      public_base_url: publicBaseUrl,
      dedupe_minutes: 15,
    };

    const payload = { organization_id: organizationId, provider: "whatsapp_cloud", status: "aguardando_webhook", config, connected_at: null, last_test_at: new Date().toISOString(), last_error: null };
    const { data: integration, error: saveError } = existing
      ? await admin.from("integrations").update(payload).eq("id", existing.id).select("id,status,config,connected_at,last_event_at,last_test_at,last_error").single()
      : await admin.from("integrations").insert(payload).select("id,status,config,connected_at,last_event_at,last_test_at,last_error").single();
    if (saveError || !integration) return json({ error: "Não foi possível salvar a integração" }, 500);

    const secretValue = JSON.stringify({ access_token: accessToken, app_secret: appSecret });
    const credentials = await sql`select vault_secret_id from private.integration_credentials where integration_id = ${integration.id}::uuid`;
    let secretId = credentials[0]?.vault_secret_id as string | undefined;
    if (secretId) {
      await sql`select vault.update_secret(${secretId}::uuid, ${secretValue}, ${`recepia_whatsapp_${integration.id}`}, ${"Credenciais WhatsApp Cloud API"}, null)`;
    } else {
      const created = await sql`select vault.create_secret(${secretValue}, ${`recepia_whatsapp_${integration.id}`}, ${"Credenciais WhatsApp Cloud API"}, null) as id`;
      secretId = created[0].id;
      await sql`insert into private.integration_credentials(integration_id, vault_secret_id) values (${integration.id}::uuid, ${secretId}::uuid)`;
    }

    return json({ ok: true, integration, callbackUrl: `${supabaseUrl}/functions/v1/whatsapp-webhook?key=${encodeURIComponent(webhookKey)}`, verifyToken });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Erro inesperado" }, 500);
  } finally {
    await sql.end({ timeout: 2 });
  }
});
