import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Bot, CalendarCheck2, CheckCircle2, MessageCircleMore, TrendingUp, UserRoundX, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Period = 7 | 30 | 90;
type Appointment = {
  id: string;
  status: "agendado" | "confirmado" | "concluido" | "cancelado" | "nao_compareceu";
  created_by_ai: boolean;
  starts_at: string;
  service_id: string | null;
  professional_id: string | null;
  services?: { name?: string } | null;
  professionals?: { name?: string } | null;
};
type Conversation = { id: string; status: "ia" | "humano" | "encerrada"; created_at: string };

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios | RecepIA" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const navigate = useNavigate();
  const { user, organizationId, loading } = useAuth();
  const [period, setPeriod] = useState<Period>(30);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login" });
    if (!organizationId) return void navigate({ to: "/onboarding" });
    void loadReports();
  }, [loading, user, organizationId, period]);

  async function loadReports() {
    if (!organizationId) return;
    setLoadingData(true); setError("");
    const since = new Date(); since.setDate(since.getDate() - period); since.setHours(0, 0, 0, 0);
    const [appointmentsRes, conversationsRes] = await Promise.all([
      supabase.from("appointments").select("id,status,created_by_ai,starts_at,service_id,professional_id,services(name),professionals(name)").eq("organization_id", organizationId).gte("starts_at", since.toISOString()).order("starts_at"),
      supabase.from("conversations").select("id,status,created_at").eq("organization_id", organizationId).gte("created_at", since.toISOString()).order("created_at"),
    ]);
    if (appointmentsRes.error || conversationsRes.error) setError("Não foi possível carregar os relatórios agora.");
    setAppointments((appointmentsRes.data ?? []) as Appointment[]);
    setConversations((conversationsRes.data ?? []) as Conversation[]);
    setLoadingData(false);
  }

  const metrics = useMemo(() => {
    const total = appointments.length;
    const concluded = appointments.filter((item) => item.status === "concluido").length;
    const cancelled = appointments.filter((item) => item.status === "cancelado").length;
    const noShow = appointments.filter((item) => item.status === "nao_compareceu").length;
    const ai = appointments.filter((item) => item.created_by_ai).length;
    const bookingRate = conversations.length ? (ai / conversations.length) * 100 : 0;
    return { total, concluded, cancelled, noShow, ai, bookingRate };
  }, [appointments, conversations]);

  const daily = useMemo(() => {
    const map = new Map<string, { date: string; appointments: number; ai: number }>();
    for (let offset = period - 1; offset >= 0; offset--) {
      const date = new Date(); date.setDate(date.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      map.set(key, { date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), appointments: 0, ai: 0 });
    }
    appointments.forEach((item) => {
      const key = item.starts_at.slice(0, 10);
      const row = map.get(key);
      if (row) { row.appointments += 1; if (item.created_by_ai) row.ai += 1; }
    });
    return Array.from(map.values());
  }, [appointments, period]);

  const serviceRanking = useMemo(() => rank(appointments, (item) => item.services?.name || "Serviço não informado"), [appointments]);
  const professionalRanking = useMemo(() => rank(appointments.filter((item) => item.professional_id), (item) => item.professionals?.name || "Profissional"), [appointments]);
  const maxDaily = Math.max(1, ...daily.map((item) => item.appointments));

  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4"/>Voltar ao painel</Link><div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"><BarChart3 className="h-4 w-4"/>Relatórios</div></div></header>
    <div className="mx-auto max-w-7xl p-5 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-emerald-600">Desempenho da operação</p><h1 className="mt-1 font-[Sora] text-3xl font-bold">Relatórios.</h1><p className="mt-2 text-sm text-slate-500">Acompanhe atendimento, agenda e conversão da recepcionista IA.</p></div><div className="flex rounded-xl border border-slate-200 bg-white p-1">{([7,30,90] as Period[]).map((value)=><button key={value} onClick={()=>setPeriod(value)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${period===value?"bg-slate-950 text-white":"text-slate-500 hover:bg-slate-50"}`}>{value} dias</button>)}</div></div>
      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loadingData ? <div className="mt-10 text-center text-sm text-slate-500">Carregando relatórios...</div> : <>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6"><Metric icon={CalendarCheck2} label="Agendamentos" value={metrics.total}/><Metric icon={CheckCircle2} label="Concluídos" value={metrics.concluded}/><Metric icon={XCircle} label="Cancelados" value={metrics.cancelled}/><Metric icon={UserRoundX} label="Faltas" value={metrics.noShow}/><Metric icon={Bot} label="Criados pela IA" value={metrics.ai} accent/><Metric icon={TrendingUp} label="Conversão IA" value={`${metrics.bookingRate.toFixed(1)}%`} accent/></div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]"><section className="rounded-3xl border border-slate-200 bg-white p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="font-[Sora] text-lg font-semibold">Agendamentos por dia</h2><p className="mt-1 text-sm text-slate-500">Volume total e participação da IA.</p></div></div><div className="mt-8 flex h-64 items-end gap-1 overflow-hidden">{daily.map((item,index)=><div key={index} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div className="relative flex h-52 w-full items-end justify-center"><div title={`${item.appointments} agendamentos`} className="w-[72%] min-w-1 rounded-t-lg bg-slate-200" style={{height:`${Math.max(item.appointments?8:2,(item.appointments/maxDaily)*100)}%`}}><div className="w-full rounded-t-lg bg-emerald-500" style={{height:item.appointments?`${(item.ai/item.appointments)*100}%`:"0%"}}/></div></div>{(period<=30 || index%7===0) && <span className="text-[10px] text-slate-400">{item.date}</span>}</div>)}</div><div className="mt-5 flex gap-4 text-xs text-slate-500"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-slate-200"/>Total</span><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500"/>IA</span></div></section>
          <section className="rounded-3xl bg-slate-950 p-6 text-white"><MessageCircleMore className="h-6 w-6 text-emerald-400"/><p className="mt-5 text-sm text-slate-400">Conversas iniciadas</p><p className="mt-1 font-[Sora] text-4xl font-bold">{conversations.length}</p><div className="mt-7 space-y-3"><DarkRow label="Em atendimento pela IA" value={conversations.filter((item)=>item.status==="ia").length}/><DarkRow label="Assumidas por humano" value={conversations.filter((item)=>item.status==="humano").length}/><DarkRow label="Encerradas" value={conversations.filter((item)=>item.status==="encerrada").length}/></div></section></div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2"><Ranking title="Serviços mais agendados" items={serviceRanking}/><Ranking title="Desempenho por profissional" items={professionalRanking}/></div>
      </>}
    </div>
  </main>;
}

function rank(items: Appointment[], key: (item: Appointment) => string) { const map = new Map<string, number>(); items.forEach((item)=>map.set(key(item),(map.get(key(item))??0)+1)); return Array.from(map.entries()).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count).slice(0,6); }
function Metric({icon:Icon,label,value,accent=false}:{icon:typeof CalendarCheck2;label:string;value:number|string;accent?:boolean}){return <article className={`rounded-3xl border p-5 ${accent?"border-emerald-200 bg-emerald-50":"border-slate-200 bg-white"}`}><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent?"bg-emerald-500 text-white":"bg-slate-100 text-slate-600"}`}><Icon className="h-4 w-4"/></div><p className="mt-4 text-xs font-medium text-slate-500">{label}</p><p className="mt-1 font-[Sora] text-2xl font-bold">{value}</p></article>}
function DarkRow({label,value}:{label:string;value:number}){return <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3"><span className="text-sm text-slate-400">{label}</span><span className="font-bold">{value}</span></div>}
function Ranking({title,items}:{title:string;items:{name:string;count:number}[]}){const max=Math.max(1,...items.map((item)=>item.count));return <section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="font-[Sora] text-lg font-semibold">{title}</h2>{items.length?<div className="mt-6 space-y-4">{items.map((item,index)=><div key={item.name}><div className="mb-2 flex items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">{index+1}</span><span className="truncate text-sm font-semibold">{item.name}</span></div><span className="text-sm font-bold">{item.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{width:`${(item.count/max)*100}%`}}/></div></div>)}</div>:<p className="mt-6 text-sm text-slate-400">Ainda não há dados suficientes neste período.</p>}</section>}
