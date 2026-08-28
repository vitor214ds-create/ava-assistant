import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bot, ShieldCheck } from "lucide-react";
import { PublicChatWidget } from "@/components/PublicChatWidget";

export const Route = createFileRoute("/chat/$slug")({
  head: () => ({ meta: [{ title: "Atendimento online | RecepIA" }] }),
  component: PublicChatPage,
});

function PublicChatPage() {
  const { slug } = Route.useParams();
  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 sm:px-8"><Link to="/" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></Link><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Voltar</Link></div></header>
    <div className="mx-auto grid max-w-6xl gap-8 p-5 sm:p-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
      <section><p className="text-sm font-semibold text-emerald-600">Atendimento online</p><h1 className="mt-2 font-[Sora] text-4xl font-bold tracking-tight text-slate-950">Fale com a recepcionista virtual.</h1><p className="mt-4 max-w-lg text-base leading-7 text-slate-600">Tire dúvidas, consulte horários disponíveis e gerencie seus agendamentos diretamente pela conversa.</p><div className="mt-7 flex max-w-lg items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /><p className="text-sm leading-6 text-slate-500">A conversa usa um token público aleatório para continuar sua sessão sem expor dados internos da empresa.</p></div></section>
      <section className="min-h-[620px]"><PublicChatWidget organizationSlug={slug} embedded /></section>
    </div>
  </main>;
}
