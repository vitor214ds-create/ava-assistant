import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bot, Building2, CalendarCheck2, Crown, Loader2, MessageCircleMore, ShieldCheck, TrendingUp, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administração da Plataforma | RecepIA" }] }),
  component: PlatformAdminPage,
});

type Metrics = { organizations:number; active_subscriptions:number; trials:number; expired_trials:number; past_due:number; mrr_cents:number; appointments_30d:number; conversations_30d:number };
type OrganizationRow = { id:string; name:string; slug:string|null; segment:string; is_blocked:boolean; created_at:string; subscription_status:string|null; trial_ends_at:string|null; plan_name:string|null; plan_slug:string|null; members:number; appointments_30d:number; conversations_30d:number };
type Overview = { metrics:Metrics; organizations:OrganizationRow[] };

function PlatformAdminPage(){
  const navigate=useNavigate();
  const {user,loading}=useAuth();
  const [overview,setOverview]=useState<Overview|null>(null);
  const [loadingData,setLoadingData]=useState(true);
  const [error,setError]=useState("");
  const [search,setSearch]=useState("");

  useEffect(()=>{
    if(loading)return;
    if(!user)return void navigate({to:"/login"});
    void load();
  },[loading,user]);

  async function load(){
    setLoadingData(true);setError("");
    const {data:role}=await supabase.from("user_roles").select("role").eq("user_id",user!.id).eq("role","platform_admin").maybeSingle();
    if(!role){setError("Você não possui permissão de administrador da plataforma.");setLoadingData(false);return;}
    const {data,error:rpcError}=await supabase.rpc("platform_admin_overview");
    if(rpcError||!data){setError("Não foi possível carregar os dados administrativos.");setLoadingData(false);return;}
    setOverview(data as Overview);setLoadingData(false);
  }

  const rows=useMemo(()=>{
    const term=search.trim().toLowerCase();
    if(!term)return overview?.organizations??[];
    return (overview?.organizations??[]).filter((item)=>`${item.name} ${item.slug??""} ${item.plan_name??""} ${item.subscription_status??""}`.toLowerCase().includes(term));
  },[overview,search]);

  if(loading||loadingData)return <main className="flex min-h-screen items-center justify-center bg-[#f7f9f8]"><div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>Carregando administração...</div></main>;

  if(error&&!overview)return <main className="min-h-screen bg-[#f7f9f8] p-6"><div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-white p-7 text-center"><ShieldCheck className="mx-auto h-9 w-9 text-red-500"/><h1 className="mt-4 font-[Sora] text-xl font-bold">Acesso restrito</h1><p className="mt-2 text-sm text-slate-500">{error}</p><Link to="/dashboard" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"><ArrowLeft className="h-4 w-4"/>Voltar ao painel</Link></div></main>;

  const m=overview!.metrics;
  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/dashboard" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5"/></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></Link><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft className="h-4 w-4"/>Voltar ao painel</Link></div></header>
    <div className="mx-auto max-w-7xl p-5 sm:p-8"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><ShieldCheck className="h-5 w-5"/></span><div><p className="text-sm font-semibold text-emerald-600">Owner da plataforma</p><h1 className="font-[Sora] text-3xl font-bold">Administração do RecepIA.</h1></div></div><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">Acompanhe crescimento, assinaturas, trials e atividade das empresas. Esta área é protegida por permissão de plataforma no backend.</p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Building2} label="Empresas" value={m.organizations}/><Metric icon={Crown} label="Assinaturas ativas" value={m.active_subscriptions}/><Metric icon={TrendingUp} label="MRR estimado" value={formatMoney(m.mrr_cents)} accent/><Metric icon={UsersRound} label="Trials ativos" value={m.trials}/><Metric icon={CalendarCheck2} label="Agendamentos • 30 dias" value={m.appointments_30d}/><Metric icon={MessageCircleMore} label="Conversas • 30 dias" value={m.conversations_30d}/><Metric icon={ShieldCheck} label="Trials expirados" value={m.expired_trials}/><Metric icon={ShieldCheck} label="Pagamento pendente" value={m.past_due}/></div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-[Sora] text-lg font-semibold">Empresas da plataforma</h2><p className="mt-1 text-sm text-slate-500">Visão operacional sem expor dados de clientes finais.</p></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar empresa ou plano" className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"/></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"><th className="px-3 py-3">Empresa</th><th className="px-3 py-3">Plano</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Membros</th><th className="px-3 py-3">Agend. 30d</th><th className="px-3 py-3">Conversas 30d</th><th className="px-3 py-3">Criada em</th></tr></thead><tbody>{rows.map(item=><tr key={item.id} className="border-b border-slate-50"><td className="px-3 py-4"><p className="font-semibold text-slate-900">{item.name}</p><p className="mt-0.5 text-xs text-slate-400">/{item.slug??"sem-slug"} • {item.segment}</p></td><td className="px-3 py-4">{item.plan_name??"—"}</td><td className="px-3 py-4"><Status value={item.subscription_status} blocked={item.is_blocked}/>{item.subscription_status==="trial"&&item.trial_ends_at&&<p className="mt-1 text-xs text-slate-400">até {new Date(item.trial_ends_at).toLocaleDateString("pt-BR")}</p>}</td><td className="px-3 py-4 font-semibold">{item.members}</td><td className="px-3 py-4 font-semibold">{item.appointments_30d}</td><td className="px-3 py-4 font-semibold">{item.conversations_30d}</td><td className="px-3 py-4 text-slate-500">{new Date(item.created_at).toLocaleDateString("pt-BR")}</td></tr>)}{!rows.length&&<tr><td colSpan={7} className="px-3 py-12 text-center text-slate-400">Nenhuma empresa encontrada.</td></tr>}</tbody></table></div></section>
    </div></main>;
}

function formatMoney(cents:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format((cents||0)/100)}
function Metric({icon:Icon,label,value,accent=false}:{icon:typeof Bot;label:string;value:string|number;accent?:boolean}){return <article className={`rounded-3xl border p-5 ${accent?"border-emerald-200 bg-emerald-50":"border-slate-200 bg-white"}`}><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent?"bg-emerald-500 text-white":"bg-slate-100 text-slate-600"}`}><Icon className="h-4 w-4"/></span><p className="mt-4 text-xs font-medium text-slate-500">{label}</p><p className="mt-1 font-[Sora] text-2xl font-bold">{value}</p></article>}
function Status({value,blocked}:{value:string|null;blocked:boolean}){if(blocked)return <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Bloqueada</span>;const cls=value==="active"?"bg-emerald-50 text-emerald-700":value==="trial"?"bg-blue-50 text-blue-700":value==="past_due"?"bg-amber-50 text-amber-700":"bg-slate-100 text-slate-600";return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{value??"sem assinatura"}</span>}
