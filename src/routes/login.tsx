import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bot, Eye, EyeOff, Loader2, LockKeyhole, Mail, MonitorPlay } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar | RecepIA" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { refreshMembership } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (signInError || !data.user) {
      setError("Não foi possível entrar. Confira seu e-mail e sua senha. Para o acesso de demonstração, use o botão ‘Entrar na demonstração’ abaixo.");
      setLoading(false);
      return;
    }

    const { data: memberships } = await supabase.from("organization_members").select("organization_id").eq("user_id", data.user.id).limit(1);
    if (!memberships?.length) {
      const { error: bootstrapError } = await supabase.rpc("bootstrap_organization_from_metadata");
      if (bootstrapError) {
        setError("Seu login funcionou, mas não conseguimos preparar a empresa desta conta. Entre em contato com o suporte.");
        setLoading(false);
        return;
      }
    }

    await refreshMembership();
    const { data: membership } = await supabase.from("organization_members").select("organization_id").eq("user_id", data.user.id).order("created_at").limit(1).maybeSingle();
    setLoading(false);
    navigate({ to: membership?.organization_id ? "/dashboard" : "/onboarding" });
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span>
            <span className="font-[Sora] text-xl font-bold text-slate-950">Recep<span className="text-emerald-500">IA</span></span>
          </Link>

          <h1 className="font-[Sora] text-3xl font-bold tracking-tight text-slate-950">Bem-vindo de volta.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Entre para acompanhar sua agenda, conversas, clientes e o trabalho da sua recepcionista IA.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">E-mail</span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
              </div>
            </label>

            <label className="block">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Senha</span>
                <Link to="/recuperar-senha" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Esqueci minha senha</Link>
              </div>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input required minLength={8} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label="Mostrar ou ocultar senha">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </label>

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</div>}

            <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </button>
          </form>

          <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200"/><span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">ou</span><span className="h-px flex-1 bg-slate-200"/></div>

          <Link to="/demo" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"><MonitorPlay className="h-4 w-4"/>Entrar na demonstração</Link>
          <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500"><strong className="text-slate-700">Credenciais da demo:</strong><br/>demo@recepia.app<br/>RecepIA2026!</div>

          <p className="mt-7 text-center text-sm text-slate-500">Ainda não tem uma conta? <Link to="/cadastro" className="font-bold text-emerald-600 hover:text-emerald-700">Começar gratuitamente</Link></p>
        </div>
      </section>

      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-emerald-300">Recepção inteligente, todos os dias</div>
          <h2 className="mt-7 max-w-xl font-[Sora] text-4xl font-bold leading-tight">Enquanto sua equipe trabalha, a RecepIA organiza o atendimento.</h2>
          <p className="mt-5 max-w-lg leading-7 text-slate-400">Centralize conversas, consulte a agenda em tempo real e acompanhe cada novo cliente em um único painel.</p>
        </div>
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
          <p className="text-sm text-slate-300">“Tenho horários disponíveis amanhã às 09:00, 10:30 e 14:00. Qual você prefere?”</p>
          <div className="mt-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500"><Bot className="h-5 w-5" /></span><div><p className="text-sm font-semibold">Júlia • RecepIA</p><p className="text-xs text-emerald-400">Atendendo agora</p></div></div>
        </div>
      </section>
    </main>
  );
}
