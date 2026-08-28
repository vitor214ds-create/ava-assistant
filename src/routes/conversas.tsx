import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bot, MessageCircleMore, ArrowLeft, UserRound, Phone, Hand, Sparkles, Send, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/conversas")({
  head: () => ({ meta: [{ title: "Conversas | RecepIA" }] }),
  component: ConversationsPage,
});

type Conversation = { id: string; status: "ia" | "humano" | "encerrada"; channel: string; contact_name: string | null; contact_phone: string | null; last_message_at: string; clients: { name: string; phone: string | null } | null };
type Message = { id: string; role: "client" | "ai" | "agent" | "system"; content: string; created_at: string };

function ConversationsPage() {
  const navigate = useNavigate();
  const { user, organizationId, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login" });
    if (!organizationId) return void navigate({ to: "/onboarding" });
    void loadConversations();
  }, [loading, user, organizationId]);

  useEffect(() => { if (selected) void loadMessages(selected.id); }, [selected?.id]);

  async function loadConversations() {
    if (!organizationId) return;
    const { data } = await supabase.from("conversations").select("id,status,channel,contact_name,contact_phone,last_message_at,clients(name,phone)").eq("organization_id", organizationId).order("last_message_at", { ascending: false });
    const rows = (data ?? []) as Conversation[];
    setConversations(rows);
    if (!selected && rows[0]) setSelected(rows[0]);
  }

  async function loadMessages(conversationId: string) {
    const { data } = await supabase.from("messages").select("id,role,content,created_at").eq("conversation_id", conversationId).order("created_at");
    setMessages((data ?? []) as Message[]);
  }

  async function setStatus(status: "ia" | "humano") {
    if (!selected) return;
    await supabase.from("conversations").update({ status, handled_by: status === "humano" ? user?.id ?? null : null }).eq("id", selected.id);
    const updated = { ...selected, status };
    setSelected(updated);
    setConversations((items) => items.map((item) => item.id === selected.id ? updated : item));
    setAiError("");
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !organizationId || !text.trim() || selected.status !== "humano") return;
    setSending(true);
    const content = text.trim();
    const { error } = await supabase.from("messages").insert({ organization_id: organizationId, conversation_id: selected.id, role: "agent", content });
    if (!error) {
      await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", selected.id);
      setText("");
      await loadMessages(selected.id);
      await loadConversations();
    }
    setSending(false);
  }

  async function generateAiReply() {
    if (!selected || selected.status !== "ia") return;
    setGenerating(true); setAiError("");
    const { data, error } = await supabase.functions.invoke("recepia-ai", { body: { conversationId: selected.id } });
    if (error) {
      setAiError("Não foi possível gerar a resposta. Verifique se a Edge Function está publicada e se a chave da IA foi configurada no Supabase.");
      setGenerating(false);
      return;
    }
    if (data?.error) {
      setAiError(data.error);
      setGenerating(false);
      return;
    }
    await loadMessages(selected.id);
    await loadConversations();
    setGenerating(false);
  }

  const canGenerate = selected?.status === "ia" && messages[messages.length - 1]?.role === "client";

  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/dashboard" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></Link><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4"/>Voltar ao painel</Link></div></header>
    <div className="mx-auto max-w-7xl p-5 sm:p-8"><div><p className="text-sm font-semibold text-emerald-600">Conversas</p><h1 className="mt-1 font-[Sora] text-3xl font-bold">Central de atendimento.</h1><p className="mt-2 text-sm text-slate-500">Acompanhe o que a IA está atendendo e assuma uma conversa quando precisar.</p></div>
      <section className="mt-7 grid min-h-[650px] overflow-hidden rounded-3xl border border-slate-200 bg-white lg:grid-cols-[300px_1fr_280px]">
        <div className="border-r border-slate-100"><div className="border-b border-slate-100 p-4 text-sm font-semibold">Conversas recentes</div><div className="max-h-[600px] overflow-auto">{conversations.length ? conversations.map((item) => <button key={item.id} onClick={() => { setSelected(item); setAiError(""); }} className={`w-full border-b border-slate-100 p-4 text-left transition ${selected?.id === item.id ? "bg-emerald-50" : "hover:bg-slate-50"}`}><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold">{item.clients?.name ?? item.contact_name ?? "Cliente"}</p><span className={`h-2.5 w-2.5 rounded-full ${item.status === "ia" ? "bg-emerald-500" : item.status === "humano" ? "bg-amber-500" : "bg-slate-300"}`}/></div><p className="mt-1 truncate text-xs text-slate-500">{item.contact_phone ?? item.clients?.phone ?? item.channel}</p></button>) : <div className="p-8 text-center"><MessageCircleMore className="mx-auto h-8 w-8 text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-500">Nenhuma conversa ainda</p></div>}</div></div>
        <div className="flex min-h-[650px] flex-col">{selected ? <><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="font-semibold">{selected.clients?.name ?? selected.contact_name ?? "Cliente"}</p><p className="text-xs text-slate-500">Canal: {selected.channel}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${selected.status === "ia" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{selected.status === "ia" ? "IA atendendo" : "Atendimento humano"}</span></div><div className="flex-1 space-y-3 overflow-auto bg-slate-50 p-5">{messages.map((message) => <div key={message.id} className={`flex ${message.role === "client" ? "justify-start" : "justify-end"}`}><div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "client" ? "border border-slate-200 bg-white text-slate-700" : message.role === "ai" ? "bg-emerald-500 text-white" : "bg-slate-950 text-white"}`}><p>{message.content}</p><p className={`mt-1 text-[10px] ${message.role === "client" ? "text-slate-400" : "text-white/60"}`}>{new Date(message.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p></div></div>)}</div>{aiError && <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">{aiError}</div>}<form onSubmit={sendMessage} className="border-t border-slate-100 p-4"><div className="flex gap-2"><input disabled={selected.status !== "humano"} value={text} onChange={(e) => setText(e.target.value)} placeholder={selected.status === "humano" ? "Digite sua mensagem..." : "A IA está responsável por esta conversa"} className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none disabled:bg-slate-50"/><button disabled={sending || selected.status !== "humano" || !text.trim()} className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white disabled:opacity-40"><Send className="h-4 w-4"/></button></div></form></> : <div className="flex flex-1 items-center justify-center text-sm text-slate-400">Selecione uma conversa</div>}</div>
        <aside className="border-l border-slate-100 p-5">{selected && <><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"><UserRound className="h-5 w-5"/></div><h2 className="mt-4 font-semibold">{selected.clients?.name ?? selected.contact_name ?? "Cliente"}</h2><div className="mt-4 space-y-3 text-sm text-slate-500"><p className="flex items-center gap-2"><Phone className="h-4 w-4"/>{selected.contact_phone ?? selected.clients?.phone ?? "Sem telefone"}</p><p className="flex items-center gap-2"><MessageCircleMore className="h-4 w-4"/>{selected.channel}</p></div><div className="my-6 h-px bg-slate-100"/>{selected.status === "ia" ? <><button onClick={generateAiReply} disabled={generating || !canGenerate} className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40">{generating ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}{generating ? "Gerando resposta..." : "Gerar resposta da IA"}</button><button onClick={() => setStatus("humano")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white hover:bg-amber-600"><Hand className="h-4 w-4"/>Assumir conversa</button></> : <button onClick={() => setStatus("ia")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600"><Sparkles className="h-4 w-4"/>Devolver para IA</button>}<p className="mt-3 text-xs leading-5 text-slate-400">A resposta automática só é gerada quando a última mensagem é do cliente. Quando o atendimento humano está ativo, a IA permanece pausada.</p></>}</aside>
      </section>
    </div>
  </main>;
}
