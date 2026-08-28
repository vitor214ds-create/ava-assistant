import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bot, Plus, Search, UserRound, ArrowLeft, X, Save, BriefcaseBusiness, Mail, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/profissionais")({
  head: () => ({ meta: [{ title: "Profissionais | RecepIA" }] }),
  component: ProfessionalsPage,
});

type Professional = { id: string; name: string; role_title: string | null; email: string | null; phone: string | null; is_active: boolean };

function ProfessionalsPage() {
  const navigate = useNavigate();
  const { user, organizationId, loading } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", roleTitle: "", email: "", phone: "" });

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login" });
    if (!organizationId) return void navigate({ to: "/onboarding" });
    void loadProfessionals();
  }, [loading, user, organizationId]);

  async function loadProfessionals() {
    if (!organizationId) return;
    const { data } = await supabase.from("professionals").select("id,name,role_title,email,phone,is_active").eq("organization_id", organizationId).order("created_at", { ascending: false });
    setProfessionals(data ?? []);
  }

  async function createProfessional(event: React.FormEvent) {
    event.preventDefault(); if (!organizationId) return;
    setSaving(true); setError("");
    const { error: insertError } = await supabase.from("professionals").insert({ organization_id: organizationId, name: form.name, role_title: form.roleTitle || null, email: form.email || null, phone: form.phone || null, is_active: true });
    if (insertError) { setError("Não foi possível cadastrar o profissional."); setSaving(false); return; }
    setForm({ name: "", roleTitle: "", email: "", phone: "" }); setShowModal(false); setSaving(false); await loadProfessionals();
  }

  async function toggleActive(item: Professional) {
    await supabase.from("professionals").update({ is_active: !item.is_active }).eq("id", item.id);
    await loadProfessionals();
  }

  const filtered = useMemo(() => professionals.filter((item) => [item.name, item.role_title, item.email, item.phone].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())), [professionals, search]);

  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/dashboard" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></Link><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Voltar ao painel</Link></div></header>
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-emerald-600">Profissionais</p><h1 className="mt-1 font-[Sora] text-3xl font-bold">Equipe de atendimento.</h1><p className="mt-2 text-sm text-slate-500">Cadastre profissionais para vincular serviços e controlar a disponibilidade na agenda.</p></div><button onClick={() => setShowModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600"><Plus className="h-4 w-4" />Novo profissional</button></div>
      <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"><div className="relative"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, cargo, telefone ou e-mail" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-emerald-500"/></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.length ? filtered.map((item) => <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm"><UserRound className="h-5 w-5"/></div><div><h3 className="font-semibold">{item.name}</h3><p className="text-xs text-slate-500">{item.role_title ?? "Profissional"}</p></div></div><button onClick={() => toggleActive(item)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{item.is_active ? "Ativo" : "Inativo"}</button></div><div className="mt-4 space-y-2 text-sm text-slate-500">{item.phone && <p>{item.phone}</p>}{item.email && <p>{item.email}</p>}</div></article>) : <div className="sm:col-span-2 lg:col-span-3 py-14 text-center"><UserRound className="mx-auto h-9 w-9 text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-600">Nenhum profissional encontrado.</p></div>}</div></section>
    </div>
    {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="font-[Sora] text-xl font-semibold">Novo profissional</h2><p className="mt-1 text-sm text-slate-500">Cadastre alguém da sua equipe.</p></div><button onClick={() => setShowModal(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5"/></button></div><form onSubmit={createProfessional} className="mt-6 grid gap-4 sm:grid-cols-2"><Input label="Nome" icon={UserRound} value={form.name} onChange={(value) => setForm({ ...form, name: value })} required /><Input label="Cargo/Especialidade" icon={BriefcaseBusiness} value={form.roleTitle} onChange={(value) => setForm({ ...form, roleTitle: value })} /><Input label="E-mail" icon={Mail} value={form.email} onChange={(value) => setForm({ ...form, email: value })} type="email" /><Input label="Telefone" icon={Phone} value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />{error && <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<button disabled={saving} className="sm:col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white"><Save className="h-4 w-4"/>{saving ? "Salvando..." : "Salvar profissional"}</button></form></div></div>}
  </main>;
}

function Input({ label, icon: Icon, value, onChange, required = false, type = "text" }: { label: string; icon: typeof UserRound; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) { return <label><span className="mb-2 block text-sm font-semibold">{label}</span><div className="relative"><Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm"/></div></label>; }
