import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bot, Building2, Check, ChevronLeft, ChevronRight, Clock3, Loader2, Scissors, Sparkles, Stethoscope, Store, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Configurar empresa | RecepIA" }] }),
  component: OnboardingPage,
});

type Segment = "clinica" | "consultorio" | "barbearia" | "otica" | "outro";
type ServiceDraft = { name: string; duration: number; price: string };

const segmentOptions: { value: Segment; label: string; icon: typeof Stethoscope }[] = [
  { value: "clinica", label: "Clínica", icon: Stethoscope },
  { value: "consultorio", label: "Consultório", icon: UserRound },
  { value: "barbearia", label: "Barbearia", icon: Scissors },
  { value: "otica", label: "Ótica", icon: Store },
  { value: "outro", label: "Outro", icon: Building2 },
];

const suggestions: Record<Segment, ServiceDraft[]> = {
  clinica: [
    { name: "Consulta", duration: 60, price: "150" },
    { name: "Retorno", duration: 30, price: "0" },
    { name: "Avaliação", duration: 45, price: "100" },
  ],
  consultorio: [
    { name: "Consulta", duration: 60, price: "150" },
    { name: "Retorno", duration: 30, price: "0" },
    { name: "Avaliação", duration: 45, price: "100" },
  ],
  barbearia: [
    { name: "Corte", duration: 40, price: "40" },
    { name: "Barba", duration: 30, price: "30" },
    { name: "Corte + barba", duration: 60, price: "65" },
  ],
  otica: [
    { name: "Atendimento", duration: 30, price: "0" },
    { name: "Ajuste de armação", duration: 20, price: "0" },
    { name: "Retirada de pedido", duration: 15, price: "0" },
  ],
  outro: [{ name: "Atendimento", duration: 30, price: "0" }],
};

