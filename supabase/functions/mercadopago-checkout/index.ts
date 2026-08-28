import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  const appUrl = Deno.env.get("APP_URL");
  if (!supabaseUrl || !serviceRoleKey || !mpAccessToken || !appUrl) return json({ error: "Billing não configurado" }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const token = authHeader.slice("Bearer ".length);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Sessão inválida" }, 401);

  let body: { organizationId?: string; planId?: string };
  try { body = await req.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  if (!body.organizationId || !body.planId) return json({ error: "organizationId e planId são obrigatórios" }, 400);

  const [{ data: membership }, { data: plan }] = await Promise.all([
    admin.from("organization_members").select("role").eq("organization_id", body.organizationId).eq("user_id", userData.user.id).maybeSingle(),
    admin.from("plans").select("id,slug,name,price_cents,is_active").eq("id", body.planId).eq("is_active", true).maybeSingle(),
  ]);
  if (!membership || !["owner", "admin"].includes(membership.role)) return json({ error: "Sem permissão para gerenciar assinatura" }, 403);
  if (!plan) return json({ error: "Plano inválido" }, 404);

  const { data: profile } = await admin.from("profiles").select("email").eq("id", userData.user.id).maybeSingle();
  const payerEmail = userData.user.email || profile?.email;
  if (!payerEmail) return json({ error: "Usuário sem e-mail" }, 400);

  const externalReference = `${body.organizationId}:${plan.id}`;
  const response = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: { Authorization: `Bearer ${mpAccessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      reason: `RecepIA - Plano ${plan.name}`,
      external_reference: externalReference,
      payer_email: payerEmail,
      back_url: `${appUrl.replace(/\/$/, "")}/assinatura`,
      auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: plan.price_cents / 100, currency_id: "BRL" },
      status: "pending",
    }),
  });

  const mpBody = await response.json();
  if (!response.ok) {
    console.error("Mercado Pago checkout error", mpBody);
    return json({ error: "Não foi possível iniciar o pagamento" }, 502);
  }

  const checkoutUrl = mpBody.init_point || mpBody.sandbox_init_point;
  if (!mpBody.id || !checkoutUrl) return json({ error: "Resposta de checkout incompleta" }, 502);

  const { data: existing } = await admin.from("subscriptions").select("id").eq("organization_id", body.organizationId).maybeSingle();
  const payload = {
    organization_id: body.organizationId,
    provider: "mercadopago",
    provider_subscription_id: String(mpBody.id),
    provider_status: String(mpBody.status || "pending"),
    pending_plan_id: plan.id,
    checkout_url: checkoutUrl,
    last_provider_sync_at: new Date().toISOString(),
  };
  const subscriptionWrite = existing
    ? admin.from("subscriptions").update(payload).eq("id", existing.id)
    : admin.from("subscriptions").insert({ ...payload, plan_id: plan.id, status: "trial" });
  const { error: saveError } = await subscriptionWrite;
  if (saveError) {
    console.error("Subscription save error", saveError);
    return json({ error: "Checkout criado, mas não foi possível salvar o vínculo" }, 500);
  }

  return json({ checkoutUrl, providerSubscriptionId: String(mpBody.id) });
});
