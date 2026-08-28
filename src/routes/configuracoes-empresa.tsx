import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bot, Building2, Check, Clipboard, ExternalLink, Globe2, MapPin, Phone, Save, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/configuracoes-empresa")({
  head: () => ({ meta: [{ title: "Empresa e instalação | RecepIA" }] }),
  component: CompanySettingsPage,
});

type Segment = "clinica" | "consultorio" | "barbearia" | "otica" | "outro";
type CompanyForm = {
  name: string;
  slug: string;
  segment: Segment;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  description: string;
  policies: string;
};

const initialForm: CompanyForm = { name: "", slug: "", segment: "outro", phone: "", email: "", address: "", city: "", state: "", description: "", policies: "" };

function CompanySettingsPage() {
  const navigate = useNavigate();
  const { user, organizationId, loading } = useAuth();
  const [form, setForm] = useState<CompanyForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"link" | "embed" | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => { if (typeof window !== "undefined") setOrigin(window.location.origin); }, []);
  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login" });
    if (!organizationId) return void navigate({ to: "/onboarding" });
    void loadCompany();
  }, [loading, user, organizationId]);

  async function loadCompany() {
    if (!organizationId) return;
    const { data, error: loadError } = await supabase.from("organizations").select("name,slug,segment,phone,email,address,city,state,description,policies").eq("id", organizationId).single();
    if (loadError || !data) return setError("Não foi possível carregar os dados da empresa.");
    setForm({
      name: data.name ?? "",
      slug: data.slug ?? "",
      segment: (data.segment ?? "outro") as Segment,
      phone: data.phone ?? "",
      email: data.email ?? "",
      address: data.address ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      description: data.description ?? "",
      policies: data.policies ?? "",
    });
  }

  function normalizeSlug(value: string) {
    return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!organizationId) return;
    const slug = normalizeSlug(form.slug || form.name);
    if (!slug) return setError("Defina um endereço público válido para a empresa.");
    setSaving(true); setError(""); setSaved(false);
    const { error: updateError } = await supabase.from("organizations").update({
      name: form.name.trim(), slug, segment: form.segment, phone: form.phone.trim() || null, email: form.email.trim() || null,
      address: form.address.trim() || null, city: form.city.trim() || null, state: form.state.trim() || null,
      description: form.description.trim() || null, policies: form.policies.trim() || null,
    }).eq("id", organizationId);
    if (updateError) setError(updateError.code === "23505" ? "Este endereço público já está sendo usado por outra empresa." : "Não foi possível salvar as configurações.");
    else { setForm((current) => ({ ...current, slug })); setSaved(true); }
    setSaving(false);
  }

  const publicUrl = origin && form.slug ? `${origin}/chat/${form.slug}` : "";
  const embedCode = useMemo(() => publicUrl ? `<iframe\n  src="${publicUrl}"\n  title="Atendimento ${form.name || "RecepIA"}"\n  style="position:fixed;right:20px;bottom:20px;width:390px;height:680px;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);border:0;border-radius:28px;box-shadow:0 24px 70px rgba(15,23,42,.22);z-index:999999;background:white;"\n  allow="clipboard-write"\n></iframe>` : "", [publicUrl, form.name]);

  async function copy(value: string, type: "link" | "embed") {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1800);
  }

  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/dashboard" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></Link><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4"/>Voltar ao painel</Link></div></header>
    <div className="mx-auto max-w-7xl p-5 sm:p-8"><div><p className="text-sm font-semibold text-emerald-600">Configurações</p><h1 className="mt-1 font-[Sora] text-3xl font-bold">Empresa e instalação.</h1><p className="mt-2 text-sm text-slate-500">Mantenha as informações que a IA utiliza e publique seu canal de atendimento.</p></div>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <form onSubmit={save} className="rounded-3xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Building2 className="h-5 w-5"/></span><div><h2 className="font-[Sora] text-lg font-semibold">Dados da empresa</h2><p className="text-sm text-slate-500">Essas informações fazem parte do contexto da recepcionista.</p></div></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Nome" value={form.name} onChange={(value) => setForm({ ...form, name: value })}/><label><span className="mb-2 block text-sm font-semibold">Segmento</span><select value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value as Segment })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="clinica">Clínica</option><option value="consultorio">Consultório</option><option value="barbearia">Barbearia</option><option value="otica">Ótica</option><option value="outro">Outro</option></select></label><Field label="Telefone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })}/><Field label="E-mail" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })}/><Field label="Endereço" value={form.address} onChange={(value) => setForm({ ...form, address: value })}/><Field label="Cidade" value={form.city} onChange={(value) => setForm({ ...form, city: value })}/><Field label="Estado" value={form.state} onChange={(value) => setForm({ ...form, state: value })}/><label><span className="mb-2 block text-sm font-semibold">Endereço público</span><div className="flex h-11 items-center rounded-xl border border-slate-200 px-3"><span className="text-sm text-slate-400">/chat/</span><input value={form.slug} onChange={(e) => setForm({ ...form, slug: normalizeSlug(e.target.value) })} className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></div></label>
            <label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">Descrição</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500" placeholder="Explique brevemente o que a empresa faz."/></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">Políticas e orientações</span><textarea value={form.policies} onChange={(e) => setForm({ ...form, policies: e.target.value })} className="min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500" placeholder="Ex.: tolerância de atraso, política de cancelamento, formas de pagamento..."/></label>
          </div>{error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{saved && <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><Check className="h-4 w-4"/>Configurações salvas.</p>}<button disabled={saving} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4"/>{saving ? "Salvando..." : "Salvar alterações"}</button>
        </form>
        <div className="space-y-6"><section className="rounded-3xl border border-slate-200 bg-white p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Globe2 className="h-5 w-5"/></div><h2 className="mt-5 font-[Sora] text-lg font-semibold">Link público do atendimento</h2><p className="mt-2 text-sm leading-6 text-slate-500">Compartilhe este endereço com clientes ou use-o em botões do seu site e redes sociais.</p><div className="mt-4 flex gap-2"><input readOnly value={publicUrl} className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"/><button type="button" onClick={() => copy(publicUrl, "link")} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200"><Clipboard className="h-4 w-4"/></button></div><div className="mt-3 flex gap-2">{publicUrl && <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">Abrir atendimento<ExternalLink className="h-4 w-4"/></a>}{copied === "link" && <span className="text-sm font-semibold text-emerald-600">Copiado!</span>}</div></section>
          <section className="rounded-3xl bg-slate-950 p-6 text-white"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-400"/><h2 className="font-[Sora] text-lg font-semibold">Instalar no seu site</h2></div><p className="mt-3 text-sm leading-6 text-slate-400">Cole este HTML antes de <code className="text-slate-300">&lt;/body&gt;</code>. O iframe mantém a RecepIA isolada do código do seu site.</p><pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-xs leading-5 text-slate-300">{embedCode || "Salve um endereço público para gerar o código."}</pre><button type="button" disabled={!embedCode} onClick={() => copy(embedCode, "embed")} className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white disabled:opacity-40"><Clipboard className="h-4 w-4"/>{copied === "embed" ? "Código copiado" : "Copiar código de instalação"}</button></section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5"><div className="grid gap-3 text-sm text-slate-600"><p className="flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-500"/>O telefone informado pelo visitante acompanha a conversa.</p><p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-500"/>Endereço e cidade podem ser usados pela IA ao responder dúvidas.</p><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500"/>O visitante não recebe acesso ao painel administrativo.</p></div></section></div>
      </div>
    </div>
  </main>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label><span className="mb-2 block text-sm font-semibold">{label}</span><input required={label === "Nome"} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"/></label>; }
