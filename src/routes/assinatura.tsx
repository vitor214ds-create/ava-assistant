import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bot, CalendarCheck2, Check, Loader2, MessageCircleMore, ShieldCheck, Sparkles, UserRoundCog } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Plan = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  description: string | null;
  max_professionals: number;
  max_appointments: number;
  max_conversations: number;
  max_messages: number;
  ai_enabled: boolean;
  integrations_enabled: boolean;
  features: string[];
  sort_order: number;
};
type Subscription = {
  id: string;
  plan_id: string | null;
  status: string;
  trial_ends_at: string;
  current_period_end: string | null;
  provider?: string | null;
  provider_status?: string | null;
  pending_plan_id?: string | null;
};
type Usage = { professionals: number; appointments: number; conversations: number; messages: number };

export const Route = createFileRoute("/assinatura")({
  head: () => ({ meta: [{ title: "Assinatura | RecepIA" }] }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, organizationId, loading } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage>({ professionals: 0, appointments: 0, conversations: 0, messages: 0 });
  const [loadingData, setLoadingData] = useState(true);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login" });
    if (!organizationId) return void navigate({ to: "/onboarding" });
    void loadBilling();
  }, [loading, user, organizationId]);

  async function loadBilling() {
    if (!organizationId) return;
    setLoadingData(true); setError("");
    const { data: plansData, error: plansError } = await supabase.from("plans").select("id,slug,name,price_cents,description,max_professionals,max_appointments,max_conversations,max_messages,ai_enabled,integrations_enabled,features,sort_order").eq("is_active", true).order("sort_order");
    if (plansError || !plansData?.length) { setError("Não foi possível carregar os planos."); setLoadingData(false); return; }
    const typedPlans = plansData as Plan[];
    setPlans(typedPlans);

    let { data: subscriptionData } = await supabase.from("subscriptions").select("id,plan_id,status,trial_ends_at,current_period_end,provider,provider_status,pending_plan_id").eq("organization_id", organizationId).maybeSingle();
    if (!subscriptionData) {
      const basic = typedPlans.find((plan) => plan.slug === "basico") ?? typedPlans[0];
      const { data: created, error: createError } = await supabase.from("subscriptions").insert({ organization_id: organizationId, plan_id: basic.id, status: "trial" }).select("id,plan_id,status,trial_ends_at,current_period_end,provider,provider_status,pending_plan_id").single();
      if (createError) setError("Não foi possível iniciar o período de teste desta empresa.");
      subscriptionData = created ?? null;
    }
    setSubscription(subscriptionData as Subscription | null);

    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const [professionalsRes, appointmentsRes, conversationsRes, messagesRes] = await Promise.all([
      supabase.from("professionals").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("is_active", true),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("created_at", monthStart.toISOString()),
      supabase.from("conversations").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("created_at", monthStart.toISOString()),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("created_at", monthStart.toISOString()),
    ]);
    setUsage({ professionals: professionalsRes.count ?? 0, appointments: appointmentsRes.count ?? 0, conversations: conversationsRes.count ?? 0, messages: messagesRes.count ?? 0 });
    setLoadingData(false);
  }

  async function startCheckout(plan: Plan) {
    if (!organizationId || checkoutPlanId) return;
    setCheckoutPlanId(plan.id); setError("");
    const { data, error: invokeError } = await supabase.functions.invoke("mercadopago-checkout", { body: { organizationId, planId: plan.id } });
    if (invokeError || !data?.checkoutUrl) {
      setError(data?.error || "Não foi possível abrir o checkout. Verifique se o Mercado Pago já foi configurado no servidor.");
      setCheckoutPlanId(null);
      return;
    }
    window.location.assign(data.checkoutUrl);
  }

  const currentPlan = useMemo(() => plans.find((plan) => plan.id === subscription?.plan_id) ?? null, [plans, subscription]);
  const trialDays = subscription?.status === "trial" ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86_400_000)) : null;
  const statusLabel = subscription?.status === "trial" ? "Período de teste" : subscription?.status === "active" ? "Ativa" : subscription?.status === "past_due" ? "Pagamento pendente" : subscription?.status === "canceled" ? "Cancelada" : subscription?.status ?? "Sem assinatura";

  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4"/>Voltar ao painel</Link><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-4 w-4"/></span><span className="font-[Sora] font-bold">RecepIA</span></div></div></header>
    <div className="mx-auto max-w-7xl p-5 sm:p-8"><div><p className="text-sm font-semibold text-emerald-600">Cobrança e limites</p><h1 className="mt-1 font-[Sora] text-3xl font-bold">Assinatura.</h1><p className="mt-2 text-sm text-slate-500">Acompanhe seu plano atual, período de teste e consumo mensal.</p></div>
      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</div>}
      {loadingData ? <div className="mt-10 text-center text-sm text-slate-500">Carregando assinatura...</div> : <>
        <section className="mt-7 overflow-hidden rounded-3xl bg-slate-950 text-white"><div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400">{statusLabel}</span>{trialDays !== null && <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">{trialDays} dias restantes</span>}{subscription?.provider_status === "pending" && <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">Checkout iniciado</span>}</div><h2 className="mt-5 font-[Sora] text-3xl font-bold">Plano {currentPlan?.name ?? "Básico"}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{currentPlan?.description ?? "Seu plano atual da RecepIA."}</p></div><div className="lg:text-right"><p className="text-sm text-slate-400">Valor mensal</p><p className="mt-1 font-[Sora] text-4xl font-bold">R$ {((currentPlan?.price_cents ?? 0)/100).toLocaleString("pt-BR",{minimumFractionDigits:2})}</p>{subscription?.current_period_end && <p className="mt-2 text-xs text-slate-400">Próximo ciclo: {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}</p>}</div></div></section>

        {currentPlan && <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6"><div><h2 className="font-[Sora] text-lg font-semibold">Uso neste mês</h2><p className="mt-1 text-sm text-slate-500">Acompanhe seu consumo em relação aos limites do plano.</p></div><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><UsageCard icon={UserRoundCog} label="Profissionais ativos" value={usage.professionals} limit={currentPlan.max_professionals}/><UsageCard icon={CalendarCheck2} label="Agendamentos" value={usage.appointments} limit={currentPlan.max_appointments}/><UsageCard icon={MessageCircleMore} label="Conversas" value={usage.conversations} limit={currentPlan.max_conversations}/><UsageCard icon={Sparkles} label="Mensagens" value={usage.messages} limit={currentPlan.max_messages}/></div></section>}

        <section className="mt-6"><div><h2 className="font-[Sora] text-2xl font-bold">Planos disponíveis</h2><p className="mt-1 text-sm text-slate-500">Escolha um plano e conclua o pagamento no ambiente seguro do Mercado Pago. A mudança só é aplicada depois da confirmação do webhook.</p></div><div className="mt-5 grid gap-5 lg:grid-cols-3">{plans.map((plan)=><PlanCard key={plan.id} plan={plan} current={plan.id===currentPlan?.id} subscriptionStatus={subscription?.status ?? ""} loading={checkoutPlanId===plan.id} disabled={Boolean(checkoutPlanId)} onSelect={()=>void startCheckout(plan)}/>)}</div></section>

        <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"/><div><h3 className="font-semibold text-emerald-900">Upgrade protegido por confirmação de pagamento</h3><p className="mt-1 text-sm leading-6 text-emerald-800">O checkout é criado no servidor. A RecepIA não altera o plano ao clicar no botão ou ao retornar do pagamento: a ativação depende da confirmação autenticada enviada pelo Mercado Pago.</p></div></div></section>
      </>}
    </div>
  </main>;
}

