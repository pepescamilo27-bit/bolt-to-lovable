// Ported from the Bolt "assistant-ai" edge function. Server-only helpers.
export const GEMINI_MODEL = "gemini-2.5-flash";
export const DAILY_LIMIT = 20;
const REQUEST_TIMEOUT_MS = 25000;
const HISTORY_ITEMS = 10;

export const TASKS = {
  analyze:
    "Faça uma análise desta oportunidade: situação atual, pontos fortes, riscos de a negociação esfriar e o que falta registrar. Explique o motivo de cada ponto e termine com uma conclusão de uma frase.",
  next_steps:
    "Recomende de 3 a 5 próximos passos em ordem de prioridade. Para cada um, diga o motivo e um prazo sugerido.",
  followup:
    "Monte um plano de follow-up: a data sugerida para o próximo contato, o canal mais indicado e um rascunho curto de mensagem.",
  message:
    "Escreva uma mensagem comercial pronta para enviar, adequada ao objetivo informado. Seja específico com os dados do cliente e não use mais de 120 palavras.",
} as const;

export type Task = keyof typeof TASKS;

const SYSTEM_PROMPT =
  "Você é o assistente comercial da Nexvya, um CRM para pequenos negócios. Responda sempre em português do Brasil, de forma prática e direta, em texto simples. Use somente os dados fornecidos. Não invente nomes, valores, datas ou fatos. Se faltar informação, diga o que falta. Não use emojis.";

export interface Payload {
  task: Task;
  opportunityId: string;
  purpose?: string | undefined;
  context?: string | undefined;
  formal?: boolean | undefined;
}


export function parsePayload(raw: unknown): Payload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { task?: unknown; opportunityId?: unknown; purpose?: unknown; context?: unknown; formal?: unknown };
  if (typeof r.task !== "string" || !(r.task in TASKS)) return null;
  if (typeof r.opportunityId !== "string" || !/^[0-9a-f-]{36}$/i.test(r.opportunityId)) return null;
  if (r.purpose !== undefined && (typeof r.purpose !== "string" || r.purpose.length > 80)) return null;
  if (r.context !== undefined && (typeof r.context !== "string" || r.context.length > 500)) return null;
  if (r.formal !== undefined && typeof r.formal !== "boolean") return null;
  return {
    task: r.task as Task,
    opportunityId: r.opportunityId,
    purpose: r.purpose as string | undefined,
    context: r.context as string | undefined,
    formal: r.formal as boolean | undefined,
  };
}

function formatMoney(value: number | null) {
  if (value === null) return "não informado";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function line(label: string, value: string | null | undefined) {
  return `${label}: ${value && value.trim() ? value : "não informado"}`;
}

export function buildPrompt(
  payload: Payload,
  opp: Record<string, unknown>,
  proposals: Record<string, unknown>[],
): string {
  const activities = Array.isArray(opp["activities"]) ? (opp["activities"] as Record<string, unknown>[]) : [];
  const history = activities
    .slice(-HISTORY_ITEMS)
    .map((a) => `- ${String(a["at"] ?? "").slice(0, 10)} (${String(a["type"] ?? "")}): ${String(a["text"] ?? "")}`)
    .join("\n");
  const proposalLines = proposals
    .map((p) => `- ${String(p["title"])} | status: ${String(p["status"])} | valor: ${formatMoney(Number(p["value"]))}`)
    .join("\n");

  const data = [
    line("Contato", opp["contact"] as string),
    line("Empresa", opp["company"] as string),
    line("Produto ou serviço", opp["product"] as string),
    `Valor: ${formatMoney(opp["value"] === null || opp["value"] === undefined ? null : Number(opp["value"]))}`,
    line("Etapa", opp["stage"] as string),
    line("Último contato", opp["last_contact"] as string),
    line("Próximo follow-up", opp["next_follow_up"] as string),
    line("Próxima ação", opp["next_action"] as string),
    line("Observações", opp["notes"] as string),
    line("Motivo da perda", opp["loss_reason"] as string),
    `Histórico recente:\n${history || "sem registros"}`,
    `Propostas:\n${proposalLines || "nenhuma proposta"}`,
  ].join("\n");

  const parts = [
    `Data de hoje: ${new Date().toISOString().slice(0, 10)}`,
    `Dados da oportunidade:\n${data}`,
    `Tarefa: ${TASKS[payload.task]}`,
  ];

  if (payload.task === "message") {
    parts.push(`Objetivo da mensagem: ${payload.purpose?.trim() || "não informado"}`);
    parts.push(`Tom: ${payload.formal ? "formal" : "cordial e direto"}`);
    if (payload.context?.trim()) parts.push(`Contexto adicional do vendedor: ${payload.context.trim()}`);
  }

  return parts.join("\n\n");
}

export async function callGemini(apiKey: string, prompt: string): Promise<{ status: number; body: unknown }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

export function extractText(body: unknown): string {
  const candidates = (body as { candidates?: { content?: { parts?: { text?: string }[] } }[] })?.candidates;
  const parts = candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("").trim();
}

