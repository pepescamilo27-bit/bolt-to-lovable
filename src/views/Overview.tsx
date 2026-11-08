import { Link } from "@/lib/nexvya/nav";
import { AlertTriangle, CalendarCheck, CircleDollarSign, Plus, Send, Target, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CompleteActionDialog, RescheduleDialog } from "@/components/nexvya/ActionDialogs";
import { ActionItem } from "@/components/nexvya/ActionItem";
import { EmptyState, NativeSelect, PageHeader, Panel, StatCard } from "@/components/nexvya/common";
import { OnboardingTour } from "@/components/nexvya/OnboardingTour";
import { OpportunityFormDialog } from "@/components/nexvya/OpportunityFormDialog";
import { Button } from "@/components/ui/button";
import { brl, todayISO } from "@/lib/nexvya/dates";
import { monthlySeries, PERIODS, summary, type Period } from "@/lib/nexvya/metrics";
import { prioritized } from "@/lib/nexvya/rules";
import { proposalSummary } from "@/lib/nexvya/proposals";
import { actions, type NexvyaState } from "@/lib/nexvya/store";
import { STAGES, type Opportunity, type Stage } from "@/lib/nexvya/types";

export function Overview({ s }: { s: NexvyaState }) {
  const today = todayISO();
  const [period, setPeriod] = useState<Period>("30");
  const [stage, setStage] = useState<Stage | "todas">("todas");
  const [formOpen, setFormOpen] = useState(false);
  const [complete, setComplete] = useState<Opportunity | null>(null);
  const [resched, setResched] = useState<Opportunity | null>(null);

  const m = useMemo(() => summary(s.opportunities, today, period), [s, today, period]);
  const ps = useMemo(() => proposalSummary(s.proposals), [s.proposals]);
  const series = useMemo(() => monthlySeries(s.opportunities, today, 12), [s, today]);
  const topActions = useMemo(
    () => prioritized(s.opportunities, today, ["atrasadas", "hoje", "sem_agendamento"]).slice(0, 5),
    [s, today],
  );
  const stageItems = useMemo(() => {
    const list = stage === "todas" ? s.opportunities : s.opportunities.filter((o) => o.stage === stage);
    return [...list].sort((a, b) => (a.nextFollowUp ?? "9999").localeCompare(b.nextFollowUp ?? "9999"));
  }, [s, stage]);

  const tour = (
    <OnboardingTour
      open={!s.introDismissed}
      onFinish={() => actions.setIntroDismissed(true)}
      onCreateFirst={() => setFormOpen(true)}
    />
  );

  if (s.opportunities.length === 0) {
    return (
      <>
        <PageHeader title="Visão geral" description="Seu centro de comando comercial. Comece cadastrando um cliente em negociação." />
        <EmptyState
          icon={Target}
          title="Nenhuma oportunidade ainda"
          description="Cadastre sua primeira oportunidade para ver aqui o que precisa de atenção e qual é o próximo passo de cada cliente."
          action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Cadastrar primeira oportunidade</Button>}
        />
        <OpportunityFormDialog open={formOpen} onOpenChange={setFormOpen} />
        {tour}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="O que precisa de atenção agora e por quê."
        actions={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Nova oportunidade</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Abertas" value={m.openCount} icon={Target} hint={`${m.openWithValue} com valor`} />
        <StatCard label="Potencial" value={m.potentialValue === null ? "—" : brl(m.potentialValue)} icon={CircleDollarSign} tone="primary" hint="Soma das abertas com valor" />
        <StatCard label="Propostas em aberto" value={ps.sentCount} icon={Send} hint={ps.sentCount ? brl(ps.sentValue) : "Nenhuma aguardando resposta"} />
        <StatCard label="Atrasadas" value={m.overdue} icon={AlertTriangle} tone={m.overdue ? "danger" : "default"} hint={`${m.today} para hoje`} />
        <StatCard label="Ganhas (período)" value={m.wonCount} icon={Trophy} tone="success" hint={m.wonValue !== null ? brl(m.wonValue) : "sem valor"} />
      </div>

      <Panel
        className="mb-6 border-primary/30 bg-primary/5"
        title="O que devo fazer agora?"
        description={`${m.overdue} atrasado(s) · ${m.today} para hoje · ${m.unscheduled} sem data de acompanhamento`}
        action={<Link to="/acoes" className="text-sm text-primary hover:underline">Ver todas as ações</Link>}
      >
        {topActions.length ? (
          <ul className="grid gap-2">
            {topActions.map(({ o, e }) => (
              <ActionItem key={o.id} o={o} e={e} compact onComplete={setComplete} onReschedule={setResched} />
            ))}
          </ul>
        ) : (
          <EmptyState icon={CalendarCheck} title="Tudo em dia" description="Nenhum acompanhamento atrasado, para hoje ou sem data. Continue registrando seus contatos." />
        )}
      </Panel>

      <Panel
        className="mb-6"
        title="Evolução"
          description="Oportunidades criadas, ganhas e perdidas por mês."
          action={
            <NativeSelect className="w-auto" aria-label="Período" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
              {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </NativeSelect>
          }
        >
          {series.length >= 2 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} fontSize={11} width={28} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="criadas" name="Criadas" fill="var(--chart-4)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="ganhas" name="Ganhas" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="perdidas" name="Perdidas" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Ainda não há registros em meses diferentes suficientes para o gráfico.</p>
          )}
      </Panel>

      <Panel
        title="Oportunidades por etapa"
        action={
          <NativeSelect className="w-auto" aria-label="Filtrar etapa" value={stage} onChange={(e) => setStage(e.target.value as Stage | "todas")}>
            <option value="todas">Todas as etapas</option>
            {STAGES.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}
          </NativeSelect>
        }
      >
        {stageItems.length ? (
          <ul className="grid gap-2">
            {stageItems.slice(0, 8).map((o) => (
              <li key={o.id}>
                <Link to={`/oportunidades/${o.id}`} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40">
                  <div className="min-w-0">
                    <span className="font-semibold">{o.contact}</span>
                    <span className="text-sm text-muted-foreground"> · {o.product}</span>
                  </div>
                  <span className="shrink-0 text-sm tabular text-muted-foreground">{o.value !== null ? brl(o.value) : "—"}</span>
                </Link>
              </li>
            ))}
            {stageItems.length > 8 && (
              <li className="pt-1">
                <Link to="/oportunidades" className="text-sm text-primary hover:underline">Ver todas as {stageItems.length}</Link>
              </li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma oportunidade nesta etapa.</p>
        )}
      </Panel>

      <OpportunityFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <CompleteActionDialog opp={complete} onClose={() => setComplete(null)} />
      <RescheduleDialog opp={resched} onClose={() => setResched(null)} />
      {tour}
    </>
  );
}

export default Overview;
