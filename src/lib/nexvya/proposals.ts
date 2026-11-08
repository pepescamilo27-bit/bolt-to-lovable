import { uid } from "./ops";
import type { Proposal, ProposalInput, ProposalStatus } from "./types";

export type ProposalFieldErrors = Partial<Record<keyof ProposalInput, string>>;

export function validateProposal(input: ProposalInput): ProposalFieldErrors {
  const e: ProposalFieldErrors = {};
  if (!input.opportunityId) e.opportunityId = "Escolha a oportunidade (cliente) desta proposta.";
  const title = input.title.trim();
  if (!title) e.title = "Dê um nome para a proposta.";
  else if (title.length > 120) e.title = "Use no máximo 120 caracteres.";
  if (input.value === null || !Number.isFinite(input.value) || input.value < 0) e.value = "Informe um valor positivo.";
  if (input.description.length > 2000) e.description = "Use no máximo 2000 caracteres.";
  return e;
}

const clean = (i: ProposalInput) => ({
  opportunityId: i.opportunityId,
  title: i.title.trim(),
  description: i.description.trim(),
  value: i.value ?? 0,
});

export function createProposal(input: ProposalInput, now: string): Proposal {
  return { ...clean(input), id: uid(), status: "rascunho", sentAt: null, decidedAt: null, createdAt: now };
}

export function updateProposal(p: Proposal, input: ProposalInput): Proposal {
  return { ...p, ...clean(input) };
}

export function proposalSummary(list: Proposal[]) {
  const sumValue = (items: Proposal[]) => items.reduce((n, p) => n + p.value, 0);
  const sent = list.filter((p) => p.status === "enviada");
  const accepted = list.filter((p) => p.status === "aceita");
  const refused = list.filter((p) => p.status === "recusada");
  const decided = accepted.length + refused.length;
  return {
    sentCount: sent.length,
    sentValue: sumValue(sent),
    acceptedCount: accepted.length,
    acceptedValue: sumValue(accepted),
    refusedCount: refused.length,
    acceptanceRate: decided ? Math.round((accepted.length / decided) * 100) : null,
  };
}

export function changeProposalStatus(p: Proposal, status: ProposalStatus, now: string): Proposal {
  return {
    ...p,
    status,
    sentAt: status === "rascunho" ? null : (p.sentAt ?? now),
    decidedAt: status === "aceita" || status === "recusada" ? now : null,
  };
}
