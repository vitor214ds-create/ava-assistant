import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bot, Building2, Eye, EyeOff, Loader2, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta | RecepIA" }] }),
  component: SignupPage,
});

const segments = [
  { value: "clinica", label: "Clínica" },
  { value: "consultorio", label: "Consultório" },
  { value: "barbearia", label: "Barbearia" },
  { value: "otica", label: "Ótica" },
  { value: "outro", label: "Outro" },
] as const;

const fieldInputClass = "h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", companyName: "", email: "", phone: "", password: "", segment: "outro" });

  const setField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName, phone: form.phone } },
    });

    if (signupError || !data.user) {
      setError(signupError?.message === "User already registered" ? "Este e-mail já está cadastrado." : "Não foi possível criar sua conta. Tente novamente.");
      setLoading(false);
      return;
    }

    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .insert({ name: form.companyName, segment: form.segment as "clinica" | "consultorio" | "barbearia" | "otica" | "outro", phone: form.phone, email: form.email })
      .select("id")
      .single();

    if (organizationError || !organization) {
      setError("Sua conta foi criada, mas não conseguimos configurar a empresa. Entre novamente para continuar.");
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase.from("organization_members").insert({ organization_id: organization.id, user_id: data.user.id, role: "owner" });
    if (memberError) {
      setError("Sua empresa foi criada, mas houve um problema ao finalizar as permissões da conta.");
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate({ to: "/onboarding" });
  }

  return (
    <main className="min-h-screen bg-[#f8faf9] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold text-slate-950">Recep<span className="text-emerald-500">IA</span></span></Link>
          <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-950">Já tenho uma conta</Link>
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">14 dias para testar</div>
            <h1 className="font-[Sora] text-3xl font-bold tracking-tight text-slate-950">Crie sua conta na RecepIA.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Cadastre seu negócio e depois configure serviços, horários e a personalidade da sua recepcionista.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
            <Field label="Seu nome" icon={UserRound}><input required value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} placeholder="José Vitor" className={fieldInputClass} /></Field>
            <Field label="Nome da empresa" icon={Building2}><input required value={form.companyName} onChange={(e) => setField("companyName", e.target.value)} placeholder="Clínica Exemplo" className={fieldInputClass} /></Field>
            <Field label="E-mail" icon={Mail}><input required type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="voce@empresa.com" className={fieldInputClass} /></Field>
            <Field label="Telefone" icon={Phone}><input required value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="(27) 99999-9999" className={fieldInputClass} /></Field>

            <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-700">Segmento</span><select value={form.segment} onChange={(e) => setField("segment", e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10">{segments.map((segment) => <option key={segment.value} value={segment.value}>{segment.label}</option>)}</select></label>

            <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-700">Senha</span><div className="relative"><LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required minLength={6} type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setField("password", e.target.value)} placeholder="Mínimo de 6 caracteres" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>

            {error && <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <button disabled={loading} className="sm:col-span-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Criar minha conta</button>
          </form>

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">Ao continuar, você concorda com os Termos de Uso e com a Política de Privacidade da RecepIA.</p>
        </section>
      </div>
    </main>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof UserRound; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><div className="relative"><Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />{children}</div></label>;
}
