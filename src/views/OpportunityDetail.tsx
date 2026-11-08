import { Link, useNavigate, useParams } from "@/lib/nexvya/nav";
import { ArrowLeft, CalendarClock, Check, Pencil, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CompleteActionDialog, ConfirmDialog, LossReasonDialog, RescheduleDialog } from "@/components/nexvya/ActionDialogs";
import { DemoTag, EmptyState, NativeSelect, Panel, StageBadge, StoreGate } from "@/components/nexvya/common";
import { OpportunityFormDialog } from "@/components/nexvya/OpportunityFormDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { missingInfo, recommendedAction } from "@/lib/nexvya/assistant";
import { brl, fmtDate, fmtDateTime, todayISO } from "@/lib/nexvya/dates";
import { explain } from "@/lib/nexvya/rules";
import { actions } from "@/lib/nexvya/store";
import { isClosed, STAGES, type ActivityType, type Opportunity, type Stage } from "@/lib/nexvya/types";

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  criado: "Criado",
  etapa: "Etapa",
  nota: "Nota",
  acao_concluida: "Ação concluída",
  reagendado: "Reagendado",
  objecao: "Objeção",
  editado: "Editado",
};

export function OpportunityDetail() {
  const { id } = useParams();
  return (
    <StoreGate>
      {(s) => {
        const o = s.opportunities.find((x) => x.id === id);
        if (!o)
          return (
            <EmptyState
              icon={Trash2}
              title="Oportunidade não encontrada"
              description="Ela pode ter sido excluída ou o link está incorreto."
              action={<Button asChild><Link to="/oportunidades">Voltar às oportunidades</Link></Button>}
            />
          );
        return <Detail o={o} />;
      }}
    </StoreGate>
  );
}

function Detail({ o }: { o: Opportunity }) {
  const today = todayISO();
  const nav = useNavigate();
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [complete, setComplete] = useState(false);
  const [resched, setResched] = useState(false);
  const [lose, setLose] = useState(false);
  const [note, setNote] = useState("");
  const [stage, setStage] = useState<Stage>(o.stage);

  const ex = explain(o, today);
  const insights = missingInfo(o, today);
  const rec = recommendedAction(o);
  const closed = isClosed(o.stage);

  function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    actions.addActivity(o.id, "nota", note.trim());
    setNote("");
    toast.success("Nota adicionada ao histórico.");
  }

  function changeStage(st: Stage) {
    setStage(st);
    if (st === "perdido") return setLose(true);
    actions.moveStage(o.id, st);
    toast.success(`Etapa alterada para ${STAGES.find((s) => s.id === st)?.label}.`);
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => nav("/oportunidades")} className="mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold md:text-3xl">{o.contact}</h1>
            <StageBadge stage={o.stage} />
            {o.demo && <DemoTag />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {o.product}{o.company && ` · ${o.company}`}{o.value !== null && ` · ${brl(o.value)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /> Editar</Button>
          {!closed && (
            <>
              <Button size="sm" onClick={() => setComplete(true)}><Check className="h-4 w-4" /> Concluir ação</Button>
              <Button variant="outline" size="sm" onClick={() => setResched(true)}><CalendarClock className="h-4 w-4" /> Reagendar</Button>
            </>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/assistente?id=${o.id}`}><Sparkles className="h-4 w-4" /> Assistente</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDel(true)} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4">
          <Panel title="Resumo">
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Etapa</dt><dd>
                <NativeSelect value={stage} onChange={(e) => changeStage(e.target.value as Stage)} className="h-8 w-auto text-sm">
                  {STAGES.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}
                </NativeSelect>
              </dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Valor</dt><dd className="tabular">{o.value === null ? "—" : brl(o.value)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Último contato</dt><dd className="tabular">{fmtDate(o.lastContact)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Próximo acomp.</dt><dd className="tabular">{fmtDate(o.nextFollowUp)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="shrink-0 text-muted-foreground">Próxima ação</dt><dd className="text-right">{o.nextAction || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Criada em</dt><dd className="tabular">{fmtDateTime(o.createdAt)}</dd></div>
              {o.closedAt && <div className="flex justify-between"><dt className="text-muted-foreground">Fechada em</dt><dd className="tabular">{fmtDateTime(o.closedAt)}</dd></div>}
            </dl>
          </Panel>

          {o.lossReason && (
            <Panel title="Motivo da perda">
              <p className="text-sm text-muted-foreground">{o.lossReason}</p>
            </Panel>
          )}

          <Panel title="Observações">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{o.notes || "Sem observações."}</p>
          </Panel>
        </div>

        <div className="lg:col-span-2 grid gap-4">
          {!closed && (
            <Panel title="Sugestões do assistente" action={<Sparkles className="h-4 w-4 text-primary" />}>
              {ex && (
                <div className="mb-3 rounded-lg bg-muted/60 p-3 text-sm">
                  <p className="font-medium">{ex.headline}</p>
                  <p className="mt-1 text-muted-foreground">{ex.reasons.join(" ")}</p>
                </div>
              )}
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">Ação recomendada: {rec.action}</p>
                <p className="mt-1 text-muted-foreground">{rec.why}</p>
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
          )}

          <Panel title="Histórico">
            <form onSubmit={addNote} className="mb-4 flex gap-2">
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Adicionar nota ao histórico..."
                className="text-sm"
              />
              <Button type="submit" size="sm" className="shrink-0">Adicionar</Button>
            </form>
            <ol className="grid gap-3">
              {o.activities.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {ACTIVITY_LABEL[a.type]}
                  </span>
                  <div>
                    <p>{a.text}</p>
                    <p className="text-xs text-muted-foreground">{fmtDateTime(a.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>

      <OpportunityFormDialog open={edit} onOpenChange={setEdit} opportunity={o} />
      <ConfirmDialog
        open={del}
        onOpenChange={setDel}
        title="Excluir oportunidade?"
        description={`A oportunidade "${o.contact}" e todo o seu histórico serão apagados. Não é possível desfazer.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          actions.remove(o.id);
          toast.success("Oportunidade excluída.");
          nav("/oportunidades");
        }}
      />
      {complete && <CompleteActionDialog opp={o} onClose={() => setComplete(false)} />}
      {resched && <RescheduleDialog opp={o} onClose={() => setResched(false)} />}
      <LossReasonDialog opp={lose ? o : null} onClose={() => setLose(false)} />
    </>
  );
}

export default OpportunityDetail;
