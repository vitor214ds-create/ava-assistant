import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bot, CalendarDays, CalendarCheck2, MessageCircleMore, UsersRound, Clock3, Sparkles, LogOut, Bell, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Painel | RecepIA" }] }),
  component: DashboardPage,
});

type Stats = { appointmentsToday: number; clients: number; conversations: number; aiAppointments: number };

function DashboardPage() {
  const navigate = useNavigate();
  const { user, organizationId, loading, signOut } = useAuth();
  const [companyName, setCompanyName] = useState("Sua empresa");
  const [stats, setStats] = useState<Stats>({ appointmentsToday: 0, clients: 0, conversations: 0, aiAppointments: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login" });
    if (!organizationId) return void navigate({ to: "/onboarding" });

    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);

    void Promise.all([
      supabase.from("organizations").select("name,onboarding_completed").eq("id", organizationId).single(),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString()),
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
      supabase.from("conversations").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("created_at", start.toISOString()),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("created_by_ai", true).gte("created_at", start.toISOString()),
      supabase.from("appointments").select("id,starts_at,status,clients(name),services(name)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(5),
    ]).then(([org, appointments, clients, conversations, aiAppointments, recentAppointments]) => {
      if (org.data) {
        setCompanyName(org.data.name);
        if (!org.data.onboarding_completed) return void navigate({ to: "/onboarding" });
      }
      setStats({ appointmentsToday: appointments.count ?? 0, clients: clients.count ?? 0, conversations: conversations.count ?? 0, aiAppointments: aiAppointments.count ?? 0 });
      setRecent(recentAppointments.data ?? []);
    });
  }, [loading, user, organizationId]);

  async function handleSignOut() { await signOut(); navigate({ to: "/" }); }

  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-18 items-center gap-2.5 border-b border-slate-100 px-6"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></div>
      <nav className="space-y-1 p-4 text-sm font-semibold">
        <NavLink to="/dashboard" icon={CalendarDays} label="Painel" active />
        <NavLink to="/agenda" icon={CalendarCheck2} label="Agenda" />
        <NavLink to="/clientes" icon={UsersRound} label="Clientes" />
        <div className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-400"><MessageCircleMore className="h-4 w-4" />Conversas</div>
        <div className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-400"><Sparkles className="h-4 w-4" />Configuração da IA</div>
      </nav>
      <button onClick={handleSignOut} className="absolute bottom-5 left-4 right-4 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"><LogOut className="h-4 w-4" />Sair</button>
    </aside>

    <div className="lg:pl-64">
      <header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur-xl sm:px-8"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">RecepIA</p><p className="font-semibold text-slate-950">{companyName}</p></div><div className="flex items-center gap-3"><button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500"><Bell className="h-4 w-4" /></button><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">{user?.email?.slice(0, 1).toUpperCase() ?? "U"}</div></div></header>
      <div className="mx-auto max-w-7xl p-5 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-emerald-600">Visão geral</p><h1 className="mt-1 font-[Sora] text-3xl font-bold tracking-tight">Bom trabalho hoje.</h1><p className="mt-2 text-sm text-slate-500">Veja o que está acontecendo no atendimento da sua empresa.</p></div><Link to="/agenda" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600">Novo agendamento<ArrowUpRight className="h-4 w-4" /></Link></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={CalendarCheck2} label="Agendamentos hoje" value={stats.appointmentsToday} helper="Agenda do dia" /><StatCard icon={UsersRound} label="Clientes cadastrados" value={stats.clients} helper="Base total" /><StatCard icon={MessageCircleMore} label="Conversas hoje" value={stats.conversations} helper="Todos os canais" /><StatCard icon={Bot} label="Agendamentos pela IA" value={stats.aiAppointments} helper="Criados hoje" accent /></div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6"><div><h2 className="font-[Sora] text-lg font-semibold">Atividade recente</h2><p className="mt-1 text-sm text-slate-500">Últimos agendamentos registrados.</p></div><div className="mt-6 divide-y divide-slate-100">{recent.length ? recent.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CalendarCheck2 className="h-4 w-4" /></div><div><p className="text-sm font-semibold">{item.clients?.name ?? "Cliente"}</p><p className="text-xs text-slate-500">{item.services?.name ?? "Atendimento"}</p></div></div><div className="text-right"><p className="text-sm font-semibold text-slate-700">{new Date(item.starts_at).toLocaleDateString("pt-BR")}</p><p className="text-xs capitalize text-slate-400">{item.status.replace("_", " ")}</p></div></div>) : <div className="py-12 text-center"><CalendarDays className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Nenhuma atividade ainda</p></div>}</div></section>
          <section className="rounded-3xl bg-slate-950 p-6 text-white"><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500"><Bot className="h-5 w-5" /></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400">IA ativa</span></div><h2 className="mt-7 font-[Sora] text-xl font-semibold">IA trabalhando</h2><p className="mt-2 text-sm leading-6 text-slate-400">Sua recepcionista continua disponível para atender novos clientes e consultar horários.</p><div className="mt-7 space-y-4"><MiniStat label="Conversas atendidas hoje" value={stats.conversations} /><MiniStat label="Agendamentos realizados pela IA" value={stats.aiAppointments} accent /></div></section>
        </div>
      </div>
    </div>
  </main>;
}

function NavLink({ to, icon: Icon, label, active = false }: { to: "/dashboard" | "/agenda" | "/clientes"; icon: typeof CalendarDays; label: string; active?: boolean }) { return <Link to={to} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${active ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}><Icon className="h-4 w-4" />{label}</Link>; }
function StatCard({ icon: Icon, label, value, helper, accent = false }: { icon: typeof CalendarDays; label: string; value: number; helper: string; accent?: boolean }) { return <article className={`rounded-3xl border p-5 ${accent ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}><div className="flex items-center justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"}`}><Icon className="h-4 w-4" /></div><Clock3 className="h-4 w-4 text-slate-300" /></div><p className="mt-5 text-sm font-medium text-slate-500">{label}</p><p className="mt-1 font-[Sora] text-3xl font-bold">{value}</p><p className="mt-2 text-xs text-slate-400">{helper}</p></article>; }
function MiniStat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"><p className="text-xs text-slate-400">{label}</p><p className={`mt-2 text-3xl font-bold ${accent ? "text-emerald-400" : ""}`}>{value}</p></div>; }
