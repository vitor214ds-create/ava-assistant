import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bot, Building2, Check, Clock3, Save, UserRoundCog } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/horarios")({
  head: () => ({ meta: [{ title: "Horários | RecepIA" }] }),
  component: HoursPage,
});

type DayRow = { weekday: number; is_open: boolean; opens_at: string; closes_at: string; break_start: string; break_end: string };
type Professional = { id: string; name: string; role_title: string | null };
type ProfessionalDay = { weekday: number; is_open: boolean; opens_at: string; closes_at: string };

const week = [
  [1, "Segunda-feira"], [2, "Terça-feira"], [3, "Quarta-feira"], [4, "Quinta-feira"], [5, "Sexta-feira"], [6, "Sábado"], [7, "Domingo"],
] as const;

function defaultBusinessHours(): DayRow[] {
  return week.map(([weekday]) => ({ weekday, is_open: weekday <= 6, opens_at: "08:00", closes_at: weekday === 6 ? "13:00" : "18:00", break_start: weekday <= 5 ? "12:00" : "", break_end: weekday <= 5 ? "13:00" : "" }));
}
function defaultProfessionalHours(): ProfessionalDay[] {
  return week.map(([weekday]) => ({ weekday, is_open: weekday <= 5, opens_at: "08:00", closes_at: "18:00" }));
}

