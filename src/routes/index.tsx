import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, CalendarCheck2, Check, MessageCircleMore, ShieldCheck, Sparkles, Stethoscope, Store, UsersRound, WandSparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RecepIA — Sua recepcionista inteligente 24 horas por dia" },
      { name: "description", content: "Atenda clientes, responda dúvidas e transforme conversas em agendamentos automaticamente com a RecepIA." },
    ],
  }),
  component: Index,
});

const benefits = [
  [MessageCircleMore, "Atendimento 24 horas", "Responda clientes mesmo fora do horário comercial e reduza oportunidades perdidas."],
  [CalendarCheck2, "Agendamento automático", "A IA consulta a agenda, oferece horários livres e confirma o atendimento."],
  [UsersRound, "Tudo centralizado", "Clientes, conversas, profissionais, serviços e agenda em um único painel."],
  [ShieldCheck, "Feito para empresas", "Estrutura multiempresa com permissões e dados separados por negócio."],
] as const;

const segments = [
  [Stethoscope, "Clínicas"],
  [UsersRound, "Consultórios"],
  [Sparkles, "Barbearias"],
  [Store, "Óticas e outros negócios"],
] as const;

const plans = [
  ["Básico", "79,90", ["Agenda inteligente", "Clientes", "Serviços e profissionais", "Configuração da IA"]],
  ["Profissional", "129,90", ["Tudo do Básico", "Central de conversas", "Relatórios", "Mais limites"]],
  ["Premium", "199,90", ["Tudo do Profissional", "Limites ampliados", "Recursos avançados", "Prioridade em integrações"]],
] as const;

function Brand() {
  return <div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold text-slate-950">Recep<span className="text-emerald-500">IA</span></span></div>;
}

