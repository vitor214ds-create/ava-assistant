import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bot, Plus, Search, ArrowLeft, X, Save, BriefcaseBusiness, Clock3, CircleDollarSign, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/servicos")({
  head: () => ({ meta: [{ title: "Serviços | RecepIA" }] }),
  component: ServicesPage,
});

type Service = { id: string; name: string; description: string | null; price_cents: number; duration_minutes: number; is_active: boolean; professional_id: string | null; professionals: { name: string } | null };
type Professional = { id: string; name: string };

function ServicesPage() {
  const navigate = useNavigate();
  const { user, organizationId, loading } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "", price: "", duration: "30", professionalId: "" });

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login" });
    if (!organizationId) return void navigate({ to: "/onboarding" });
    void loadData();
  }, [loading, user, organizationId]);

  async function loadData() {
    if (!organizationId) return;
    const [servicesRes, professionalsRes] = await Promise.all([
      supabase.from("services").select("id,name,description,price_cents,duration_minutes,is_active,professional_id,professionals(name)").eq("organization_id", organizationId).order("created_at", { ascending: false }),
      supabase.from("professionals").select("id,name").eq("organization_id", organizationId).eq("is_active", true).order("name"),
    ]);
    setServices((servicesRes.data ?? []) as Service[]);
    setProfessionals(professionalsRes.data ?? []);
  }

  async function createService(event: React.FormEvent) {
    event.preventDefault(); if (!organizationId) return;
    setSaving(true); setError("");
    const parsedPrice = Math.round(Number(form.price.replace(",", ".")) * 100);
    const duration = Number(form.duration);
    const { error: insertError } = await supabase.from("services").insert({ organization_id: organizationId, name: form.name, description: form.description || null, price_cents: Number.isFinite(parsedPrice) ? parsedPrice : 0, duration_minutes: duration || 30, professional_id: form.professionalId || null, is_active: true });
    if (insertError) { setError("Não foi possível cadastrar o serviço."); setSaving(false); return; }
    setForm({ name: "", description: "", price: "", duration: "30", professionalId: "" }); setShowModal(false); setSaving(false); await loadData();
  }

  async function toggleActive(item: Service) {
    await supabase.from("services").update({ is_active: !item.is_active }).eq("id", item.id);
    await loadData();
  }

  const filtered = useMemo(() => services.filter((item) => [item.name, item.description, item.professionals?.name].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())), [services, search]);

  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/dashboard" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></Link><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Voltar ao painel</Link></div></header>
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-emerald-600">Serviços</p><h1 className="mt-1 font-[Sora] text-3xl font-bold">Catálogo de atendimentos.</h1><p className="mt-2 text-sm text-slate-500">Defina duração, valor e profissional responsável por cada serviço.</p></div><button onClick={() => setShowModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600"><Plus className="h-4 w-4" />Novo serviço</button></div>
      <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"><div className="relative"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar serviço ou profissional" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-emerald-500"/></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.length ? filtered.map((item) => <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{item.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.description ?? "Sem descrição."}</p></div><button onClick={() => toggleActive(item)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{item.is_active ? "Ativo" : "Inativo"}</button></div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-white p-3"><p className="text-xs text-slate-400">Duração</p><p className="mt-1 font-semibold">{item.duration_minutes} min</p></div><div className="rounded-xl bg-white p-3"><p className="text-xs text-slate-400">Preço</p><p className="mt-1 font-semibold">{(item.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div></div><p className="mt-4 text-xs text-slate-500">Profissional: <span className="font-semibold text-slate-700">{item.professionals?.name ?? "Qualquer disponível"}</span></p></article>) : <div className="sm:col-span-2 lg:col-span-3 py-14 text-center"><BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-600">Nenhum serviço encontrado.</p></div>}</div></section>
    </div>
    {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="font-[Sora] text-xl font-semibold">Novo serviço</h2><p className="mt-1 text-sm text-slate-500">Adicione um atendimento ao catálogo.</p></div><button onClick={() => setShowModal(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5"/></button></div><form onSubmit={createService} className="mt-6 grid gap-4 sm:grid-cols-2"><Input label="Nome" icon={BriefcaseBusiness} value={form.name} onChange={(value) => setForm({ ...form, name: value })} required /><Input label="Preço (R$)" icon={CircleDollarSign} value={form.price} onChange={(value) => setForm({ ...form, price: value })} /><Input label="Duração (min)" icon={Clock3} value={form.duration} onChange={(value) => setForm({ ...form, duration: value })} type="number" /><label><span className="mb-2 block text-sm font-semibold">Profissional</span><div className="relative"><UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><select value={form.professionalId} onChange={(e) => setForm({ ...form, professionalId: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm"><option value="">Qualquer disponível</option>{professionals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">Descrição</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm"/></label>{error && <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<button disabled={saving} className="sm:col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white"><Save className="h-4 w-4"/>{saving ? "Salvando..." : "Salvar serviço"}</button></form></div></div>}
  </main>;
}

function Input({ label, icon: Icon, value, onChange, required = false, type = "text" }: { label: string; icon: typeof BriefcaseBusiness; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) { return <label><span className="mb-2 block text-sm font-semibold">{label}</span><div className="relative"><Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm"/></div></label>; }