function HoursPage() {
  const navigate = useNavigate();
  const { user, organizationId, loading } = useAuth();
  const [businessHours, setBusinessHours] = useState<DayRow[]>(defaultBusinessHours());
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [professionalHours, setProfessionalHours] = useState<ProfessionalDay[]>(defaultProfessionalHours());
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingProfessional, setSavingProfessional] = useState(false);
  const [businessSaved, setBusinessSaved] = useState(false);
  const [professionalSaved, setProfessionalSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login" });
    if (!organizationId) return void navigate({ to: "/onboarding" });
    void loadInitial();
  }, [loading, user, organizationId]);

  useEffect(() => { if (organizationId && selectedProfessionalId) void loadProfessionalHours(selectedProfessionalId); }, [organizationId, selectedProfessionalId]);

  async function loadInitial() {
    if (!organizationId) return;
    const [hoursRes, professionalsRes] = await Promise.all([
      supabase.from("business_hours").select("weekday,is_open,opens_at,closes_at,break_start,break_end").eq("organization_id", organizationId).order("weekday"),
      supabase.from("professionals").select("id,name,role_title").eq("organization_id", organizationId).eq("is_active", true).order("name"),
    ]);
    if (hoursRes.error || professionalsRes.error) setError("Não foi possível carregar os horários.");
    if (hoursRes.data?.length) {
      const defaults = defaultBusinessHours();
      setBusinessHours(defaults.map((day) => {
        const saved = hoursRes.data.find((item) => item.weekday === day.weekday);
        return saved ? { weekday: day.weekday, is_open: saved.is_open, opens_at: saved.opens_at?.slice(0, 5) ?? "08:00", closes_at: saved.closes_at?.slice(0, 5) ?? "18:00", break_start: saved.break_start?.slice(0, 5) ?? "", break_end: saved.break_end?.slice(0, 5) ?? "" } : day;
      }));
    }
    const pros = (professionalsRes.data ?? []) as Professional[];
    setProfessionals(pros);
    if (pros.length) setSelectedProfessionalId(pros[0].id);
  }

  async function loadProfessionalHours(professionalId: string) {
    if (!organizationId) return;
    const { data, error: loadError } = await supabase.from("professional_hours").select("weekday,is_open,opens_at,closes_at").eq("organization_id", organizationId).eq("professional_id", professionalId).order("weekday");
    if (loadError) return setError("Não foi possível carregar a escala deste profissional.");
    const defaults = defaultProfessionalHours();
    setProfessionalHours(defaults.map((day) => {
      const saved = data?.find((item) => item.weekday === day.weekday);
      return saved ? { weekday: day.weekday, is_open: saved.is_open, opens_at: saved.opens_at?.slice(0, 5) ?? "08:00", closes_at: saved.closes_at?.slice(0, 5) ?? "18:00" } : day;
    }));
  }

  function updateBusinessDay(weekday: number, patch: Partial<DayRow>) {
    setBusinessHours((items) => items.map((item) => item.weekday === weekday ? { ...item, ...patch } : item));
    setBusinessSaved(false);
  }
  function updateProfessionalDay(weekday: number, patch: Partial<ProfessionalDay>) {
    setProfessionalHours((items) => items.map((item) => item.weekday === weekday ? { ...item, ...patch } : item));
    setProfessionalSaved(false);
  }

  function validateBusiness() {
    for (const day of businessHours) {
      if (!day.is_open) continue;
      if (day.opens_at >= day.closes_at) return "O horário de abertura precisa ser anterior ao fechamento.";
      if ((day.break_start && !day.break_end) || (!day.break_start && day.break_end)) return "Preencha início e fim do intervalo, ou deixe ambos vazios.";
      if (day.break_start && day.break_end && (day.break_start >= day.break_end || day.break_start < day.opens_at || day.break_end > day.closes_at)) return "O intervalo precisa ficar dentro do horário de funcionamento.";
    }
    return "";
  }

  async function saveBusiness(event: FormEvent) {
    event.preventDefault();
    if (!organizationId) return;
    const validation = validateBusiness();
    if (validation) return setError(validation);
    setSavingBusiness(true); setError(""); setBusinessSaved(false);
    const rows = businessHours.map((day) => ({ organization_id: organizationId, weekday: day.weekday, is_open: day.is_open, opens_at: day.opens_at, closes_at: day.closes_at, break_start: day.is_open && day.break_start ? day.break_start : null, break_end: day.is_open && day.break_end ? day.break_end : null }));
    const { error: saveError } = await supabase.from("business_hours").upsert(rows, { onConflict: "organization_id,weekday" });
    if (saveError) setError("Não foi possível salvar o horário da empresa."); else setBusinessSaved(true);
    setSavingBusiness(false);
  }

  async function saveProfessional(event: FormEvent) {
    event.preventDefault();
    if (!organizationId || !selectedProfessionalId) return;
    for (const day of professionalHours) if (day.is_open && day.opens_at >= day.closes_at) return setError("Na escala do profissional, a abertura precisa ser anterior ao fechamento.");
    setSavingProfessional(true); setError(""); setProfessionalSaved(false);
    const rows = professionalHours.map((day) => ({ organization_id: organizationId, professional_id: selectedProfessionalId, weekday: day.weekday, is_open: day.is_open, opens_at: day.opens_at, closes_at: day.closes_at }));
    const { error: saveError } = await supabase.from("professional_hours").upsert(rows, { onConflict: "professional_id,weekday" });
    if (saveError) setError("Não foi possível salvar a escala do profissional."); else setProfessionalSaved(true);
    setSavingProfessional(false);
  }

  const selectedProfessional = useMemo(() => professionals.find((item) => item.id === selectedProfessionalId), [professionals, selectedProfessionalId]);

  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/dashboard" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5"/></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></Link><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4"/>Voltar ao painel</Link></div></header>
    <div className="mx-auto max-w-7xl p-5 sm:p-8"><div><p className="text-sm font-semibold text-emerald-600">Disponibilidade</p><h1 className="mt-1 font-[Sora] text-3xl font-bold">Horários de funcionamento.</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">A RecepIA usa estes horários, junto com a duração dos serviços e os compromissos existentes, para oferecer apenas horários realmente disponíveis.</p></div>
      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <form onSubmit={saveBusiness} className="rounded-3xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Building2 className="h-5 w-5"/></span><div><h2 className="font-[Sora] text-lg font-semibold">Horário da empresa</h2><p className="text-sm text-slate-500">Defina expediente e intervalo por dia.</p></div></div><div className="mt-6 space-y-3">{businessHours.map((day) => <BusinessDayRow key={day.weekday} day={day} onChange={(patch) => updateBusinessDay(day.weekday, patch)}/>)}</div>{businessSaved && <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600"><Check className="h-4 w-4"/>Horário da empresa salvo.</p>}<button disabled={savingBusiness} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4"/>{savingBusiness ? "Salvando..." : "Salvar horário da empresa"}</button></form>
        <form onSubmit={saveProfessional} className="rounded-3xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600"><UserRoundCog className="h-5 w-5"/></span><div><h2 className="font-[Sora] text-lg font-semibold">Escala por profissional</h2><p className="text-sm text-slate-500">Um profissional pode trabalhar menos dias ou horas que a empresa.</p></div></div>{professionals.length ? <><label className="mt-6 block"><span className="mb-2 block text-sm font-semibold">Profissional</span><select value={selectedProfessionalId} onChange={(e) => { setSelectedProfessionalId(e.target.value); setProfessionalSaved(false); }} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{professionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.name}{professional.role_title ? ` — ${professional.role_title}` : ""}</option>)}</select></label><div className="mt-5 space-y-3">{professionalHours.map((day) => <ProfessionalDayRow key={day.weekday} day={day} onChange={(patch) => updateProfessionalDay(day.weekday, patch)}/>)}</div>{professionalSaved && <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600"><Check className="h-4 w-4"/>Escala de {selectedProfessional?.name} salva.</p>}<button disabled={savingProfessional} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4"/>{savingProfessional ? "Salvando..." : "Salvar escala do profissional"}</button></> : <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center"><UserRoundCog className="mx-auto h-8 w-8 text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-600">Cadastre um profissional primeiro.</p><Link to="/profissionais" className="mt-2 inline-flex text-sm font-bold text-emerald-600">Ir para Profissionais</Link></div>}</form>
      </div><section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5"><div className="flex items-start gap-3"><Clock3 className="mt-0.5 h-5 w-5 text-emerald-500"/><div><h3 className="font-semibold">Como a disponibilidade é calculada</h3><p className="mt-1 text-sm leading-6 text-slate-500">O sistema cruza o horário da empresa, a escala individual, o intervalo, a duração do serviço e os agendamentos existentes. A IA só deve oferecer um horário quando todas essas regras permitirem.</p></div></div></section></div>
  </main>;
}

