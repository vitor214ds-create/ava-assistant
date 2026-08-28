import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";
import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function timingSafeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256Hex(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 20);
}

function buildAssistantLink(baseUrl: string, slug: string, publicToken: string, name?: string | null, phone?: string | null) {
  const url = new URL(`/chat/${encodeURIComponent(slug)}`, baseUrl);
  url.searchParams.set("handoff", publicToken);
  if (name) url.searchParams.set("name", name);
  if (phone) url.searchParams.set("phone", phone);
  url.searchParams.set("source", "whatsapp");
  return url.toString();
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!supabaseUrl || !serviceKey || !dbUrl) return json({ error: "Backend não configurado" }, 500);

  const url = new URL(req.url);
  const webhookKey = url.searchParams.get("key") || "";
  if (!webhookKey) return new Response("Not found", { status: 404 });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const sql = postgres(dbUrl, { prepare: false });
  try {
    const { data: integration } = await admin.from("integrations").select("id,organization_id,status,config").eq("provider", "whatsapp_cloud").eq("config->>webhook_key", webhookKey).maybeSingle();
    if (!integration) return new Response("Not found", { status: 404 });

    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      if (mode === "subscribe" && token && token === integration.config?.verify_token && challenge) {
        await admin.from("integrations").update({ status: "conectado", connected_at: new Date().toISOString(), last_error: null, config: { ...integration.config, webhook_verified: true } }).eq("id", integration.id);
        return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
      }
      return new Response("Forbidden", { status: 403 });
    }

    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const credentials = await sql`
      select v.decrypted_secret
      from private.integration_credentials c
      join vault.decrypted_secrets v on v.id = c.vault_secret_id
      where c.integration_id = ${integration.id}::uuid
      limit 1
    `;
    if (!credentials[0]?.decrypted_secret) return json({ error: "Credencial indisponível" }, 500);
    const secrets = JSON.parse(credentials[0].decrypted_secret) as { access_token: string; app_secret: string };

    const raw = await req.text();
    const signatureHeader = req.headers.get("x-hub-signature-256") || "";
    const receivedHex = signatureHeader.replace(/^sha256=/i, "");
    const expectedHex = await hmacSha256Hex(secrets.app_secret, raw);
    if (!receivedHex || !timingSafeEqualHex(receivedHex, expectedHex)) return new Response("Invalid signature", { status: 401 });

    let payload: any;
    try { payload = JSON.parse(raw); } catch { return json({ error: "JSON inválido" }, 400); }
    if (payload.object !== "whatsapp_business_account") return json({ ok: true, ignored: true });

    const { data: organization } = await admin.from("organizations").select("id,name,slug,is_blocked").eq("id", integration.organization_id).single();
    if (!organization || organization.is_blocked || !organization.slug) return json({ ok: true, ignored: true });

    const config = integration.config || {};
    const apiVersion = config.api_version || "v26.0";
    const phoneNumberId = String(config.phone_number_id || "");
    const dedupeMinutes = Number(config.dedupe_minutes || 15);
    const publicBaseUrl = String(config.public_base_url || "");
    const autoReplyEnabled = config.auto_reply_enabled !== false;
    const autoReplyMessage = String(config.auto_reply_message || "Olá! 👋 Para falar com nossa recepcionista virtual e consultar horários disponíveis, acesse:");

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue;
        const value = change.value || {};
        if (String(value.metadata?.phone_number_id || "") !== phoneNumberId) continue;
        const contacts = new Map<string, string>();
        for (const contact of value.contacts ?? []) contacts.set(normalizePhone(contact.wa_id || ""), contact.profile?.name || "");

        for (const message of value.messages ?? []) {
          const providerEventId = String(message.id || "");
          const sender = normalizePhone(message.from || "");
          if (!providerEventId || !sender) continue;

          const { data: existingEvent } = await admin.from("integration_webhook_events").select("id").eq("integration_id", integration.id).eq("provider_event_id", providerEventId).maybeSingle();
          if (existingEvent) continue;

          const contactName = contacts.get(sender) || null;
          const inboundText = message.type === "text" ? String(message.text?.body || "") : `[Mensagem ${message.type || "recebida"}]`;
          const { data: eventRow } = await admin.from("integration_webhook_events").insert({
            integration_id: integration.id,
            organization_id: integration.organization_id,
            provider_event_id: providerEventId,
            sender,
            event_type: message.type || "message",
            status: "received",
            metadata: { timestamp: message.timestamp ?? null },
          }).select("id").single();

          let { data: conversation } = await admin.from("conversations").select("id,public_token,status,contact_name,contact_phone").eq("organization_id", integration.organization_id).eq("channel", "whatsapp").eq("contact_phone", sender).neq("status", "encerrada").order("last_message_at", { ascending: false }).limit(1).maybeSingle();
          if (!conversation) {
            const { data: created } = await admin.from("conversations").insert({ organization_id: integration.organization_id, channel: "whatsapp", status: "ia", contact_name: contactName, contact_phone: sender }).select("id,public_token,status,contact_name,contact_phone").single();
            conversation = created;
          }
          if (!conversation) {
            if (eventRow) await admin.from("integration_webhook_events").update({ status: "failed", error: "conversation_create_failed", processed_at: new Date().toISOString() }).eq("id", eventRow.id);
            continue;
          }

          await admin.from("messages").insert({ organization_id: integration.organization_id, conversation_id: conversation.id, role: "client", content: inboundText, metadata: { channel: "whatsapp", provider_message_id: providerEventId, original_type: message.type } });
          await admin.from("conversations").update({ contact_name: contactName || conversation.contact_name, contact_phone: sender, last_message_at: new Date().toISOString() }).eq("id", conversation.id);

          let shouldReply = autoReplyEnabled;
          if (shouldReply) {
            const cutoff = new Date(Date.now() - dedupeMinutes * 60_000).toISOString();
            const { data: recentSent } = await admin.from("integration_webhook_events").select("id").eq("integration_id", integration.id).eq("sender", sender).eq("status", "link_sent").gte("created_at", cutoff).limit(1);
            if (recentSent?.length) shouldReply = false;
          }

          if (shouldReply && publicBaseUrl) {
            const assistantLink = buildAssistantLink(publicBaseUrl, organization.slug, conversation.public_token, contactName, sender);
            const text = `${autoReplyMessage}\n\n${assistantLink}`.slice(0, 4096);
            const sendResponse = await fetch(`https://graph.facebook.com/${apiVersion}/${encodeURIComponent(phoneNumberId)}/messages`, {
              method: "POST",
              headers: { Authorization: `Bearer ${secrets.access_token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: sender, type: "text", text: { preview_url: true, body: text } }),
            });
            const sendPayload = await sendResponse.json();
            if (sendResponse.ok) {
              await admin.from("messages").insert({ organization_id: integration.organization_id, conversation_id: conversation.id, role: "system", content: text, metadata: { channel: "whatsapp", kind: "assistant_handoff_link", provider_response: sendPayload } });
              if (eventRow) await admin.from("integration_webhook_events").update({ status: "link_sent", processed_at: new Date().toISOString(), metadata: { timestamp: message.timestamp ?? null, assistant_link: assistantLink } }).eq("id", eventRow.id);
            } else {
              const errorMessage = sendPayload?.error?.message || "Falha ao enviar link";
              if (eventRow) await admin.from("integration_webhook_events").update({ status: "failed", error: errorMessage, processed_at: new Date().toISOString() }).eq("id", eventRow.id);
              await admin.from("integrations").update({ last_error: errorMessage }).eq("id", integration.id);
            }
          } else if (eventRow) {
            await admin.from("integration_webhook_events").update({ status: "processed", processed_at: new Date().toISOString() }).eq("id", eventRow.id);
          }
        }
      }
    }

    await admin.from("integrations").update({ last_event_at: new Date().toISOString() }).eq("id", integration.id);
    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return json({ error: "Webhook processing failed" }, 500);
  } finally {
    await sql.end({ timeout: 2 });
  }
});
