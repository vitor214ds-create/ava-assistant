import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bot, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/nova-senha")({
  head: () => ({ meta: [{ title: "Nova senha | RecepIA" }] }),
  component: NewPasswordPage,
});

function NewPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    if (password !== confirm) return setError("As senhas não coincidem.");
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError("Não foi possível atualizar a senha. Solicite um novo link de recuperação."); else setDone(true);
    setSaving(false);
  }

  if (done) return <main className="min-h-screen bg-[#f7f9f8] px-5 py-10"><div className="mx-auto flex min-h-[85vh] max-w-md items-center"><section className="w-full rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500"/><h1 className="mt-5 font-[Sora] text-2xl font-bold">Senha atualizada.</h1><p className="mt-3 text-sm text-slate-600">Sua nova senha já pode ser usada para entrar na RecepIA.</p><button onClick={()=>navigate({to:"/login"})} className="mt-7 h-11 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white">Ir para o login</button></section></div></main>;

  return <main className="min-h-screen bg-[#f7f9f8] px-5 py-10 text-slate-900"><div className="mx-auto flex min-h-[85vh] max-w-md items-center"><section className="w-full rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50"><div className="flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5"/></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></div><h1 className="mt-7 font-[Sora] text-3xl font-bold">Defina uma nova senha.</h1><p className="mt-2 text-sm leading-6 text-slate-600">Use uma senha forte com pelo menos 8 caracteres.</p>{!ready ? <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Este link de recuperação não está ativo. <Link to="/recuperar-senha" className="font-bold underline">Solicite um novo link.</Link></div> : <form onSubmit={submit} className="mt-6 space-y-4"><PasswordField label="Nova senha" value={password} onChange={setPassword} show={show}/><PasswordField label="Confirmar nova senha" value={confirm} onChange={setConfirm} show={show}/><button type="button" onClick={()=>setShow((v)=>!v)} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">{show?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}{show?"Ocultar senhas":"Mostrar senhas"}</button>{error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<button disabled={saving} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white disabled:opacity-50">{saving&&<Loader2 className="h-4 w-4 animate-spin"/>}Salvar nova senha</button></form>}</section></div></main>;
}

function PasswordField({label,value,onChange,show}:{label:string;value:string;onChange:(value:string)=>void;show:boolean}){return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span><div className="relative"><LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input required minLength={8} type={show?"text":"password"} value={value} onChange={(e)=>onChange(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-emerald-500"/></div></label>}
