import { useState } from "react";
import { Link, useNavigate } from "@/lib/nexvya/nav";
import { Check, FileText, Pencil, Plus, RotateCcw, Send, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/nexvya/ActionDialogs";
import { EmptyState, NativeSelect, PageHeader, ProposalStatusBadge, StatCard, StoreGate } from "@/components/nexvya/common";
import { ProposalFormDialog } from "@/components/nexvya/ProposalFormDialog";
import { Button } from "@/components/ui/button";
import { brl, dateOf, fmtDate } from "@/lib/nexvya/dates";
import { proposalSummary } from "@/lib/nexvya/proposals";
import { actions, type NexvyaState } from "@/lib/nexvya/store";
import { PROPOSAL_STATUSES, type Proposal, type ProposalStatus } from "@/lib/nexvya/types";

export function Propostas() {
  return <StoreGate>{(s) => <PropostasContent s={s} />}</StoreGate>;
}

function PropostasContent({ s }: { s: NexvyaState }) {
  const nav = useNavigate();
  const [filter, setFilter] = useState<ProposalStatus | "todas">("todas");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Proposal | undefined>(undefined);
  const [toDelete, setToDelete] = useState<Proposal | null>(null);

  const summary = proposalSummary(s.proposals);
  const list = filter === "todas" ? s.proposals : s.proposals.filter((p) => p.status === filter);
  const oppById = new Map(s.opportunities.map((o) => [o.id, o]));

  function openNew() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(p: Proposal) {
    setEditing(p);
    setFormOpen(true);
  }

  const noClients = s.opportunities.length === 0;

  return (
    <>
      <PageHeader
        title="Propostas"
        description="Acompanhe o que foi enviado e registre quando o cliente aceitar ou recusar."
        actions={
          <Button onClick={openNew} disabled={noClients}>
            <Plus className="h-4 w-4" /> Nova proposta
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Aguardando resposta" value={summary.sentCount} icon={Send} tone="primary" hint={summary.sentCount ? brl(summary.sentValue) : "Nenhuma proposta enviada"} />
        <StatCard label="Aceitas" value={summary.acceptedCount} icon={Check} tone="success" hint={summary.acceptedCount ? brl(summary.acceptedValue) : "Nenhuma aceita ainda"} />
        <StatCard label="Recusadas" value={summary.refusedCount} icon={X} tone={summary.refusedCount ? "danger" : "default"} hint="Registradas por você" />
        <StatCard label="Taxa de aceite" value={summary.acceptanceRate === null ? "—" : `${summary.acceptanceRate}%`} icon={FileText} hint="Aceitas em relação às decididas" />
      </div>

      {noClients ? (
        <EmptyState
          icon={FileText}
          title="Cadastre um cliente primeiro"
          description="Cada proposta precisa estar ligada a uma oportunidade. Cadastre um cliente para começar."
          action={<Button variant="outline" onClick={() => nav("/oportunidades")}>Ir para oportunidades</Button>}
        />
      ) : s.proposals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma proposta ainda"
          description="Crie uma proposta para registrar o valor oferecido e acompanhar a resposta do cliente."
          action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Criar primeira proposta</Button>}
        />
      ) : (
        <>
          <div className="mb-4 max-w-xs">
            <NativeSelect aria-label="Filtrar por status" value={filter} onChange={(e) => setFilter(e.target.value as ProposalStatus | "todas")}>
              <option value="todas">Todos os status</option>
              {PROPOSAL_STATUSES.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}
            </NativeSelect>
          </div>

          {list.length === 0 ? (
            <EmptyState icon={FileText} title="Nenhuma proposta neste status" description="Escolha outro status para ver as demais propostas." />
          ) : (
            <ul className="grid gap-3">
              {list.map((p) => {
                const opp = oppById.get(p.opportunityId);
                return (
                  <li key={p.id} className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-card sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{p.title}</span>
                        <ProposalStatusBadge status={p.status} />
                      </div>
                      <p className="mt-1 text-sm">
                        {opp ? (
                          <Link to={`/oportunidades/${opp.id}`} className="text-muted-foreground hover:text-primary hover:underline">{opp.contact}</Link>
                        ) : (
                          <span className="text-muted-foreground">Cliente removido</span>
                        )}
                        <span className="text-muted-foreground"> · </span>
                        <span className="font-medium tabular">{brl(p.value)}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Criada em {fmtDate(dateOf(p.createdAt))}
                        {p.sentAt && ` · enviada em ${fmtDate(dateOf(p.sentAt))}`}
                        {p.decidedAt && ` · respondida em ${fmtDate(dateOf(p.decidedAt))}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusActions p={p} />
                      <Button size="icon" variant="ghost" aria-label="Editar proposta" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Excluir proposta" onClick={() => setToDelete(p)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <ProposalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        proposal={editing}
        opportunities={s.opportunities}
      />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => { if (!v) setToDelete(null); }}
        title="Excluir esta proposta?"
        description="A proposta será removida da lista. Esta ação não pode ser desfeita."
        confirmLabel="Excluir proposta"
        onConfirm={() => {
          if (toDelete) actions.removeProposal(toDelete.id);
          setToDelete(null);
        }}
      />
    </>
  );
}

function StatusActions({ p }: { p: Proposal }) {
  if (p.status === "rascunho") {
    return (
      <Button size="sm" onClick={() => actions.setProposalStatus(p.id, "enviada")}>
        <Send className="h-4 w-4" /> Marcar como enviada
      </Button>
    );
  }
  if (p.status === "enviada") {
    return (
      <>
        <Button size="sm" onClick={() => actions.setProposalStatus(p.id, "aceita")}>
          <Check className="h-4 w-4" /> Aceita
        </Button>
        <Button size="sm" variant="outline" onClick={() => actions.setProposalStatus(p.id, "recusada")}>
          <X className="h-4 w-4" /> Recusada
        </Button>
      </>
    );
  }
  return (
    <Button size="sm" variant="ghost" onClick={() => actions.setProposalStatus(p.id, "enviada")}>
      <RotateCcw className="h-4 w-4" /> Voltar para enviada
    </Button>
  );
}

export default Propostas;
