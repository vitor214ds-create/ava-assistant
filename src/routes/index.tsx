import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  CalendarCheck2,
  Check,
  ChevronRight,
  Clock3,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Store,
  UsersRound,
  WandSparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RecepIA — Sua recepcionista inteligente 24 horas por dia" },
      {
        name: "description",
        content:
          "Atenda clientes, responda dúvidas e transforme conversas em agendamentos automaticamente com a RecepIA.",
      },
      {
        property: "og:title",
        content: "RecepIA — Sua recepcionista inteligente 24 horas por dia",
      },
      {
        property: "og:description",
        content:
          "Atendimento inteligente, agenda integrada e conversas centralizadas para clínicas, consultórios, barbearias e óticas.",
      },
    ],
  }),
  component: Index,
});

const benefits = [
  {
    icon: MessageCircleMore,
    title: "Atendimento 24 horas",
    description:
      "Responda seus clientes mesmo fora do horário comercial e reduza oportunidades perdidas.",
  },
  {
    icon: CalendarCheck2,
    title: "Agendamento automático",
    description:
      "A IA consulta a agenda, encontra horários disponíveis e confirma o atendimento com o cliente.",
  },
  {
    icon: UsersRound,
    title: "Tudo centralizado",
    description:
      "Clientes, conversas, profissionais, serviços e agenda organizados em um único painel.",
  },
  {
    icon: ShieldCheck,
    title: "Feito para empresas",
    description:
      "Estrutura multiempresa, permissões por usuário e dados separados para cada negócio.",
  },
];

const segments = [
  { label: "Clínicas", icon: Stethoscope },
  { label: "Consultórios", icon: UsersRound },
  { label: "Barbearias", icon: Sparkles },
  { label: "Óticas e outros negócios", icon: Store },
];

const plans = [
  {
    name: "Básico",
    price: "79,90",
    description: "Para negócios que querem começar a automatizar o atendimento.",
    features: ["Agenda inteligente", "Cadastro de clientes", "Serviços e profissionais", "Configuração da IA"],
  },
  {
    name: "Profissional",
    price: "129,90",
    description: "Para empresas que querem transformar atendimento em agendamento.",
    featured: true,
    features: [
      "Tudo do plano Básico",
      "Central de conversas",
      "Relatórios completos",
      "Mais automações e limites",
    ],
  },
  {
    name: "Premium",
    price: "199,90",
    description: "Para operações que precisam de mais capacidade e recursos avançados.",
    features: ["Tudo do Profissional", "Limites ampliados", "Recursos avançados", "Prioridade em integrações"],
  },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
        <Bot className="h-5 w-5" />
      </div>
      <span className="font-[Sora] text-xl font-bold tracking-tight text-slate-950">
        Recep<span className="text-emerald-500">IA</span>
      </span>
    </div>
  );
}

