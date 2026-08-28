import { Bot, MessageCircleMore, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type PublicChatMessage = { id: string; role: "client" | "ai" | "agent" | "system"; content: string };

export function PublicChatWidget({ organizationSlug, embedded = false }: { organizationSlug: string; embedded?: boolean }) {
  const storageKey = useMemo(() => `recepia-chat:${organizationSlug}`, [organizationSlug]);
  const [open, setOpen] = useState(embedded);
  const [messages, setMessages] = useState<PublicChatMessage[]>([]);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [humanMode, setHumanMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const handoff = params.get("handoff");
      const handoffName = params.get("name");
      const handoffPhone = params.get("phone");
      if (handoff) {
        setPublicToken(handoff);
        setName(handoffName ?? "");
        setPhone(handoffPhone ?? "");
        setMessages([]);
        localStorage.setItem(storageKey, JSON.stringify({ publicToken: handoff, name: handoffName ?? "", phone: handoffPhone ?? "", messages: [] }));
        return;
      }
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      setPublicToken(saved.publicToken ?? null);
      setName(saved.name ?? "");
      setPhone(saved.phone ?? "");
      setMessages(Array.isArray(saved.messages) ? saved.messages : []);
    } catch { /* ignore corrupt state */ }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ publicToken, name, phone, messages }));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [storageKey, publicToken, name, phone, messages]);

  useEffect(() => {
    if (!publicToken) return;
    let cancelled = false;

    async function syncConversation() {
      if (document.visibilityState === "hidden") return;
      const projectUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
      if (!projectUrl || !anonKey) return;
      try {
        const response = await fetch(`${projectUrl}/functions/v1/conversation-feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: anonKey },
          body: JSON.stringify({ publicToken }),
        });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        if (Array.isArray(data.messages)) {
          setMessages(data.messages.map((item: any) => ({ id: String(item.id), role: item.role, content: String(item.content ?? "") })));
        }
        setHumanMode(data.status === "humano");
        if (data.contactName && !name) setName(data.contactName);
        if (data.contactPhone && !phone) setPhone(data.contactPhone);
      } catch { /* polling failures are non-fatal */ }
    }

    void syncConversation();
    const interval = window.setInterval(() => void syncConversation(), 4000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [publicToken]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    const localClientMessage: PublicChatMessage = { id: crypto.randomUUID(), role: "client", content };
    setMessages((items) => [...items, localClientMessage]);
    setText(""); setSending(true);

    try {
      const projectUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
      if (!projectUrl || !anonKey) throw new Error("Supabase não configurado");
      const response = await fetch(`${projectUrl}/functions/v1/site-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey },
        body: JSON.stringify({ organizationSlug, publicToken, message: content, name: name.trim() || undefined, phone: phone.trim() || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha no atendimento");
      if (data.publicToken) setPublicToken(data.publicToken);
      if (data.status === "humano") {
        setHumanMode(true);
      } else if (data.message?.content) {
        setHumanMode(false);
        setMessages((items) => [...items, { id: data.message.id ?? crypto.randomUUID(), role: "ai", content: data.message.content }]);
      } else if (data.status === "ia_desativada") {
        setMessages((items) => [...items, { id: crypto.randomUUID(), role: "system", content: "O atendimento automático está indisponível no momento. Sua mensagem ficou registrada." }]);
      }
    } catch (error) {
      setMessages((items) => [...items, { id: crypto.randomUUID(), role: "system", content: error instanceof Error ? error.message : "Não foi possível enviar sua mensagem agora." }]);
    } finally { setSending(false); }
  }

  function resetConversation() {
    setPublicToken(null); setMessages([]); setHumanMode(false); setName(""); setPhone("");
    localStorage.removeItem(storageKey);
    if (typeof window !== "undefined") window.history.replaceState({}, "", window.location.pathname);
  }

  const panel = <div className={`${embedded ? "h-full min-h-[620px]" : "h-[620px] w-[min(390px,calc(100vw-24px))] shadow-2xl"} flex flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white`}>
    <div className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500"><Bot className="h-5 w-5" /></span><div><p className="font-semibold">RecepIA</p><p className="text-xs text-slate-400">{humanMode ? "Atendimento humano online" : "Assistente virtual online"}</p></div></div>{!embedded && <button onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>}</div>
    <div className="border-b border-slate-100 p-4"><div className="grid grid-cols-2 gap-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></div></div>
    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#f7f9f8] p-4">{messages.length === 0 && <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm">Olá! 👋 Sou a recepcionista virtual. Posso tirar dúvidas, consultar horários e fazer seu agendamento.</div>}{messages.map((message) => <div key={message.id} className={`flex ${message.role === "client" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "client" ? "rounded-br-md bg-slate-950 text-white" : message.role === "ai" ? "rounded-bl-md bg-white text-slate-700 shadow-sm" : message.role === "agent" ? "rounded-bl-md bg-emerald-600 text-white shadow-sm" : "border border-amber-200 bg-amber-50 text-amber-800"}`}>{message.content}</div></div>)}{sending && !humanMode && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-slate-400 shadow-sm">Digitando...</div></div>}</div>
    <form onSubmit={sendMessage} className="border-t border-slate-100 bg-white p-4"><div className="flex gap-2"><input value={text} onChange={(e) => setText(e.target.value)} placeholder={humanMode ? "Digite sua mensagem para o atendente..." : "Digite sua mensagem..."} className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-500" /><button disabled={sending || !text.trim()} className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white disabled:opacity-40"><Send className="h-4 w-4" /></button></div>{publicToken && <button type="button" onClick={resetConversation} className="mt-2 text-xs font-semibold text-slate-400 hover:text-slate-700">Iniciar nova conversa</button>}</form>
  </div>;

  if (embedded) return panel;
  return <>{open && <div className="fixed bottom-24 right-4 z-[80] sm:right-6">{panel}</div>}<button onClick={() => setOpen((value) => !value)} className="fixed bottom-5 right-4 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/25 sm:right-6" aria-label="Abrir atendimento">{open ? <X className="h-5 w-5" /> : <MessageCircleMore className="h-6 w-6" />}</button></>;
}