function BusinessDayRow({ day, onChange }: { day: DayRow; onChange: (patch: Partial<DayRow>) => void }) {
  const label = week.find(([value]) => value === day.weekday)?.[1] ?? "Dia";
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">{label}</p><p className="text-xs text-slate-400">{day.is_open ? "Aberto" : "Fechado"}</p></div><button type="button" onClick={() => onChange({ is_open: !day.is_open })} className={`relative h-7 w-12 rounded-full transition ${day.is_open ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${day.is_open ? "left-6" : "left-1"}`}/></button></div>{day.is_open && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><TimeField label="Abre" value={day.opens_at} onChange={(value) => onChange({ opens_at: value })}/><TimeField label="Fecha" value={day.closes_at} onChange={(value) => onChange({ closes_at: value })}/><TimeField label="Início intervalo" value={day.break_start} onChange={(value) => onChange({ break_start: value })}/><TimeField label="Fim intervalo" value={day.break_end} onChange={(value) => onChange({ break_end: value })}/></div>}</div>;
}
function ProfessionalDayRow({ day, onChange }: { day: ProfessionalDay; onChange: (patch: Partial<ProfessionalDay>) => void }) {
  const label = week.find(([value]) => value === day.weekday)?.[1] ?? "Dia";
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-center justify-between gap-4"><p className="text-sm font-semibold">{label}</p><button type="button" onClick={() => onChange({ is_open: !day.is_open })} className={`relative h-7 w-12 rounded-full transition ${day.is_open ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${day.is_open ? "left-6" : "left-1"}`}/></button></div>{day.is_open && <div className="mt-4 grid grid-cols-2 gap-3"><TimeField label="Início" value={day.opens_at} onChange={(value) => onChange({ opens_at: value })}/><TimeField label="Fim" value={day.closes_at} onChange={(value) => onChange({ closes_at: value })}/></div>}</div>;
}
function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span><input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm"/></label>; }
