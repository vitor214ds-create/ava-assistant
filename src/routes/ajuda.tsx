import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bot, BookOpen, CalendarCheck2, CircleHelp, ExternalLink, MessageCircleMore, Settings2, ShieldCheck, Sparkles, Webhook } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/ajuda")({
  head: () => ({ meta: [{ title: "Central de Ajuda | RecepIA" }] }),
  component: HelpPage,
});

function HelpPage() {
  const navigate = useNavigate();
  const { user, organizationId, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login" });
    if (!organizationId) return void navigate({ to: "/onboarding" });
  }, [loading, user, organizationId]);

  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/dashboard" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5"/></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></Link><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4"/>Voltar ao painel</Link></div></header>
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <p className="text-sm font-semibold text-emerald-600">Suporte e configuração</p><h1 className="mt-1 font-[Sora] text-3xl font-bold">Central de Ajuda.</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Guias rápidos para colocar sua recepcionista no ar, testar o atendimento e entender como cada parte do sistema funciona.</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Guide icon={CalendarCheck2} title="Preparar a agenda" text="Cadastre profissionais, serviços e horários. A IA só oferece horários realmente livres e respeita conflitos da agenda." links={[['Profissionais','/profissionais'],['Serviços','/servicos'],['Horários','/horarios']]} />
        <Guide icon={Sparkles} title="Configurar e testar a IA" text="Defina nome, tom, saudação, regras e perguntas frequentes. Depois use o chat de teste antes de divulgar o atendimento." links={[['Configuração da IA','/configuracao-ia']]} />
        <Guide icon={Webhook} title="Conectar o WhatsApp" text="Use a integração oficial do WhatsApp Cloud API. Depois de conectar, configure o Callback URL e Verify Token mostrados pelo sistema na Meta." links={[['Abrir Integrações','/integracoes']]} />
        <Guide icon={MessageCircleMore} title="Atendimento humano" text="Na Central de Conversas você pode assumir um atendimento. O cliente continua no mesmo link e recebe suas respostas automaticamente." links={[['Central de Conversas','/conversas']]} />
        <Guide icon={Settings2} title="Publicar o link da recepcionista" text="Em Empresa e instalação você encontra o link público do atendimento e o código para incorporar o chat em outro site." links={[['Empresa e instalação','/configuracoes-empresa']]} />
        <Guide icon={ShieldCheck} title="Planos e cobrança" text="Acompanhe trial, limites e plano contratado. Quando o trial termina, seus dados continuam acessíveis, mas novas operações exigem assinatura ativa." links={[['Assinatura','/assinatura']]} />
      </div>

      <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><CircleHelp className="h-5 w-5 text-emerald-600"/><h2 className="font-[Sora] text-lg font-semibold">Checklist antes de divulgar</h2></div><div className="mt-5 grid gap-3 md:grid-cols-2"><Check text="Existe pelo menos um profissional ativo."/><Check text="Os serviços têm duração correta."/><Check text="Os dias e horários de funcionamento estão configurados."/><Check text="A recepcionista IA está ativa e foi testada."/><Check text="O link público da empresa abre corretamente."/><Check text="Se usar WhatsApp, o webhook está marcado como conectado."/></div></section>

      <section className="mt-6 rounded-3xl bg-slate-950 p-6 text-white"><div className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-emerald-400"/><h2 className="font-[Sora] text-lg font-semibold">Como funciona um agendamento automático</h2></div><p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">O cliente conversa com a recepcionista, informa o que precisa, a IA identifica o serviço e consulta a agenda real. Ela oferece apenas horários livres, aguarda a escolha e pede confirmação. Só depois da confirmação explícita o agendamento é gravado e aparece na Agenda com a identificação “Agendado pela IA”. Para cancelar ou remarcar, a IA primeiro identifica os compromissos do próprio cliente e confirma a alteração.</p><Link to="/configuracao-ia" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-400">Testar minha recepcionista<ExternalLink className="h-4 w-4"/></Link></section>
    </div>
  </main>;
}

function Guide({icon:Icon,title,text,links}:{icon:typeof Bot;title:string;text:string;links:[string,string][]}){return <article className="rounded-3xl border border-slate-200 bg-white p-5"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Icon className="h-5 w-5"/></span><h2 className="mt-4 font-[Sora] text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p><div className="mt-4 flex flex-wrap gap-2">{links.map(([label,to])=><Link key={to} to={to as any} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700">{label}</Link>)}</div></article>}
function Check({text}:{text:string}){return <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">✓</span><p className="text-sm leading-6 text-slate-600">{text}</p></div>}