function UsageCard({icon:Icon,label,value,limit}:{icon:typeof CalendarCheck2;label:string;value:number;limit:number}){const pct=Math.min(100,limit?value/limit*100:0);const warn=pct>=80;return <article className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between"><Icon className={`h-5 w-5 ${warn?"text-amber-600":"text-emerald-600"}`}/><span className="text-xs font-semibold text-slate-400">{value}/{limit}</span></div><p className="mt-4 text-sm font-semibold">{label}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${warn?"bg-amber-500":"bg-emerald-500"}`} style={{width:`${pct}%`}}/></div><p className={`mt-2 text-xs ${warn?"font-semibold text-amber-700":"text-slate-400"}`}>{pct.toFixed(0)}% utilizado</p></article>}
function PlanCard({plan,current,subscriptionStatus,loading,disabled,onSelect}:{plan:Plan;current:boolean;subscriptionStatus:string;loading:boolean;disabled:boolean;onSelect:()=>void}){const activeCurrent=current&&subscriptionStatus==="active";return <article className={`rounded-3xl border p-6 ${current?"border-emerald-500 bg-emerald-50":"border-slate-200 bg-white"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-emerald-600">{plan.slug==="premium"?"Operação completa":plan.slug==="profissional"?"Mais escolhido":"Essencial"}</p><h3 className="mt-1 font-[Sora] text-xl font-bold">{plan.name}</h3></div>{current && <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">{activeCurrent?"Atual":"Trial"}</span>}</div><p className="mt-5"><span className="font-[Sora] text-3xl font-bold">R$ {(plan.price_cents/100).toLocaleString("pt-BR",{minimumFractionDigits:2})}</span><span className="text-sm text-slate-500">/mês</span></p><ul className="mt-6 space-y-3">{(Array.isArray(plan.features)?plan.features:[]).map((feature)=><li key={feature} className="flex items-start gap-2 text-sm text-slate-600"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"/>{feature}</li>)}</ul><button onClick={onSelect} disabled={disabled||activeCurrent} className={`mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold ${activeCurrent?"bg-emerald-100 text-emerald-700":"bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-50"}`}>{loading&&<Loader2 className="h-4 w-4 animate-spin"/>}{activeCurrent?"Plano atual":current?"Assinar este plano":"Escolher plano"}</button></article>}