function Index() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfcfb] text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#inicio"><Brand /></a>
          <nav className="hidden gap-8 text-sm font-medium text-slate-600 lg:flex"><a href="#como-funciona">Como funciona</a><a href="#recursos">Recursos</a><a href="#segmentos">Segmentos</a><a href="#planos">Planos</a></nav>
          <div className="flex items-center gap-2"><Link to="/login" className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex">Entrar</Link><Link to="/cadastro" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Começar gratuitamente<ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </header>

      <section id="inicio" className="relative pt-32 lg:pt-40">
        <div className="absolute left-1/2 top-20 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-24 lg:grid-cols-[1.03fr_.97fr] lg:items-center lg:px-8 lg:pb-32">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700"><WandSparkles className="h-4 w-4" />Atendimento inteligente para o seu negócio</div>
            <h1 className="font-[Sora] text-5xl font-bold leading-[1.06] tracking-[-0.045em] text-slate-950 md:text-6xl lg:text-[68px]">Sua recepcionista inteligente. <span className="text-emerald-500">24 horas por dia.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">A IA atende seus clientes, responde dúvidas, encontra horários disponíveis e realiza agendamentos automaticamente.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/cadastro" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600">Começar gratuitamente<ArrowRight className="h-4 w-4" /></Link><a href="#demonstracao" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800">Ver como funciona</a></div>
            <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-600">{["Configuração simples", "Agenda integrada", "14 dias para testar"].map((item) => <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" />{item}</span>)}</div>
          </div>

          <div id="demonstracao" className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><div><p className="font-semibold">Júlia • RecepIA</p><p className="text-xs text-emerald-600">Online agora</p></div></div>
            <div className="space-y-4 bg-[#f7f9f8] p-6 text-sm leading-6"><div className="ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-slate-950 px-4 py-3 text-white">Oi, vocês atendem sábado?</div><div className="max-w-[84%] rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">Olá! Sim 😊 Nosso atendimento aos sábados funciona das 08:00 às 13:00. Gostaria de verificar os horários disponíveis?</div><div className="ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-slate-950 px-4 py-3 text-white">Sim.</div><div className="max-w-[84%] rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">Tenho estes horários disponíveis:<div className="mt-3 grid grid-cols-3 gap-2">{["09:00", "10:30", "11:30"].map((time) => <span key={time} className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-center font-semibold text-emerald-700">{time}</span>)}</div></div><div className="ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-slate-950 px-4 py-3 text-white">10:30.</div><div className="max-w-[84%] rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">Perfeito! Para confirmar seu agendamento, preciso do seu nome e telefone.</div></div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-slate-100 bg-white py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Como funciona</p><h2 className="mt-4 font-[Sora] text-3xl font-bold text-slate-950 md:text-4xl">Da primeira mensagem ao horário confirmado.</h2></div><div className="mt-12 grid gap-5 md:grid-cols-3">{[["01", "Configure sua empresa", "Cadastre serviços, profissionais, horários e a personalidade da sua recepcionista."], ["02", "A IA atende", "O cliente tira dúvidas e informa o que precisa sem depender de alguém disponível."], ["03", "A agenda é atualizada", "A IA consulta disponibilidade e transforma a conversa em agendamento."]].map(([number,title,text]) => <article key={number} className="rounded-3xl border border-slate-200 bg-[#fbfcfb] p-7"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">{number}</span><h3 className="mt-7 font-[Sora] text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></div></section>

      <section id="recursos" className="py-20 lg:py-28"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Mais que um chatbot</p><h2 className="mt-4 font-[Sora] text-3xl font-bold md:text-4xl">Uma central de atendimento e agendamento.</h2></div><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(([Icon,title,text]) => <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Icon className="h-5 w-5" /></span><h3 className="mt-6 font-[Sora] text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></div></section>

      <section id="segmentos" className="bg-slate-950 py-20 text-white"><div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2 lg:items-center lg:px-8"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">Personalizada para o seu negócio</p><h2 className="mt-4 font-[Sora] text-3xl font-bold md:text-4xl">Uma recepcionista que entende sua operação.</h2></div><div className="grid gap-3 sm:grid-cols-2">{segments.map(([Icon,label]) => <div key={label} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5"><Icon className="h-5 w-5 text-emerald-400" /><span className="font-semibold">{label}</span></div>)}</div></div></section>

      <section id="planos" className="py-20 lg:py-28"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Planos</p><h2 className="mt-4 font-[Sora] text-3xl font-bold md:text-4xl">Escolha o plano ideal para sua operação.</h2></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{plans.map(([name,price,features], index) => <article key={name} className={`rounded-[28px] border p-7 ${index === 1 ? "border-emerald-500 bg-slate-950 text-white" : "border-slate-200 bg-white"}`}><h3 className="font-[Sora] text-xl font-semibold">{name}</h3><div className="mt-6"><span className="text-sm opacity-60">R$ </span><span className="font-[Sora] text-4xl font-bold">{price}</span><span className="text-sm opacity-60">/mês</span></div><Link to="/cadastro" className={`mt-7 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${index === 1 ? "bg-emerald-500 text-white" : "bg-slate-950 text-white"}`}>Começar gratuitamente<ArrowRight className="h-4 w-4" /></Link><ul className="mt-7 space-y-3">{features.map((feature) => <li key={feature} className="flex items-center gap-2 text-sm opacity-80"><Check className="h-4 w-4 text-emerald-500" />{feature}</li>)}</ul></article>)}</div></div></section>

      <section className="px-5 pb-20 lg:px-8"><div className="mx-auto max-w-7xl rounded-[32px] bg-emerald-500 px-6 py-14 text-center text-white"><h2 className="mx-auto max-w-3xl font-[Sora] text-3xl font-bold md:text-4xl">Enquanto você cuida do seu negócio, a RecepIA cuida do atendimento.</h2><Link to="/cadastro" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-emerald-700">Criar minha conta<ArrowRight className="h-4 w-4" /></Link></div></section>

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8"><Brand /><p className="text-sm text-slate-500">Sua recepcionista inteligente trabalhando 24 horas por dia.</p><div className="flex gap-5 text-sm text-slate-500"><Link to="/login">Entrar</Link><Link to="/cadastro">Criar conta</Link></div></div></footer>
    </main>
  );
}
