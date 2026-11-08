import { Copy, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/nexvya/common";
import { Button } from "@/components/ui/button";
import { AI_TASK_LABELS, requestAi, type AiTask } from "@/lib/nexvya/aiClient";

type AiTaskId = Exclude<AiTask, "message">;
type Analysis = { opportunityId: string; task: AiTaskId; text: string; remaining: number };
type AiFailure = { opportunityId: string; code: string; message: string };

const TASKS = Object.keys(AI_TASK_LABELS) as AiTaskId[];

export function AiAssistantPanel({ opportunityId }: { opportunityId: string }) {
  const [busy, setBusy] = useState<AiTask | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [failure, setFailure] = useState<AiFailure | null>(null);

  useEffect(() => {
    setBusy(null);
    setAnalysis(null);
    setFailure(null);
  }, [opportunityId]);

  async function run(task: AiTaskId) {
    setBusy(task);
    setFailure(null);
    const res = await requestAi({ task, opportunityId });
    setBusy(null);
    if (!res.ok) {
      setAnalysis(null);
      setFailure({ opportunityId, code: res.code, message: res.message });
      return;
    }
    setAnalysis({ opportunityId, task, text: res.text, remaining: res.remaining });
  }

  const currentAnalysis = analysis?.opportunityId === opportunityId ? analysis : null;
  const currentFailure = failure?.opportunityId === opportunityId ? failure : null;

  function copyResult() {
    if (!currentAnalysis) return;
    navigator.clipboard.writeText(currentAnalysis.text);
    toast.success("Resposta copiada.");
  }

  return (
    <Panel title="Assistente com IA" action={<Sparkles className="h-4 w-4 text-primary" aria-hidden />}>
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          A IA lê os dados desta oportunidade e sugere caminhos. Confira antes de agir.
        </p>

        <div className="grid gap-2 sm:grid-cols-3">
          {TASKS.map((task) => (
            <Button
              key={task}
              variant="outline"
              disabled={busy !== null}
              onClick={() => run(task)}
              className="h-auto whitespace-normal py-2.5"
            >
              {busy === task ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {AI_TASK_LABELS[task]}
            </Button>
          ))}
        </div>

        {busy && (
          <div role="status" className="flex items-center gap-2 rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> A IA está analisando os dados...
          </div>
        )}

        {currentFailure && (
          <div
            role="alert"
            className={
              currentFailure.code === "ai_not_configured"
                ? "rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm"
                : "rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            }
          >
            {currentFailure.code === "ai_not_configured" && <p className="font-medium text-foreground">IA não ativada</p>}
            <p className={currentFailure.code === "ai_not_configured" ? "mt-1 text-foreground" : undefined}>
              {currentFailure.message}
            </p>
          </div>
        )}

        {currentAnalysis && !busy && (
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{AI_TASK_LABELS[currentAnalysis.task]}</p>
              <Button size="sm" variant="outline" onClick={copyResult}>
                <Copy className="h-4 w-4" /> Copiar
              </Button>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-muted/60 p-4 font-sans text-sm leading-relaxed">{currentAnalysis.text}</pre>
            <p className="text-xs text-muted-foreground">Análises de IA restantes hoje: {currentAnalysis.remaining}.</p>
          </div>
        )}
      </div>
    </Panel>
  );
}
