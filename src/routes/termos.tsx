import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bot } from "lucide-react";

export const Route = createFileRoute("/termos")({
  head: () => ({ meta: [{ title: "Termos de Uso | RecepIA" }] }),
  component: TermsPage,
});

function TermsPage() {
  return <main className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-5xl items-center justify-between px-5 sm:px-8"><Link to="/" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold">Recep<span className="text-emerald-500">IA</span></span></Link><Link to="/cadastro" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4"/>Voltar</Link></div></header>
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <p className="text-sm font-semibold text-emerald-600">Documento legal</p><h1 className="mt-2 font-[Sora] text-4xl font-bold">Termos de Uso</h1><p className="mt-3 text-sm text-slate-500">Última atualização: 28 de agosto de 2026.</p>
      <div className="mt-10 space-y-8 text-sm leading-7 text-slate-600">
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">1. Objeto</h2><p className="mt-2">A RecepIA disponibiliza uma plataforma de atendimento, organização de clientes, conversas, agenda e automações com inteligência artificial para empresas. Os recursos disponíveis podem variar conforme o plano contratado e as integrações configuradas.</p></section>
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">2. Conta e responsabilidade do usuário</h2><p className="mt-2">O usuário é responsável por fornecer informações corretas, manter suas credenciais protegidas e utilizar a plataforma de acordo com a legislação aplicável. O acesso não deve ser compartilhado de forma que comprometa a segurança da conta ou de terceiros.</p></section>
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">3. Inteligência artificial</h2><p className="mt-2">As respostas automáticas dependem das informações cadastradas pela empresa e dos recursos de IA disponíveis. A empresa usuária deve revisar suas configurações, serviços, horários, políticas e conhecimentos antes de disponibilizar o atendimento ao público. A plataforma não deve ser utilizada para substituir orientação profissional obrigatória em áreas reguladas.</p></section>
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">4. Assinatura e cobrança</h2><p className="mt-2">Planos pagos são cobrados conforme o valor e a periodicidade apresentados no momento da contratação. Recursos e limites podem variar entre planos. Quando houver período de teste, o acesso promocional termina na data informada no painel.</p></section>
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">5. Disponibilidade e integrações</h2><p className="mt-2">Recursos que dependem de provedores externos, como meios de pagamento, mensageria e inteligência artificial, também estão sujeitos à disponibilidade e às políticas desses provedores.</p></section>
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">6. Uso proibido</h2><p className="mt-2">É proibido utilizar a plataforma para fraude, spam, violação de direitos de terceiros, coleta ilícita de dados, conteúdo ilegal, abuso de serviços externos ou qualquer atividade que comprometa a segurança ou a disponibilidade da plataforma.</p></section>
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">7. Alterações</h2><p className="mt-2">Estes termos podem ser atualizados para refletir mudanças no produto, na operação ou em requisitos legais. Quando a alteração for relevante, a versão atualizada será disponibilizada nesta página.</p></section>
        <section><h2 className="font-[Sora] text-xl font-semibold text-slate-900">8. Contato</h2><p className="mt-2">Dúvidas sobre estes termos podem ser encaminhadas pelos canais oficiais de suporte informados dentro da plataforma.</p></section>
      </div>
    </article>
  </main>;
}
