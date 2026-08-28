import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function hex(buffer: ArrayBuffer) { return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join(""); }
async function hmacSha256(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}
function parseSignature(header: string | null) {
  const map = new Map<string, string>();
  for (const part of (header || "").split(",")) {
    const [key, ...rest] = part.trim().split("=");
    if (key && rest.length) map.set(key, rest.join("="));
  }
  return { ts: map.get("ts") || "", v1: map.get("v1") || "" };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: true });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  if (!supabaseUrl || !serviceRoleKey || !mpAccessToken || !webhookSecret) return json({ error: "Billing não configurado" }, 500);
  const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const requestUrl = new URL(req.url);
  let payload: any;
  try { payload = await req.json(); } catch { payload = {}; }
  const dataId = String(requestUrl.searchParams.get("data.id") || payload?.data?.id || "").toLowerCase();
  const requestId = req.headers.get("x-request-id") || "";
  const { ts, v1 } = parseSignature(req.headers.get("x-signature"));
  if (!dataId || !requestId || !ts || !v1) return json({ error: "Assinatura ausente" }, 401);

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = await hmacSha256(webhookSecret, manifest);
  if (expected !== v1.toLowerCase()) return json({ error: "Assinatura inválida" }, 401);

  const eventId = String(payload?.id || `${requestId}:${dataId}`);
  const { data: existingEvent } = await db.from("billing_webhook_events").select("id,processed_at").eq("provider", "mercadopago").eq("provider_event_id", eventId).maybeSingle();
  if (existingEvent?.processed_at) return json({ ok: true, duplicate: true });
  if (!existingEvent) await db.from("billing_webhook_events").insert({ provider: "mercadopago", provider_event_id: eventId, event_type: payload?.type || payload?.action || null, resource_id: dataId, payload });

  const response = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(dataId)}`, { headers: { Authorization: `Bearer ${mpAccessToken}` } });
  const subscription = await response.json();
  if (!response.ok) {
    console.error("Mercado Pago subscription fetch error", subscription);
    return json({ error: "Falha ao consultar assinatura" }, 502);
  }

  const externalReference = String(subscription.external_reference || "");
  const [organizationId, requestedPlanId] = externalReference.split(":");
  if (!organizationId || !requestedPlanId) return json({ error: "Referência externa inválida" }, 400);

  const { data: row } = await db.from("subscriptions").select("id,pending_plan_id,plan_id").eq("organization_id", organizationId).eq("provider", "mercadopago").eq("provider_subscription_id", String(subscription.id)).maybeSingle();
  if (!row) return json({ error: "Assinatura local não encontrada" }, 404);

  const providerStatus = String(subscription.status || "");
  let localStatus = "trial";
  if (providerStatus === "authorized") localStatus = "active";
  else if (["paused", "pending"].includes(providerStatus)) localStatus = "past_due";
  else if (["cancelled", "cancelled_by_user"].includes(providerStatus)) localStatus = "canceled";

  const update: Record<string, unknown> = {
    provider_status: providerStatus,
    status: localStatus,
    last_provider_sync_at: new Date().toISOString(),
    current_period_end: subscription.next_payment_date || null,
  };
  if (providerStatus === "authorized") {
    update.plan_id = row.pending_plan_id || requestedPlanId;
    update.pending_plan_id = null;
  }

  const { error: updateError } = await db.from("subscriptions").update(update).eq("id", row.id);
  if (updateError) return json({ error: "Falha ao atualizar assinatura local" }, 500);
  await db.from("billing_webhook_events").update({ processed_at: new Date().toISOString() }).eq("provider", "mercadopago").eq("provider_event_id", eventId);
  return json({ ok: true });
});
