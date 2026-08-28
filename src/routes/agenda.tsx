import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bot, BriefcaseBusiness, CalendarDays, Clock3, Pencil, Plus, Save, Sparkles, Trash2, UsersRound, X } from "lucide-react";
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
type Appointment = {
  id: string;
  client_id: string | null;
  service_id: string | null;
  professional_id: string | null;
  starts_at: string;
  ends_at: string;
  status: "agendado" | "confirmado" | "concluido" | "cancelado" | "nao_compareceu";
  notes: string | null;
  created_by_ai: boolean;
  clients: { name: string } | null;
  services: { name: string } | null;
  professionals: { name: string } | null;
};

type AppointmentForm = { clientId: string; serviceId: string; professionalId: string; date: string; time: string; notes: string; status: Appointment["status"] };
const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = (): AppointmentForm => ({ clientId: "", serviceId: "", professionalId: "", date: today(), time: "09:00", notes: "", status: "agendado" });

function AgendaPage() {
  const navigate = useNavigate();
  const { user, organizationId, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedDate, setSelectedDate] = useState(today());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<AppointmentForm>(emptyForm());

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
    const { data } = await supabase.from("appointments").select("id,client_id,service_id,professional_id,starts_at,ends_at,status,notes,created_by_ai,clients(name),services(name),professionals(name)").eq("organization_id", organizationId).gte("starts_at", start.toISOString()).lte("starts_at", end.toISOString()).order("starts_at");
    setAppointments((data ?? []) as Appointment[]);
  }

  const selectedService = useMemo(() => services.find((item) => item.id === form.serviceId), [services, form.serviceId]);
  const aiCount = appointments.filter((item) => item.created_by_ai).length;

  function openCreate() { setEditing(null); setError(""); setForm({ ...emptyForm(), date: selectedDate }); setShowModal(true); }
  function openEdit(item: Appointment) {
    const start = new Date(item.starts_at);
    setEditing(item); setError("");
    setForm({ clientId: item.client_id ?? "", serviceId: item.service_id ?? "", professionalId: item.professional_id ?? "", date: start.toISOString().slice(0, 10), time: start.toTimeString().slice(0, 5), notes: item.notes ?? "", status: item.status });
    setShowModal(true);
  }

  async function hasConflict(startsAt: Date, endsAt: Date, professionalId: string, excludeId?: string) {
    if (!organizationId) return false;
    let query = supabase.from("appointments").select("id").eq("organization_id", organizationId).eq("professional_id", professionalId).neq("status", "cancelado").lt("starts_at", endsAt.toISOString()).gt("ends_at", startsAt.toISOString());
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.limit(1);
    return Boolean(data?.length);
  }

  async function saveAppointment(event: React.FormEvent) {
    event.preventDefault(); if (!organizationId || !form.clientId || !form.serviceId || !form.professionalId) return;
    setSaving(true); setError("");
    const startsAt = new Date(`${form.date}T${form.time}:00`);
    const endsAt = new Date(startsAt.getTime() + (selectedService?.duration_minutes ?? 30) * 60_000);
    if (form.status !== "cancelado" && await hasConflict(startsAt, endsAt, form.professionalId, editing?.id)) {
      setError("Este profissional já possui um agendamento nesse horário."); setSaving(false); return;
    }
    const payload = { client_id: form.clientId, service_id: form.serviceId, professional_id: form.professionalId, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), notes: form.notes || null, status: form.status };
    const result = editing
      ? await supabase.from("appointments").update(payload).eq("id", editing.id).eq("organization_id", organizationId)
      : await supabase.from("appointments").insert({ organization_id: organizationId, ...payload, created_by_ai: false });
    if (result.error) { setError("Não foi possível salvar o agendamento. Verifique se o horário continua disponível."); setSaving(false); return; }
    setSelectedDate(form.date); setShowModal(false); setEditing(null); setSaving(false); await loadAppointments();
  }

  async function cancelAppointment(item: Appointment) {
    if (!organizationId || item.status === "cancelado") return;
    if (!window.confirm(`Cancelar o agendamento de ${item.clients?.name ?? "Cliente"}?`)) return;
    await supabase.from("appointments").update({ status: "cancelado" }).eq("id", item.id).eq("organization_id", organizationId);
    await loadAppointments();
  }

  const statusClass = (status: Appointment["status"]) => status === "cancelado" ? "bg-red-50 text-red-700" : status === "concluido" ? "bg-blue-50 text-blue-700" : status === "nao_compareceu" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";

  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/dashboard" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></Link><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Voltar ao painel</Link></div></header>
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-emerald-600">Agenda</p><h1 className="mt-1 font-[Sora] text-3xl font-bold">Organize seus atendimentos.</h1><p className="mt-2 text-sm text-slate-500">Agendamentos manuais e criados automaticamente pela sua recepcionista usam a mesma agenda em tempo real.</p></div><button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600"><Plus className="h-4 w-4" />Novo agendamento</button></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Agendamentos do dia</p><p className="mt-1 text-2xl font-bold">{appointments.length}</p></div><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center gap-2 text-emerald-700"><Sparkles className="h-4 w-4" /><p className="text-xs font-semibold">Criados pela IA</p></div><p className="mt-1 text-2xl font-bold text-emerald-800">{aiCount}</p></div></div>
      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-[Sora] text-lg font-semibold">Agenda do dia</h2><p className="text-sm text-slate-500">A origem de cada atendimento aparece ao lado do cliente.</p></div><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></div>
        <div className="mt-5 space-y-3">{appointments.length ? appointments.map((item) => <article key={item.id} className={`grid gap-4 rounded-2xl border p-4 sm:grid-cols-[90px_1fr_auto] sm:items-center ${item.status === "cancelado" ? "border-red-100 bg-red-50/30 opacity-70" : item.created_by_ai ? "border-emerald-200 bg-emerald-50/40" : "border-slate-100 bg-slate-50"}`}><div><p className="text-lg font-bold text-slate-950">{new Date(item.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p><p className="text-xs text-slate-400">até {new Date(item.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p></div><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.clients?.name ?? "Cliente"}</p><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${item.created_by_ai ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"}`}>{item.created_by_ai && <Bot className="h-3 w-3" />}{item.created_by_ai ? "Agendado pela IA" : "Agendamento manual"}</span></div><p className="mt-1 text-sm text-slate-500">{item.services?.name ?? "Serviço"} • {item.professionals?.name ?? "Profissional"}</p>{item.notes && <p className="mt-1 text-xs text-slate-400">{item.notes}</p>}</div><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${statusClass(item.status)}`}>{item.status.replace("_", " ")}</span><button onClick={() => openEdit(item)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-950" aria-label="Editar"><Pencil className="h-4 w-4" /></button>{item.status !== "cancelado" && <button onClick={() => cancelAppointment(item)} className="rounded-xl border border-red-100 bg-white p-2 text-red-500 hover:bg-red-50" aria-label="Cancelar"><Trash2 className="h-4 w-4" /></button>}</div></article>) : <div className="py-14 text-center"><CalendarDays className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Nenhum agendamento neste dia.</p></div>}</div>
      </section>
    </div>

    {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="font-[Sora] text-xl font-semibold">{editing ? "Editar agendamento" : "Novo agendamento"}</h2><p className="mt-1 text-sm text-slate-500">{editing ? "Altere horário, profissional, serviço ou status." : "Preencha os dados do atendimento."}</p></div><button onClick={() => setShowModal(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><form onSubmit={saveAppointment} className="mt-6 grid gap-4 sm:grid-cols-2"><SelectField label="Cliente" icon={UsersRound} value={form.clientId} onChange={(value) => setForm({ ...form, clientId: value })} options={clients.map((item) => ({ value: item.id, label: item.name }))} /><SelectField label="Serviço" icon={BriefcaseBusiness} value={form.serviceId} onChange={(value) => setForm({ ...form, serviceId: value })} options={services.map((item) => ({ value: item.id, label: item.name }))} /><SelectField label="Profissional" icon={UsersRound} value={form.professionalId} onChange={(value) => setForm({ ...form, professionalId: value })} options={professionals.map((item) => ({ value: item.id, label: item.name }))} /><label><span className="mb-2 block text-sm font-semibold">Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Appointment["status"] })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="agendado">Agendado</option><option value="confirmado">Confirmado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option><option value="nao_compareceu">Não compareceu</option></select></label><label><span className="mb-2 block text-sm font-semibold">Data</span><input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label><label><span className="mb-2 block text-sm font-semibold">Horário</span><div className="relative"><Clock3 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm" /></div></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">Observações</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label>{error && <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<button disabled={saving} className="sm:col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white"><Save className="h-4 w-4" />{saving ? "Salvando..." : editing ? "Salvar alterações" : "Salvar agendamento"}</button></form></div></div>}
  </main>;
}

function SelectField({ label, icon: Icon, value, onChange, options }: { label: string; icon: typeof UsersRound; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <label><span className="mb-2 block text-sm font-semibold">{label}</span><div className="relative"><Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><select required value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm"><option value="">Selecione</option>{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></label>; }
