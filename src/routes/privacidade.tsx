import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bot } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [{ title: "Política de Privacidade | RecepIA" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-5xl items-center justify-between px-5 sm:px-8"><Link to="/" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></Link><Link to="/cadastro" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4"/>Voltar</Link></div></header>
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <p className="text-sm font-semibold text-emerald-600">Privacidade</p><h1 className="mt-2 font-[Sora] text-4xl font-bold">Política de Privacidade</h1><p className="mt-3 text-sm text-slate-500">Última atualização: 28 de agosto de 2026.</p>
      <div className="mt-10 space-y-8 text-sm leading-7 text-slate-600">
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">1. Dados tratados</h2><p className="mt-2">A plataforma pode tratar dados de cadastro da conta, informações da empresa, profissionais, clientes, serviços, horários, conversas, agendamentos, configurações e dados técnicos necessários para autenticação, segurança e funcionamento do serviço.</p></section>
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">2. Finalidades</h2><p className="mt-2">Os dados são utilizados para autenticar usuários, prestar as funcionalidades contratadas, organizar atendimentos e agendamentos, operar integrações autorizadas, processar cobranças, prevenir abuso, manter segurança e oferecer suporte.</p></section>
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">3. Dados dos clientes da empresa usuária</h2><p className="mt-2">Cada empresa é responsável pelas informações de seus próprios clientes inseridas ou recebidas pela plataforma e deve possuir base legal adequada para o tratamento desses dados. A arquitetura da RecepIA busca manter os dados de cada organização isolados dos dados de outras empresas.</p></section>
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">4. Compartilhamento com fornecedores</h2><p className="mt-2">Algumas funcionalidades dependem de fornecedores de infraestrutura, autenticação, inteligência artificial, mensageria e pagamentos. Nesses casos, apenas os dados necessários para executar a funcionalidade correspondente podem ser enviados ao respectivo fornecedor, conforme a configuração e o uso da plataforma.</p></section>
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">5. Segurança</h2><p className="mt-2">São adotados controles técnicos de autenticação, isolamento por organização, regras de acesso e proteção de credenciais. Nenhum sistema, porém, pode garantir risco zero, e usuários também devem proteger suas senhas, dispositivos e acessos.</p></section>
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">6. Retenção</h2><p className="mt-2">Os dados podem ser mantidos enquanto forem necessários para a prestação do serviço, cumprimento de obrigações legais, prevenção de fraude e resolução de disputas, observados os requisitos aplicáveis.</p></section>
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">7. Direitos do titular</h2><p className="mt-2">Quando aplicável, titulares podem solicitar informações, correção, atualização ou outras medidas previstas na legislação de proteção de dados. Solicitações relacionadas aos clientes de uma empresa usuária devem ser direcionadas prioritariamente à própria empresa responsável por aquele atendimento.</p></section>
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">8. Contato</h2><p className="mt-2">Dúvidas ou solicitações de privacidade podem ser encaminhadas pelos canais oficiais de suporte informados dentro da plataforma.</p></section>
      </div>
    </article>
  </main>;
}
