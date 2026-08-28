import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bot, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha | RecepIA" }] }),
  component: RecoverPasswordPage,
});

function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/nova-senha`,
    });
    if (resetError) setError("Não foi possível enviar o e-mail de recuperação agora."); else setSent(true);
    setLoading(false);
  }

  return <main className="min-h-screen bg-[#f7f9f8] px-5 py-10 text-slate-900"><div className="mx-auto flex min-h-[85vh] max-w-md items-center"><section className="w-full rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50"><Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft className="h-4 w-4"/>Voltar ao login</Link><div className="mt-7 flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5"/></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></div>{sent ? <div className="py-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500"/><h1 className="mt-5 font-[Sora] text-2xl font-bold">Confira seu e-mail.</h1><p className="mt-3 text-sm leading-6 text-slate-600">Se existir uma conta para <strong>{email}</strong>, você receberá um link para definir uma nova senha.</p></div> : <><h1 className="mt-7 font-[Sora] text-3xl font-bold">Recupere sua senha.</h1><p className="mt-2 text-sm leading-6 text-slate-600">Informe o e-mail da sua conta e enviaremos um link seguro para redefinição.</p><form onSubmit={submit} className="mt-6"><label><span className="mb-2 block text-sm font-semibold">E-mail</span><div className="relative"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input required type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-emerald-500" placeholder="voce@empresa.com"/></div></label>{error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin"/>}Enviar link de recuperação</button></form></>}</section></div></main>;
}
