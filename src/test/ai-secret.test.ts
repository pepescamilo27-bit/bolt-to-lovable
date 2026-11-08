import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    middleware: () => ({
      inputValidator: () => ({ handler: (handler: unknown) => handler }),
    }),
  }),
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));

import { runAssistantAi } from "@/lib/nexvya/ai.functions";

// Exercise the real handler's configuration check without calling Gemini or consuming quota.
const handler = runAssistantAi as unknown as (args: {
  data: unknown;
  context: { supabase: unknown; userId: string };
}) => Promise<{ ok: boolean; code?: string }>;

afterEach(() => vi.unstubAllEnvs());

describe("Gemini secret names", () => {
  it.each(["GEMINIAPIKEY", "GEMINI_API_KEY"])("recognizes %s inside the backend handler", async (name) => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GEMINIAPIKEY", "");
    vi.stubEnv(name, "test-only-credential");
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }) };

    const result = await handler({
      data: { task: "analyze", opportunityId: "00000000-0000-0000-0000-000000000000" },
      context: { supabase, userId: "test-user" },
    });

    expect(result).toEqual({ ok: false, code: "not_found", message: "Oportunidade não encontrada." });
    expect(maybeSingle).toHaveBeenCalledOnce();
  });

  it("reports missing configuration when neither name is set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GEMINIAPIKEY", "");
    const result = await handler({
      data: { task: "analyze", opportunityId: "00000000-0000-0000-0000-000000000000" },
      context: { supabase: {}, userId: "test-user" },
    });
    expect(result.code).toBe("ai_not_configured");
  });
});