function Index() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfcfb] text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#inicio" aria-label="RecepIA - início">
            <Brand />
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex">
            <a className="transition hover:text-slate-950" href="#como-funciona">Como funciona</a>
            <a className="transition hover:text-slate-950" href="#recursos">Recursos</a>
            <a className="transition hover:text-slate-950" href="#segmentos">Segmentos</a>
            <a className="transition hover:text-slate-950" href="#planos">Planos</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            >
              Entrar
            </Link>
            <a
              href="#planos"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Começar gratuitamente
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <section id="inicio" className="relative pt-32 lg:pt-40">
        <div className="absolute left-1/2 top-24 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-24 lg:grid-cols-[1.03fr_.97fr] lg:items-center lg:px-8 lg:pb-32">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700">
              <WandSparkles className="h-4 w-4" />
              Atendimento inteligente para o seu negócio
            </div>

            <h1 className="max-w-3xl font-[Sora] text-5xl font-bold leading-[1.06] tracking-[-0.045em] text-slate-950 md:text-6xl lg:text-[68px]">
              Sua recepcionista inteligente. <span className="text-emerald-500">24 horas por dia.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              A IA atende seus clientes, responde dúvidas, encontra horários disponíveis e realiza agendamentos automaticamente.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#planos"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600"
              >
                Começar gratuitamente
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#demonstracao"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Ver como funciona
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
              {["Configuração simples", "Agenda integrada", "Sem cartão no início"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div id="demonstracao" className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[42px] bg-gradient-to-br from-emerald-200/70 via-white to-sky-100 blur-2xl" />
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Bot className="h-5 w-5" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">Júlia • RecepIA</p>
                    <p className="text-xs text-emerald-600">Online agora</p>
                  </div>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">IA trabalhando</div>
              </div>

              <div className="space-y-4 bg-[#f7f9f8] p-5 sm:p-6">
                <div className="ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-slate-950 px-4 py-3 text-sm leading-6 text-white">
                  Oi, vocês atendem sábado?
                </div>
                <div className="max-w-[84%] rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
                  Olá! Sim 😊 Nosso atendimento aos sábados funciona das 08:00 às 13:00. Gostaria de verificar os horários disponíveis?
                </div>
                <div className="ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-slate-950 px-4 py-3 text-sm text-white">Sim.</div>
                <div className="max-w-[84%] rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
                  Tenho estes horários disponíveis:
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {["09:00", "10:30", "11:30"].map((time) => (
                      <span key={time} className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-center font-semibold text-emerald-700">{time}</span>
                    ))}
                  </div>
                </div>
                <div className="ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-slate-950 px-4 py-3 text-sm text-white">10:30.</div>
                <div className="max-w-[84%] rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
                  Perfeito! Para confirmar seu agendamento, preciso do seu nome e telefone.
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-100 bg-white px-5 py-4">
                <div className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">Digite sua mensagem...</div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white"><ArrowRight className="h-4 w-4" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-slate-100 bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Como funciona</p>
            <h2 className="mt-4 font-[Sora] text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Da primeira mensagem ao horário confirmado.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">A RecepIA usa as informações reais da sua empresa para atender com clareza e consultar a mesma agenda usada pela sua equipe.</p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              ["01", "Configure sua empresa", "Cadastre serviços, profissionais, horários, regras e a personalidade da sua recepcionista."],
              ["02", "A IA atende", "O cliente pergunta, tira dúvidas e informa o que precisa sem depender de uma pessoa disponível."],
              ["03", "A agenda é atualizada", "A IA encontra horários livres, confirma os dados e transforma a conversa em agendamento."],
            ].map(([number, title, description]) => (
              <article key={number} className="rounded-3xl border border-slate-200 bg-[#fbfcfb] p-7">
                <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">{number}</div>
                <h3 className="font-[Sora] text-xl font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="recursos" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Mais que um chatbot</p>
              <h2 className="mt-4 max-w-xl font-[Sora] text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Uma central de atendimento e agendamento para sua empresa.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">Acompanhe tudo em um único lugar e permita que sua equipe assuma qualquer conversa quando necessário, sem perder o histórico do cliente.</p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-6 font-[Sora] text-lg font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="segmentos" className="bg-slate-950 py-20 text-white lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">Personalizada para o seu negócio</p>
              <h2 className="mt-4 max-w-xl font-[Sora] text-3xl font-bold tracking-tight md:text-4xl">Uma recepcionista que entende como sua empresa funciona.</h2>
              <p className="mt-5 max-w-xl leading-7 text-slate-400">O segmento escolhido adapta a configuração inicial e ajuda você a começar mais rápido, sem limitar a personalização dos seus serviços e processos.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {segments.map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400"><Icon className="h-5 w-5" /></div>
                  <span className="font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Planos</p>
            <h2 className="mt-4 font-[Sora] text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Escolha o plano ideal para sua operação.</h2>
            <p className="mt-4 leading-7 text-slate-600">Comece pequeno e aumente sua capacidade conforme a demanda de atendimento crescer.</p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className={`relative rounded-[28px] border p-7 ${plan.featured ? "border-emerald-500 bg-slate-950 text-white shadow-xl shadow-emerald-500/10" : "border-slate-200 bg-white text-slate-950"}`}>
                {plan.featured && <div className="absolute -top-3 left-7 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">Mais escolhido</div>}
                <h3 className="font-[Sora] text-xl font-semibold">{plan.name}</h3>
                <p className={`mt-3 min-h-12 text-sm leading-6 ${plan.featured ? "text-slate-400" : "text-slate-600"}`}>{plan.description}</p>
                <div className="mt-7 flex items-end gap-1">
                  <span className={`pb-1 text-sm ${plan.featured ? "text-slate-400" : "text-slate-500"}`}>R$</span>
                  <span className="font-[Sora] text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className={`pb-1 text-sm ${plan.featured ? "text-slate-400" : "text-slate-500"}`}>/mês</span>
                </div>
                <a href="#inicio" className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${plan.featured ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-slate-950 text-white hover:bg-slate-800"}`}>
                  Começar gratuitamente <ArrowRight className="h-4 w-4" />
                </a>
                <div className={`my-7 h-px ${plan.featured ? "bg-white/10" : "bg-slate-100"}`} />
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className={`flex items-center gap-3 text-sm ${plan.featured ? "text-slate-300" : "text-slate-600"}`}>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"><Check className="h-3.5 w-3.5" /></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-emerald-500 px-6 py-12 text-center text-white sm:px-10 lg:py-16">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><Clock3 className="h-6 w-6" /></div>
          <h2 className="mx-auto mt-6 max-w-3xl font-[Sora] text-3xl font-bold tracking-tight md:text-4xl">Enquanto você cuida do seu negócio, a RecepIA cuida do atendimento.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-emerald-50">Organize sua operação, responda mais rápido e deixe sua agenda trabalhar junto com a inteligência artificial.</p>
          <a href="#planos" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50">Criar minha conta <ArrowRight className="h-4 w-4" /></a>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Brand />
          <p className="text-sm text-slate-500">Sua recepcionista inteligente trabalhando 24 horas por dia.</p>
          <div className="flex gap-5 text-sm font-medium text-slate-500">
            <a href="#planos" className="hover:text-slate-900">Planos</a>
            <a href="#recursos" className="hover:text-slate-900">Recursos</a>
            <a href="#inicio" className="hover:text-slate-900">Início</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
