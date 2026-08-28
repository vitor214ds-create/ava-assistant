import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bot, Mail, Phone, Plus, Search, UserPlus, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes | RecepIA" }] }),
  component: ClientsPage,
});

type Client = { id: string; name: string; phone: string | null; email: string | null; status: "novo" | "ativo" | "inativo"; created_at: string; notes: string | null };

function ClientsPage() {
  const navigate = useNavigate();
  const { user, organizationId, loading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login" });
    if (!organizationId) return void navigate({ to: "/onboarding" });
    void loadClients();
  }, [loading, user, organizationId]);

  async function loadClients() {
    if (!organizationId) return;
    const { data } = await supabase.from("clients").select("id,name,phone,email,status,created_at,notes").eq("organization_id", organizationId).order("created_at", { ascending: false });
    setClients((data ?? []) as Client[]);
  }

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((client) => [client.name, client.phone ?? "", client.email ?? "", client.status].some((value) => value.toLowerCase().includes(term)));
  }, [clients, query]);

  async function createClient(event: React.FormEvent) {
    event.preventDefault();
    if (!organizationId) return;
    setSaving(true); setError("");
    const { error: insertError } = await supabase.from("clients").insert({ organization_id: organizationId, name: form.name.trim(), phone: form.phone.trim() || null, email: form.email.trim() || null, notes: form.notes.trim() || null, status: "novo" });
    if (insertError) { setError("Não foi possível cadastrar o cliente."); setSaving(false); return; }
    setForm({ name: "", phone: "", email: "", notes: "" }); setShowModal(false); setSaving(false); await loadClients();
  }

  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/dashboard" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></Link><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Voltar ao painel</Link></div></header>
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-emerald-600">CRM</p><h1 className="mt-1 font-[Sora] text-3xl font-bold">Clientes</h1><p className="mt-2 text-sm text-slate-500">Mantenha histórico e dados de contato organizados em um único lugar.</p></div><button onClick={() => setShowModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600"><Plus className="h-4 w-4" />Adicionar cliente</button></div>
      <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-[Sora] text-lg font-semibold">Base de clientes</h2><p className="text-sm text-slate-500">{clients.length} cliente(s) cadastrado(s).</p></div><div className="relative sm:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, telefone ou e-mail" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-emerald-500" /></div></div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"><th className="px-3 py-3 font-semibold">Cliente</th><th className="px-3 py-3 font-semibold">Contato</th><th className="px-3 py-3 font-semibold">Status</th><th className="px-3 py-3 font-semibold">Cadastro</th></tr></thead><tbody>{filtered.map((client) => <tr key={client.id} className="border-b border-slate-50"><td className="px-3 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700">{client.name.slice(0,1).toUpperCase()}</span><div><p className="font-semibold text-slate-900">{client.name}</p><p className="text-xs text-slate-400">{client.notes || "Sem observações"}</p></div></div></td><td className="px-3 py-4"><p className="flex items-center gap-2 text-slate-600"><Phone className="h-3.5 w-3.5" />{client.phone || "—"}</p><p className="mt-1 flex items-center gap-2 text-xs text-slate-400"><Mail className="h-3.5 w-3.5" />{client.email || "—"}</p></td><td className="px-3 py-4"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold capitalize text-slate-600">{client.status}</span></td><td className="px-3 py-4 text-slate-500">{new Date(client.created_at).toLocaleDateString("pt-BR")}</td></tr>)}</tbody></table>{!filtered.length && <div className="py-14 text-center"><UsersRound className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Nenhum cliente encontrado.</p></div>}</div>
      </section>
    </div>
    {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="font-[Sora] text-xl font-semibold">Adicionar cliente</h2><p className="mt-1 text-sm text-slate-500">Cadastre os dados básicos para usar na agenda.</p></div><button onClick={() => setShowModal(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><form onSubmit={createClient} className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold">Nome</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">Telefone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label><label><span className="mb-2 block text-sm font-semibold">E-mail</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label></div><label className="block"><span className="mb-2 block text-sm font-semibold">Observações</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label>{error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<button disabled={saving} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white"><UserPlus className="h-4 w-4" />{saving ? "Salvando..." : "Cadastrar cliente"}</button></form></div></div>}
  </main>;
}