const week = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, organizationId, refreshMembership, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [organization, setOrganization] = useState({ name: "", phone: "", address: "", city: "", state: "", description: "", segment: "outro" as Segment });
  const [professional, setProfessional] = useState({ name: "", roleTitle: "Profissional principal", email: "", phone: "" });
  const [services, setServices] = useState<ServiceDraft[]>(suggestions.outro);
  const [hours, setHours] = useState(week.map((_, index) => ({ weekday: index + 1, open: index < 5, start: "08:00", end: index < 5 ? "18:00" : "13:00" })));
  const [ai, setAi] = useState({ name: "Júlia", tone: "amigavel", greeting: "Olá! Sou a recepcionista virtual. Como posso ajudar?" });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!organizationId) {
      void refreshMembership();
      return;
    }

    void Promise.all([
      supabase.from("organizations").select("name,phone,address,city,state,description,segment,onboarding_completed").eq("id", organizationId).single(),
      supabase.from("profiles").select("full_name,email,phone").eq("id", user.id).maybeSingle(),
      supabase.from("professionals").select("name,role_title,email,phone").eq("organization_id", organizationId).eq("is_active", true).order("created_at").limit(1).maybeSingle(),
    ]).then(([orgResult, profileResult, professionalResult]) => {
      const data = orgResult.data;
      if (!data) return;
      if (data.onboarding_completed) {
        navigate({ to: "/dashboard" });
        return;
      }
      const segment = data.segment as Segment;
      setOrganization({
        name: data.name ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        description: data.description ?? "",
        segment,
      });
      setServices(suggestions[segment]);
      const savedProfessional = professionalResult.data;
      const profile = profileResult.data;
      setProfessional({
        name: savedProfessional?.name || profile?.full_name || "",
        roleTitle: savedProfessional?.role_title || "Profissional principal",
        email: savedProfessional?.email || profile?.email || user.email || "",
        phone: savedProfessional?.phone || profile?.phone || "",
      });
    });
  }, [authLoading, user, organizationId]);

  const progress = useMemo(() => Math.round((step / 6) * 100), [step]);

  function validateCurrentSetup() {
    if (!organization.name.trim()) return "Informe o nome da empresa.";
    if (!professional.name.trim()) return "Informe o nome do profissional principal.";
    const validServices = services.filter((service) => service.name.trim());
    if (!validServices.length) return "Cadastre pelo menos um serviço.";
    if (validServices.some((service) => !Number.isFinite(service.duration) || service.duration < 5)) return "A duração dos serviços deve ser de pelo menos 5 minutos.";
    const openDays = hours.filter((item) => item.open);
    if (!openDays.length) return "Defina pelo menos um dia de atendimento.";
    if (openDays.some((item) => !item.start || !item.end || item.start >= item.end)) return "Confira os horários: a abertura precisa ser anterior ao fechamento.";
    if (!ai.name.trim() || !ai.greeting.trim()) return "Preencha o nome e a mensagem inicial da recepcionista IA.";
    return "";
  }

  async function finish() {
    if (!organizationId) return;
    const validation = validateCurrentSetup();
    if (validation) { setError(validation); return; }
    setSaving(true);
    setError("");

    const serviceRows = services
      .filter((service) => service.name.trim())
      .map((service) => ({
        name: service.name.trim(),
        duration_minutes: Math.max(5, Number(service.duration) || 30),
        price_cents: Math.max(0, Math.round((Number(service.price.replace(",", ".")) || 0) * 100)),
        use_primary_professional: true,
      }));

    const { error: rpcError } = await supabase.rpc("complete_onboarding", {
      p_organization_id: organizationId,
      p_organization: {
        name: organization.name.trim(), phone: organization.phone.trim(), address: organization.address.trim(), city: organization.city.trim(),
        state: organization.state.trim(), description: organization.description.trim(), segment: organization.segment,
      },
      p_professional: {
        name: professional.name.trim(), role_title: professional.roleTitle.trim(), email: professional.email.trim(), phone: professional.phone.trim(),
      },
      p_services: serviceRows,
      p_hours: hours.map((item) => ({ weekday: item.weekday, is_open: item.open, opens_at: item.start, closes_at: item.end })),
      p_ai: { assistant_name: ai.name.trim(), tone: ai.tone, greeting: ai.greeting.trim(), custom_rules: "" },
    });

    if (rpcError) {
      const message = rpcError.message || "";
      if (message.includes("PLAN_LIMIT_PROFESSIONALS")) setError("Seu plano não permite adicionar outro profissional ativo. Ajuste o plano ou desative um profissional existente.");
      else if (message.includes("SUBSCRIPTION_INACTIVE")) setError("Seu período de teste terminou. Escolha um plano para continuar configurando a operação.");
      else setError("Não foi possível concluir a configuração. Nenhuma configuração parcial foi marcada como concluída; revise os dados e tente novamente.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setStep(6);
  }

  return (
    <main className="min-h-screen bg-[#f7faf8] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="inline-flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white"><Bot className="h-5 w-5" /></span><span className="font-[Sora] text-xl font-bold text-slate-950">Recep<span className="text-emerald-500">IA</span></span></div>
          <span className="text-sm font-semibold text-slate-500">Etapa {step} de 6</span>
        </header>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>

        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
          {step === 1 && <CompanyStep organization={organization} setOrganization={setOrganization} />}
          {step === 2 && <SegmentStep segment={organization.segment} onSelect={(segment) => { setOrganization((current) => ({ ...current, segment })); setServices(suggestions[segment]); }} />}
          {step === 3 && <ServicesStep services={services} setServices={setServices} />}
          {step === 4 && <HoursStep hours={hours} setHours={setHours} />}
          {step === 5 && <AiStep ai={ai} setAi={setAi} professional={professional} setProfessional={setProfessional} />}
          {step === 6 && <DoneStep />}

          {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            {step > 1 && step < 6 ? <button onClick={() => { setError(""); setStep((current) => current - 1); }} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"><ChevronLeft className="h-4 w-4" />Voltar</button> : <span />}
            {step < 5 && <button onClick={() => { setError(""); setStep((current) => current + 1); }} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">Continuar<ChevronRight className="h-4 w-4" /></button>}
            {step === 5 && <button disabled={saving} onClick={finish} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Finalizar configuração</button>}
            {step === 6 && <button onClick={() => navigate({ to: "/dashboard" })} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600">Conhecer meu painel<ChevronRight className="h-4 w-4" /></button>}
          </div>
        </section>
      </div>
    </main>
  );
}

function CompanyStep({ organization, setOrganization }: { organization: any; setOrganization: React.Dispatch<React.SetStateAction<any>> }) {
  const update = (field: string, value: string) => setOrganization((current: any) => ({ ...current, [field]: value }));
  return <div><Eyebrow>ETAPA 1</Eyebrow><Title>Vamos configurar sua empresa.</Title><Text>Essas informações serão usadas pela IA para atender seus clientes corretamente.</Text><div className="mt-8 grid gap-4 sm:grid-cols-2"><Input label="Nome da empresa" value={organization.name} onChange={(v) => update("name", v)} /><Input label="Telefone" value={organization.phone} onChange={(v) => update("phone", v)} /><Input label="Endereço" value={organization.address} onChange={(v) => update("address", v)} /><Input label="Cidade" value={organization.city} onChange={(v) => update("city", v)} /><Input label="Estado" value={organization.state} onChange={(v) => update("state", v)} /><label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-700">Descrição</span><textarea value={organization.description} onChange={(e) => update("description", e.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="Conte brevemente o que sua empresa faz." /></label></div></div>;
}

function SegmentStep({ segment, onSelect }: { segment: Segment; onSelect: (segment: Segment) => void }) {
  return <div><Eyebrow>ETAPA 2</Eyebrow><Title>Qual é o seu segmento?</Title><Text>Vamos adaptar as sugestões iniciais ao seu tipo de negócio.</Text><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{segmentOptions.map(({ value, label, icon: Icon }) => <button type="button" key={value} onClick={() => onSelect(value)} className={`rounded-2xl border p-5 text-left transition ${segment === value ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/10" : "border-slate-200 hover:border-slate-300"}`}><Icon className={`h-5 w-5 ${segment === value ? "text-emerald-600" : "text-slate-500"}`} /><p className="mt-4 font-semibold text-slate-950">{label}</p></button>)}</div></div>;
}

function ServicesStep({ services, setServices }: { services: ServiceDraft[]; setServices: React.Dispatch<React.SetStateAction<ServiceDraft[]>> }) {
  const update = (index: number, field: keyof ServiceDraft, value: string | number) => setServices((current) => current.map((service, i) => i === index ? { ...service, [field]: value } : service));
  return <div><Eyebrow>ETAPA 3</Eyebrow><Title>Cadastre seus serviços.</Title><Text>Os serviços serão vinculados ao profissional principal para que a IA já consiga oferecer horários assim que você terminar.</Text><div className="mt-8 space-y-3">{services.map((service, index) => <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[1fr_130px_130px]"><input value={service.name} onChange={(e) => update(index, "name", e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" placeholder="Nome do serviço" /><input type="number" min={5} value={service.duration} onChange={(e) => update(index, "duration", Number(e.target.value))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /><input value={service.price} onChange={(e) => update(index, "price", e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" placeholder="Preço" /></div>)}</div><button type="button" onClick={() => setServices((current) => [...current, { name: "", duration: 30, price: "0" }])} className="mt-4 text-sm font-bold text-emerald-600">+ Adicionar serviço</button></div>;
}

function HoursStep({ hours, setHours }: { hours: any[]; setHours: React.Dispatch<React.SetStateAction<any[]>> }) {
  const update = (index: number, field: string, value: any) => setHours((current) => current.map((item, i) => i === index ? { ...item, [field]: value } : item));
  return <div><Eyebrow>ETAPA 4</Eyebrow><Title>Configure seu horário.</Title><Text>A IA usará esses horários para nunca oferecer atendimento quando a empresa estiver fechada.</Text><div className="mt-8 space-y-3">{hours.map((item, index) => <div key={item.weekday} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center"><div className="flex min-w-32 items-center gap-3"><button type="button" onClick={() => update(index, "open", !item.open)} className={`h-6 w-10 rounded-full p-1 transition ${item.open ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${item.open ? "translate-x-4" : ""}`} /></button><span className="font-semibold text-slate-800">{week[index]}</span></div>{item.open ? <div className="flex items-center gap-2 text-sm text-slate-500"><Clock3 className="h-4 w-4" /><input type="time" value={item.start} onChange={(e) => update(index, "start", e.target.value)} className="rounded-lg border border-slate-200 px-2 py-2" /><span>até</span><input type="time" value={item.end} onChange={(e) => update(index, "end", e.target.value)} className="rounded-lg border border-slate-200 px-2 py-2" /></div> : <span className="text-sm text-slate-400">Fechado</span>}</div>)}</div></div>;
}

function AiStep({ ai, setAi, professional, setProfessional }: { ai: any; setAi: React.Dispatch<React.SetStateAction<any>>; professional: any; setProfessional: React.Dispatch<React.SetStateAction<any>> }) {
  return <div><Eyebrow>ETAPA 5</Eyebrow><Title>Quem atende e como a IA se apresenta?</Title><Text>O profissional principal recebe os primeiros agendamentos. Você poderá adicionar outros profissionais e escalas depois.</Text>
    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-center gap-2 font-semibold text-slate-900"><UserRound className="h-4 w-4 text-emerald-600"/>Profissional principal</div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Input label="Nome do profissional" value={professional.name} onChange={(value) => setProfessional((current: any) => ({ ...current, name: value }))}/><Input label="Função / especialidade" value={professional.roleTitle} onChange={(value) => setProfessional((current: any) => ({ ...current, roleTitle: value }))}/><Input label="E-mail" value={professional.email} onChange={(value) => setProfessional((current: any) => ({ ...current, email: value }))}/><Input label="Telefone" value={professional.phone} onChange={(value) => setProfessional((current: any) => ({ ...current, phone: value }))}/></div></div>
    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5"><div className="flex items-center gap-2 font-semibold text-emerald-900"><Sparkles className="h-4 w-4"/>Recepcionista IA</div><div className="mt-4 grid gap-5 sm:grid-cols-2"><Input label="Nome da IA" value={ai.name} onChange={(value) => setAi((current: any) => ({ ...current, name: value }))} /><label><span className="mb-2 block text-sm font-semibold text-slate-700">Tom</span><select value={ai.tone} onChange={(e) => setAi((current: any) => ({ ...current, tone: e.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"><option value="profissional">Profissional</option><option value="amigavel">Amigável</option><option value="elegante">Elegante</option><option value="casual">Casual</option></select></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-700">Mensagem inicial</span><textarea rows={4} value={ai.greeting} onChange={(e) => setAi((current: any) => ({ ...current, greeting: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" /></label></div></div>
  </div>;
}

function DoneStep() { return <div className="py-10 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white"><Check className="h-8 w-8" /></div><h1 className="mt-6 font-[Sora] text-3xl font-bold text-slate-950">Pronto! Sua RecepIA está configurada.</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">Empresa, profissional, serviços, horários e recepcionista foram salvos juntos. Sua agenda já está preparada para receber agendamentos automáticos.</p></div>; }
function Eyebrow({ children }: { children: React.ReactNode }) { return <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">{children}</p>; }
function Title({ children }: { children: React.ReactNode }) { return <h1 className="mt-3 font-[Sora] text-3xl font-bold tracking-tight text-slate-950">{children}</h1>; }
function Text({ children }: { children: React.ReactNode }) { return <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{children}</p>; }
function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" /></label>; }
