import { PURPOSES, type AssistantProvider, type DraftResult } from "./assistant";
import { runAssistantAi } from "./ai.functions";

export type AiTask = "analyze" | "next_steps" | "followup" | "message";

export const AI_TASK_LABELS: Record<Exclude<AiTask, "message">, string> = {
  analyze: "Analisar oportunidade",
  next_steps: "Próximos passos",
  followup: "Plano de follow-up",
};

export interface AiRequest {
  task: AiTask;
  opportunityId: string;
  purpose?: string;
  context?: string;
  formal?: boolean;
}

export type AiResult =
  | { ok: true; text: string; remaining: number }
  | { ok: false; code: string; message: string };

export async function requestAi(req: AiRequest): Promise<AiResult> {
  try {
    return await runAssistantAi({ data: req });
  } catch {
    return { ok: false, code: "network", message: "Sem conexão com o servidor. Verifique sua internet e tente de novo." };
  }
}

export const aiProvider: AssistantProvider = {
  async draftMessage({ opportunity, purpose, context, formal }): Promise<DraftResult> {
    const label = PURPOSES.find((p) => p.id === purpose)?.label ?? purpose;
    const res = await requestAi({
      task: "message",
      opportunityId: opportunity.id,
      purpose: label,
      context,
      formal,
    });
    return res.ok ? { ok: true, text: res.text } : { ok: false, message: res.message };
  },
};
