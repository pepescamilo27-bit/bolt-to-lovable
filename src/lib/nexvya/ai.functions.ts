import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DAILY_LIMIT,
  buildPrompt,
  callGemini,
  extractText,
  parsePayload,
} from "./assistant-ai.server";

export type AiResponse =
  | { ok: true; text: string; remaining: number }
  | { ok: false; code: string; message: string };

const fail = (code: string, message: string): AiResponse => ({ ok: false, code, message });

export const runAssistantAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => raw)
  .handler(async ({ data, context }): Promise<AiResponse> => {
    try {
      const payload = parsePayload(data);
      if (!payload) return fail("invalid_request", "Dados da solicitação inválidos.");

      const apiKey = process.env["GEMINI_API_KEY"];
      if (!apiKey) {
        return fail(
          "ai_not_configured",
          "A IA ainda não está ativada. Adicione a chave da API do Google Gemini (GEMINI_API_KEY).",
        );
      }

      const { supabase, userId } = context;
      const { data: opp, error: oppError } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", payload.opportunityId)
        .maybeSingle();
      if (oppError) return fail("server_error", "Não foi possível carregar a oportunidade.");
      if (!opp) return fail("not_found", "Oportunidade não encontrada.");

      const { data: proposals, error: proposalError } = await supabase
        .from("proposals")
        .select("title, status, value")
        .eq("opportunity_id", payload.opportunityId);
      if (proposalError) return fail("server_error", "Não foi possível carregar as propostas.");

      // Quota counter is writable only by the service role.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: used, error: quotaError } = await supabaseAdmin.rpc("consume_ai_quota", {
        p_user: userId,
        p_limit: DAILY_LIMIT,
      });
      if (quotaError) return fail("server_error", "Não foi possível verificar seu limite de uso.");
      if (used === null || used === undefined) {
        return fail("daily_limit", `Você já usou as ${DAILY_LIMIT} análises de IA de hoje. Tente novamente amanhã.`);
      }

      const prompt = buildPrompt(
        payload,
        opp as unknown as Record<string, unknown>,
        (proposals ?? []) as unknown as Record<string, unknown>[],
      );
      let gemini: { status: number; body: unknown };
      try {
        gemini = await callGemini(apiKey, prompt);
      } catch (err) {
        const timedOut = err instanceof DOMException && err.name === "TimeoutError";
        return fail(
          "provider_unavailable",
          timedOut
            ? "A IA demorou demais para responder. Tente novamente."
            : "Não foi possível conectar à IA agora. Tente novamente em instantes.",
        );
      }
      if (gemini.status === 429) {
        return fail("provider_rate_limited", "O limite gratuito da IA foi atingido neste momento. Tente novamente em alguns minutos.");
      }
      if (gemini.status < 200 || gemini.status >= 300) {
        console.error("gemini returned error status", gemini.status);
        return fail("provider_error", "A IA recusou a solicitação. Confira se a chave GEMINI_API_KEY está correta e ativa.");
      }
      const text = extractText(gemini.body);
      if (!text) return fail("empty_response", "A IA não retornou texto. Tente novamente.");
      return { ok: true, text, remaining: Math.max(DAILY_LIMIT - Number(used), 0) };
    } catch (err) {
      console.error("assistant-ai unexpected error", String(err));
      return fail("server_error", "Algo deu errado. Tente novamente.");
    }
  });
