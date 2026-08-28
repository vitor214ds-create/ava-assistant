import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bot, CalendarDays, Plus, UsersRound, BriefcaseBusiness, Clock3, X, Save, ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/agenda")({
  head: () => ({ meta: [{ title: "Agenda | RecepIA" }] }),
  component: AgendaPage,
});

type Client = { id: string; name: string };
type Service = { id: string; name: string; duration_minutes: number };
type Professional = { id: string; name: string };
type Appointment = { id: string; starts_at: string; ends_at: string; status: string; clients: { name: string } | null; services: { name: string } | null; professionals: { name: string } | null };

function AgendaPage() {
  const navigate = useNavigate();
  const { user, organizationId, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ clientId: "", serviceId: "", professionalId: "", date: new Date().toISOString().slice(0, 10), time: "09:00", notes: "" });

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login" });
    if (!organizationId) return void navigate({ to: "/onboarding" });
    void loadBaseData();
  }, [loading, user, organizationId]);

  useEffect(() => { if (organizationId) void loadAppointments(); }, [organizationId, selectedDate]);

  async function loadBaseData() {
    if (!organizationId) return;
    const [clientsRes, servicesRes, professionalsRes] = await Promise.all([
      supabase.from("clients").select("id,name").eq("organization_id", organizationId).order("name"),
      supabase.from("services").select("id,name,duration_minutes").eq("organization_id", organizationId).eq("is_active", true).order("name"),
      supabase.from("professionals").select("id,name").eq("organization_id", organizationId).eq("is_active", true).order("name"),
    ]);
    setClients(clientsRes.data ?? []); setServices(servicesRes.data ?? []); setProfessionals(professionalsRes.data ?? []);
  }

  async function loadAppointments() {
    if (!organizationId) return;
    const start = new Date(`${selectedDate}T00:00:00`); const end = new Date(`${selectedDate}T23:59:59`);
    const { data } = await supabase.from("appointments").select("id,starts_at,ends_at,status,clients(name),services(name),professionals(name)").eq("organization_id", organizationId).gte("starts_at", start.toISOString()).lte("starts_at", end.toISOString()).order("starts_at");
    setAppointments((data ?? []) as Appointment[]);
  }

  const selectedService = useMemo(() => services.find((item) => item.id === form.serviceId), [services, form.serviceId]);

  async function createAppointment(event: React.FormEvent) {
    event.preventDefault(); if (!organizationId || !form.clientId || !form.serviceId || !form.professionalId) return;
    setSaving(true); setError("");
    const startsAt = new Date(`${form.date}T${form.time}:00`);
    const endsAt = new Date(startsAt.getTime() + (selectedService?.duration_minutes ?? 30) * 60000);
    const { data: conflict } = await supabase.from("appointments").select("id").eq("organization_id", organizationId).eq("professional_id", form.professionalId).neq("status", "cancelado").lt("starts_at", endsAt.toISOString()).gt("ends_at", startsAt.toISOString()).limit(1);
    if (conflict?.length) { setError("Este profissional já possui um agendamento nesse horário."); setSaving(false); return; }
    const { error: insertError } = await supabase.from("appointments").insert({ organization_id: organizationId, client_id: form.clientId, service_id: form.serviceId, professional_id: form.professionalId, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), notes: form.notes || null, status: "agendado", created_by_ai: false });
    if (insertError) { setError("Não foi possível criar o agendamento."); setSaving(false); return; }
    setSelectedDate(form.date); setShowModal(false); setSaving(false); setForm((current) => ({ ...current, notes: "" })); await loadAppointments();
  }

  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/dashboard" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></Link><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Voltar ao painel</Link></div></header>
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-emerald-600">Agenda</p><h1 className="mt-1 font-[Sora] text-3xl font-bold">Organize seus atendimentos.</h1><p className="mt-2 text-sm text-slate-500">Crie agendamentos e evite conflitos de horário automaticamente.</p></div><button onClick={() => setShowModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600"><Plus className="h-4 w-4" />Novo agendamento</button></div>
      <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-[Sora] text-lg font-semibold">Agenda do dia</h2><p className="text-sm text-slate-500">{appointments.length} atendimento(s) encontrado(s).</p></div><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></div>
      <div className="mt-5 space-y-3">{appointments.length ? appointments.map((item) => <article key={item.id} className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[90px_1fr_auto] sm:items-center"><div><p className="text-lg font-bold text-slate-950">{new Date(item.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p><p className="text-xs text-slate-400">até {new Date(item.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p></div><div><p className="font-semibold">{item.clients?.name ?? "Cliente"}</p><p className="mt-1 text-sm text-slate-500">{item.services?.name ?? "Serviço"} • {item.professionals?.name ?? "Profissional"}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold capitalize text-emerald-700">{item.status.replace("_", " ")}</span></article>) : <div className="py-14 text-center"><CalendarDays className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Nenhum agendamento neste dia.</p></div>}</div></section>
    </div>
    {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="font-[Sora] text-xl font-semibold">Novo agendamento</h2><p className="mt-1 text-sm text-slate-500">Preencha os dados do atendimento.</p></div><button onClick={() => setShowModal(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><form onSubmit={createAppointment} className="mt-6 grid gap-4 sm:grid-cols-2"><SelectField label="Cliente" icon={UsersRound} value={form.clientId} onChange={(value) => setForm({ ...form, clientId: value })} options={clients.map((item) => ({ value: item.id, label: item.name }))} /><SelectField label="Serviço" icon={BriefcaseBusiness} value={form.serviceId} onChange={(value) => setForm({ ...form, serviceId: value })} options={services.map((item) => ({ value: item.id, label: item.name }))} /><SelectField label="Profissional" icon={UsersRound} value={form.professionalId} onChange={(value) => setForm({ ...form, professionalId: value })} options={professionals.map((item) => ({ value: item.id, label: item.name }))} /><label><span className="mb-2 block text-sm font-semibold">Data</span><input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label><label><span className="mb-2 block text-sm font-semibold">Horário</span><div className="relative"><Clock3 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm" /></div></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">Observações</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label>{error && <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<button disabled={saving} className="sm:col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white"><Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar agendamento"}</button></form></div></div>}
  </main>;
}

function SelectField({ label, icon: Icon, value, onChange, options }: { label: string; icon: typeof UsersRound; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <label><span className="mb-2 block text-sm font-semibold">{label}</span><div className="relative"><Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><select required value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm"><option value="">Selecione</option>{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></label>; }
