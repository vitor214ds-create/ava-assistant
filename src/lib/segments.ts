export type Segment = "clinica" | "consultorio" | "barbearia" | "otica" | "outro";

export const SEGMENTS: { value: Segment; label: string; emoji: string; description: string }[] = [
  { value: "clinica", label: "Clínica", emoji: "🩺", description: "Consultas, retornos e procedimentos" },
  { value: "consultorio", label: "Consultório", emoji: "🗂️", description: "Atendimento individual e retornos" },
  { value: "barbearia", label: "Barbearia", emoji: "💈", description: "Cortes, barba e serviços rápidos" },
  { value: "otica", label: "Ótica", emoji: "👓", description: "Avaliações, ajustes e retiradas" },
  { value: "outro", label: "Outro", emoji: "✨", description: "Monte do seu jeito" },
];

export const SEGMENT_LABEL: Record<Segment, string> = {
  clinica: "Clínica",
  consultorio: "Consultório",
  barbearia: "Barbearia",
  otica: "Ótica",
  outro: "Outro",
};

export type SuggestedService = { name: string; duration_minutes: number; price_cents: number };

export const SUGGESTED_SERVICES: Record<Segment, SuggestedService[]> = {
  barbearia: [
    { name: "Corte", duration_minutes: 30, price_cents: 4000 },
    { name: "Barba", duration_minutes: 30, price_cents: 3000 },
    { name: "Corte + barba", duration_minutes: 60, price_cents: 6500 },
    { name: "Sobrancelha", duration_minutes: 15, price_cents: 1500 },
    { name: "Platinado", duration_minutes: 120, price_cents: 18000 },
  ],
  clinica: [
    { name: "Consulta", duration_minutes: 60, price_cents: 15000 },
    { name: "Retorno", duration_minutes: 30, price_cents: 0 },
    { name: "Avaliação", duration_minutes: 45, price_cents: 12000 },
    { name: "Procedimento", duration_minutes: 60, price_cents: 25000 },
  ],
  consultorio: [
    { name: "Consulta", duration_minutes: 50, price_cents: 20000 },
    { name: "Retorno", duration_minutes: 30, price_cents: 0 },
    { name: "Avaliação", duration_minutes: 45, price_cents: 15000 },
  ],
  otica: [
    { name: "Avaliação", duration_minutes: 30, price_cents: 0 },
    { name: "Ajuste de armação", duration_minutes: 15, price_cents: 0 },
    { name: "Atendimento", duration_minutes: 30, price_cents: 0 },
    { name: "Retirada de pedido", duration_minutes: 15, price_cents: 0 },
  ],
  outro: [{ name: "Atendimento", duration_minutes: 30, price_cents: 0 }],
};

export const TONES = [
  { value: "profissional", label: "Profissional" },
  { value: "amigavel", label: "Amigável" },
  { value: "elegante", label: "Elegante" },
  { value: "casual", label: "Casual" },
];

export const WEEKDAYS = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda", short: "Seg" },
  { value: 2, label: "Terça", short: "Ter" },
  { value: 3, label: "Quarta", short: "Qua" },
  { value: 4, label: "Quinta", short: "Qui" },
  { value: 5, label: "Sexta", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
];

export const APPOINTMENT_STATUS: Record<string, { label: string; className: string }> = {
  agendado: { label: "Agendado", className: "bg-accent text-accent-foreground" },
  confirmado: { label: "Confirmado", className: "bg-primary/12 text-primary" },
  concluido: { label: "Concluído", className: "bg-success/15 text-success" },
  cancelado: { label: "Cancelado", className: "bg-destructive/12 text-destructive" },
  nao_compareceu: { label: "Não compareceu", className: "bg-warning/20 text-warning-foreground" },
};

export function formatMoney(cents: number | null | undefined) {
  return ((cents ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
