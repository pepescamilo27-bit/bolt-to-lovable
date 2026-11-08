import { Link, useSearchParams } from "@/lib/nexvya/nav";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AiAssistantPanel } from "@/components/nexvya/AiAssistantPanel";
import { EmptyState, Field, NativeSelect, PageHeader, Panel, StageBadge, StoreGate } from "@/components/nexvya/common";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { missingInfo, PURPOSES, recommendedAction, ruleBasedProvider, type DraftPurpose } from "@/lib/nexvya/assistant";
import { aiProvider } from "@/lib/nexvya/aiClient";
import { todayISO } from "@/lib/nexvya/dates";
import type { NexvyaState } from "@/lib/nexvya/store";
import { isClosed } from "@/lib/nexvya/types";

export function Assistant() {
  return (
    <StoreGate>
      {(s) => <AssistantContent s={s} />}
    </StoreGate>
  );
}

function AssistantContent({ s }: { s: NexvyaState }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = todayISO();
  const idParam = searchParams.get("id");
  const id = idParam && s.opportunities.some((o) => o.id === idParam) ? idParam : "";
  const o = s.opportunities.find((x) => x.id === id);

  const [purpose, setPurpose] = useState<DraftPurpose>("acompanhamento");
  const [context, setContext] = useState("");
  const [formal, setFormal] = useState(true);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [aiDrafting, setAiDrafting] = useState(false);

  useEffect(() => {
    setDraft("");
    setEditing(false);
    setContext("");
  }, [id]);

  if (s.opportunities.length === 0) {
    return (
      <>
        <PageHeader title="Assistente" />
        <EmptyState icon={Sparkles} title="Sem oportunidades" description="Cadastre oportunidades para receber sugestões de próximos passos e rascunhos de mensagem." />
      </>
    );
  }

  function selectId(newId: string) {
    if (newId) setSearchParams({ id: newId });
    else setSearchParams({});
  }

  async function generate() {
    if (!o) return;
    const res = await ruleBasedProvider.draftMessage({ opportunity: o, purpose, context, formal });
    if (!res.ok) { toast.error(res.message); return; }
    setDraft(res.text);
    setEditing(false);
  }

  async function generateWithAi() {
    if (!o) return;
    setAiDrafting(true);
    const res = await aiProvider.draftMessage({ opportunity: o, purpose, context, formal });
    setAiDrafting(false);
    if (!res.ok) { toast.error(res.message); return; }
    setDraft(res.text);
    setEditing(false);
  }

  function copyDraft() {
    const text = editing ? editedText : draft;
    navigator.clipboard.writeText(text);
    toast.success("Mensagem copiada.");
  }

  const insights = o ? missingInfo(o, today) : [];
  const rec = o ? recommendedAction(o) : null;

  return (
    <>
      <PageHeader title="Assistente comercial" description="Sugestões baseadas nos seus registros. Nada é enviado automaticamente." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid gap-4">
          <Panel title="Selecionar oportunidade">
            <Field label="Oportunidade" htmlFor="a-opp">
              <NativeSelect id="a-opp" value={id} onChange={(e) => selectId(e.target.value)}>
                <option value="">Escolha uma oportunidade...</option>
                {s.opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>{opp.contact} — {opp.product}{isClosed(opp.stage) ? ` (${opp.stage})` : ""}</option>
                ))}
              </NativeSelect>
            </Field>
          </Panel>

          {o ? (
            <>
              <Panel title="Situação">
                <div className="flex items-center gap-2 mb-3">
                  <Link to={`/oportunidades/${o.id}`} className="font-semibold hover:text-primary hover:underline">{o.contact}</Link>
                  <StageBadge stage={o.stage} />
                </div>
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">Ação recomendada: {rec?.action}</p>
                  <p className="mt-1 text-muted-foreground">{rec?.why}</p>
                </div>
                {insights.length > 0 && (
                  <ul className="mt-3 grid gap-1.5">
                    {insights.map((ins, i) => (
                      <li key={i} className={ins.level === "atencao" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
                        • {ins.text}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <AiAssistantPanel opportunityId={o.id} />

              <Panel title="Gerar rascunho de mensagem">
                <div className="grid gap-4">
                  <Field label="Tipo de mensagem" htmlFor="a-purpose">
                    <NativeSelect id="a-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value as DraftPurpose)}>
                      {PURPOSES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </NativeSelect>
                  </Field>
                  {PURPOSES.find((p) => p.id === purpose)?.needsContext && (
                    <Field label="Contexto" htmlFor="a-context" hint="Descreva a objeção ou situação.">
                      <Textarea id="a-context" rows={2} value={context} onChange={(e) => setContext(e.target.value)} placeholder="Ex.: achou o preço alto" />
                    </Field>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch id="a-formal" checked={formal} onCheckedChange={setFormal} />
                    <label htmlFor="a-formal" className="text-sm">Tom formal</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={generate}><Sparkles className="h-4 w-4" /> Gerar rascunho</Button>
                    <Button variant="outline" onClick={generateWithAi} disabled={aiDrafting}>
                      {aiDrafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Gerar com IA
                    </Button>
                  </div>
                </div>
              </Panel>
            </>
          ) : (
            <EmptyState icon={Sparkles} title="Selecione uma oportunidade" description="Escolha uma oportunidade para ver sugestões e gerar rascunhos de mensagem." />
          )}
        </div>

        <div className="grid gap-4">
          {draft ? (
            <Panel title="Rascunho" action={<Button size="sm" variant="outline" onClick={copyDraft}><Copy className="h-4 w-4" /> Copiar</Button>}>
              {editing ? (
                <div className="grid gap-3">
                  <Textarea rows={12} value={editedText} onChange={(e) => setEditedText(e.target.value)} className="text-sm" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setDraft(editedText); setEditing(false); }}>Salvar</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  <pre className="whitespace-pre-wrap rounded-lg bg-muted/60 p-4 text-sm font-sans">{draft}</pre>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(true); setEditedText(draft); }}>Editar</Button>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">A Nexvya não envia mensagens. Copie e envie pelo canal que preferir (WhatsApp, email, etc.).</p>
            </Panel>
          ) : (
            <Panel title="Rascunho">
              <EmptyState icon={Sparkles} title="Nenhum rascunho gerado" description="Selecione uma oportunidade e clique em Gerar rascunho." />
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

export default Assistant;
