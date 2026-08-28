import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bot, CheckCircle2, Plus, Save, Search, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/configuracao-ia")({
  head: () => ({ meta: [{ title: "Configuração da IA | RecepIA" }] }),
  component: AiSettingsPage,
});

type AiSettings = {
  assistant_name: string;
  tone: string;
  greeting: string;
  custom_rules: string;
  is_enabled: boolean;
};

type Faq = { id: string; question: string; answer: string; created_at: string };

const initialSettings: AiSettings = {
  assistant_name: "Júlia",
  tone: "amigavel",
  greeting: "Olá! Sou a recepcionista virtual. Como posso ajudar?",
  custom_rules: "",
  is_enabled: true,
};

function AiSettingsPage() {
  const navigate = useNavigate();
  const { user, organizationId, loading } = useAuth();
  const [settings, setSettings] = useState<AiSettings>(initialSettings);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "" });
  const [savingFaq, setSavingFaq] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login" });
    if (!organizationId) return void navigate({ to: "/onboarding" });
    void loadData();
  }, [loading, user, organizationId]);

  async function loadData() {
    if (!organizationId) return;
    const [settingsRes, faqRes] = await Promise.all([
      supabase.from("ai_settings").select("assistant_name,tone,greeting,custom_rules,is_enabled").eq("organization_id", organizationId).maybeSingle(),
      supabase.from("faqs").select("id,question,answer,created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    ]);
    if (settingsRes.data) {
      setSettings({
        assistant_name: settingsRes.data.assistant_name,
        tone: settingsRes.data.tone,
        greeting: settingsRes.data.greeting,
        custom_rules: settingsRes.data.custom_rules ?? "",
        is_enabled: settingsRes.data.is_enabled,
      });
    }
    setFaqs(faqRes.data ?? []);
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    if (!organizationId) return;
    setSaving(true); setSaved(false); setError("");
    const { error: saveError } = await supabase.from("ai_settings").upsert({ organization_id: organizationId, ...settings }, { onConflict: "organization_id" });
    if (saveError) { setError("Não foi possível salvar as configurações da IA."); setSaving(false); return; }
    setSaving(false); setSaved(true); window.setTimeout(() => setSaved(false), 2500);
  }

  async function createFaq(event: React.FormEvent) {
    event.preventDefault(); if (!organizationId) return;
    setSavingFaq(true); setError("");
    const { error: insertError } = await supabase.from("faqs").insert({ organization_id: organizationId, question: faqForm.question.trim(), answer: faqForm.answer.trim() });
    if (insertError) { setError("Não foi possível adicionar esta pergunta frequente."); setSavingFaq(false); return; }
    setFaqForm({ question: "", answer: "" }); setShowFaqModal(false); setSavingFaq(false); await loadData();
  }

  async function deleteFaq(id: string) {
    const confirmed = window.confirm("Excluir esta pergunta frequente?");
    if (!confirmed) return;
    await supabase.from("faqs").delete().eq("id", id);
    await loadData();
  }

  const filteredFaqs = useMemo(() => faqs.filter((item) => `${item.question} ${item.answer}`.toLowerCase().includes(search.toLowerCase())), [faqs, search]);

  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/dashboard" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></Link><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Voltar ao painel</Link></div></header>

    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <div><p className="text-sm font-semibold text-emerald-600">Inteligência Artificial</p><h1 className="mt-1 font-[Sora] text-3xl font-bold">Configure sua recepcionista.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Defina como a IA deve se apresentar, conversar e quais regras precisa respeitar durante o atendimento.</p></div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <form onSubmit={saveSettings} className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4"><div><h2 className="font-[Sora] text-lg font-semibold">Comportamento da IA</h2><p className="mt-1 text-sm text-slate-500">Configurações usadas em todos os atendimentos automáticos.</p></div><button type="button" onClick={() => setSettings({ ...settings, is_enabled: !settings.is_enabled })} className={`relative h-7 w-12 rounded-full transition ${settings.is_enabled ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${settings.is_enabled ? "left-6" : "left-1"}`} /></button></div>
          <div className={`mt-4 rounded-2xl border p-4 text-sm ${settings.is_enabled ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}><div className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4" />{settings.is_enabled ? "IA ativa para novos atendimentos" : "IA temporariamente desativada"}</div></div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label><span className="mb-2 block text-sm font-semibold">Nome da recepcionista</span><input required value={settings.assistant_name} onChange={(e) => setSettings({ ...settings, assistant_name: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></label>
            <label><span className="mb-2 block text-sm font-semibold">Tom de voz</span><select value={settings.tone} onChange={(e) => setSettings({ ...settings, tone: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"><option value="profissional">Profissional</option><option value="amigavel">Amigável</option><option value="elegante">Elegante</option><option value="casual">Casual</option></select></label>
            <label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">Mensagem de saudação</span><textarea required value={settings.greeting} onChange={(e) => setSettings({ ...settings, greeting: e.target.value })} className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500" /></label>
            <label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">Regras personalizadas</span><textarea value={settings.custom_rules} onChange={(e) => setSettings({ ...settings, custom_rules: e.target.value })} placeholder="Ex.: Nunca informar horários sem consultar a agenda. Não conceder descontos sem autorização. Encaminhar situações urgentes para uma pessoa." className="min-h-36 w-full rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-emerald-500" /><p className="mt-2 text-xs text-slate-400">Essas regras complementam as informações da empresa, serviços, agenda e FAQ.</p></label>
          </div>
          {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <button disabled={saving} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white"><Save className="h-4 w-4" />{saving ? "Salvando..." : saved ? "Configurações salvas" : "Salvar configurações"}{saved && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}</button>
        </form>

        <section className="rounded-3xl bg-slate-950 p-6 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500"><Bot className="h-6 w-6" /></div><p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-emerald-400">Prévia</p><h2 className="mt-2 font-[Sora] text-2xl font-semibold">{settings.assistant_name}</h2><p className="mt-2 text-sm capitalize text-slate-400">Tom {settings.tone}</p><div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4"><p className="text-sm leading-6 text-slate-200">{settings.greeting || "Sua mensagem de saudação aparecerá aqui."}</p></div><div className="mt-6 rounded-2xl border border-white/10 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Regra de segurança</p><p className="mt-2 text-sm leading-6 text-slate-300">Quando a informação não estiver disponível no contexto da empresa, a IA deverá evitar inventar respostas e encaminhar o atendimento quando necessário.</p></div>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-[Sora] text-lg font-semibold">Base de conhecimento — FAQ</h2><p className="mt-1 text-sm text-slate-500">Cadastre respostas oficiais que a recepcionista poderá usar durante as conversas.</p></div><button onClick={() => setShowFaqModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600"><Plus className="h-4 w-4" />Adicionar pergunta</button></div>
        <div className="relative mt-5"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar na base de conhecimento" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-emerald-500" /></div>
        <div className="mt-5 space-y-3">{filteredFaqs.length ? filteredFaqs.map((faq) => <article key={faq.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-semibold text-slate-900">{faq.question}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{faq.answer}</p></div><button onClick={() => deleteFaq(faq.id)} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Excluir FAQ"><Trash2 className="h-4 w-4" /></button></div></article>) : <div className="py-12 text-center"><Sparkles className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Nenhuma pergunta cadastrada.</p><p className="mt-1 text-xs text-slate-400">Adicione informações como políticas, formas de pagamento e dúvidas frequentes.</p></div>}</div>
      </section>
    </div>

    {showFaqModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="font-[Sora] text-xl font-semibold">Nova pergunta frequente</h2><p className="mt-1 text-sm text-slate-500">Use somente informações oficiais da empresa.</p></div><button onClick={() => setShowFaqModal(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><form onSubmit={createFaq} className="mt-6 space-y-4"><label><span className="mb-2 block text-sm font-semibold">Pergunta</span><input required value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} placeholder="Ex.: Vocês atendem aos sábados?" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></label><label><span className="mb-2 block text-sm font-semibold">Resposta oficial</span><textarea required value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} placeholder="Digite a resposta que a IA poderá utilizar." className="min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500" /></label><button disabled={savingFaq} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white"><Save className="h-4 w-4" />{savingFaq ? "Salvando..." : "Salvar na base de conhecimento"}</button></form></div></div>}
  </main>;
}
