import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json, TablesInsert } from "@/integrations/supabase/types";
import { todayISO } from "./dates";
import { buildDemo } from "./demo";
import * as ops from "./ops";
import * as proposalOps from "./proposals";
import type { ActivityType, Opportunity, OpportunityInput, Proposal, ProposalInput, ProposalStatus, Stage } from "./types";

export interface NexvyaState {
  opportunities: Opportunity[];
  proposals: Proposal[];
  introDismissed: boolean;
}

const listeners = new Set<() => void>();
let state: NexvyaState | null = null;
let loading = false;
let currentUserId: string | null = null;

// ── DB row ↔ Opportunity conversion ──

interface DbRow {
  id: string;
  contact: string;
  company: string;
  product: string;
  value: number | null;
  stage: string;
  last_contact: string | null;
  next_follow_up: string | null;
  next_action: string;
  notes: string;
  loss_reason: string;
  activities: { id: string; type: string; text: string; at: string }[];
  created_at: string;
  closed_at: string | null;
  demo: boolean | null;
  user_id: string | null;
}

function rowToOpp(row: DbRow): Opportunity {
  return {
    id: row.id,
    contact: row.contact,
    company: row.company ?? "",
    product: row.product,
    value: row.value === null ? null : Number(row.value),
    stage: row.stage as Stage,
    lastContact: row.last_contact,
    nextFollowUp: row.next_follow_up,
    nextAction: row.next_action ?? "",
    notes: row.notes ?? "",
    lossReason: row.loss_reason ?? "",
    activities: (row.activities ?? []).map((a) => ({
      id: a.id,
      type: a.type as ActivityType,
      text: a.text,
      at: a.at,
    })),
    createdAt: row.created_at,
    closedAt: row.closed_at,
    demo: row.demo ?? false,
  };
}

function oppToRow(o: Opportunity): TablesInsert<"opportunities"> {
  return {
    id: o.id,
    contact: o.contact,
    company: o.company,
    product: o.product,
    value: o.value,
    stage: o.stage,
    last_contact: o.lastContact,
    next_follow_up: o.nextFollowUp,
    next_action: o.nextAction,
    notes: o.notes,
    loss_reason: o.lossReason,
    activities: o.activities as unknown as Json,
    created_at: o.createdAt,
    closed_at: o.closedAt,
    demo: o.demo ?? false,
  };
}

interface ProposalRow {
  id: string;
  opportunity_id: string;
  title: string;
  description: string;
  value: number | string;
  status: string;
  sent_at: string | null;
  decided_at: string | null;
  created_at: string;
}

function rowToProposal(row: ProposalRow): Proposal {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    title: row.title,
    description: row.description ?? "",
    value: Number(row.value),
    status: row.status as ProposalStatus,
    sentAt: row.sent_at,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
  };
}

function proposalToRow(p: Proposal): TablesInsert<"proposals"> {
  return {
    id: p.id,
    opportunity_id: p.opportunityId,
    title: p.title,
    description: p.description,
    value: p.value,
    status: p.status,
    sent_at: p.sentAt,
    decided_at: p.decidedAt,
    created_at: p.createdAt,
  };
}

// ── DB helpers ──

async function loadFromDb(): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DbRow[]).map(rowToOpp);
}

async function loadProposals(): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ProposalRow[]).map(rowToProposal);
}

async function loadIntroDismissed(): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("intro_dismissed")
    .maybeSingle();
  if (error || !data) return false;
  return data.intro_dismissed;
}

async function dbUpsert(o: Opportunity) {
  const { error } = await supabase.from("opportunities").upsert(oppToRow(o));
  if (error) toast.error("Falha ao salvar no banco de dados.");
}

async function dbUpsertMany(oppList: Opportunity[]) {
  const { error } = await supabase
    .from("opportunities")
    .upsert(oppList.map(oppToRow));
  if (error) toast.error("Falha ao salvar no banco de dados.");
}

async function dbDelete(id: string) {
  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  if (error) toast.error("Falha ao excluir no banco de dados.");
}

async function dbDeleteMany(ids: string[]) {
  const { error } = await supabase.from("opportunities").delete().in("id", ids);
  if (error) toast.error("Falha ao excluir no banco de dados.");
}

async function dbUpsertProposal(p: Proposal) {
  const { error } = await supabase.from("proposals").upsert(proposalToRow(p));
  if (error) toast.error("Falha ao salvar a proposta no banco de dados.");
}

async function dbDeleteProposal(id: string) {
  const { error } = await supabase.from("proposals").delete().eq("id", id);
  if (error) toast.error("Falha ao excluir a proposta no banco de dados.");
}

// ── Store core ──

function emit() {
  listeners.forEach((l) => l());
}

async function initForUser(userId: string) {
  if (loading) return;
  if (currentUserId === userId && state) return;
  currentUserId = userId;
  loading = true;
  state = null;
  emit();
  try {
    const opportunities = await loadFromDb();
    const proposals = await loadProposals();
    const introDismissed = await loadIntroDismissed();
    state = { opportunities, proposals, introDismissed };
    emit();
  } catch {
    toast.error("Não foi possível carregar seus dados. Atualize a página para tentar novamente.");
    state = { opportunities: [], proposals: [], introDismissed: false };
    emit();
  } finally {
    loading = false;
  }
}

function resetStore() {
  state = null;
  currentUserId = null;
  loading = false;
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const EMPTY_STATE: NexvyaState = { opportunities: [], proposals: [], introDismissed: false };

function getSnapshot(): NexvyaState {
  return state ?? EMPTY_STATE;
}

/** Returns null before the store has loaded from the database. */
export function useNexvya(): NexvyaState | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

const now = () => new Date().toISOString();

function setLocal(fn: (s: NexvyaState) => NexvyaState) {
  state = fn(state ?? EMPTY_STATE);
  emit();
}

const mapOne = (id: string, fn: (o: Opportunity) => Opportunity) => {
  let updated: Opportunity | null = null;
  setLocal((s) => ({
    ...s,
    opportunities: s.opportunities.map((o) => {
      if (o.id === id) {
        updated = fn(o);
        return updated;
      }
      return o;
    }),
  }));
  if (updated) dbUpsert(updated);
};

const mapProposal = (id: string, fn: (p: Proposal) => Proposal) => {
  let updated: Proposal | null = null;
  setLocal((s) => ({
    ...s,
    proposals: s.proposals.map((p) => {
      if (p.id === id) {
        updated = fn(p);
        return updated;
      }
      return p;
    }),
  }));
  if (updated) dbUpsertProposal(updated);
};

export const actions = {
  create(input: OpportunityInput) {
    const o = ops.createOpportunity(input, now());
    setLocal((s) => ({ ...s, opportunities: [o, ...s.opportunities] }));
    dbUpsert(o);
    return o;
  },
  update: (id: string, input: OpportunityInput) => mapOne(id, (o) => ops.updateOpportunity(o, input, now())),
  remove: (id: string) => {
    setLocal((s) => ({
      ...s,
      opportunities: s.opportunities.filter((o) => o.id !== id),
      proposals: s.proposals.filter((p) => p.opportunityId !== id),
    }));
    dbDelete(id);
  },
  moveStage: (id: string, stage: Stage, lossReason = "") => mapOne(id, (o) => ops.changeStage(o, stage, now(), lossReason)),
  completeAction: (id: string, args: { result: string; nextFollowUp: string | null; nextAction: string }) =>
    mapOne(id, (o) => ops.completeAction(o, args, now(), todayISO())),
  reschedule: (id: string, date: string, note = "") => mapOne(id, (o) => ops.reschedule(o, date, note, now())),
  addActivity: (id: string, type: ActivityType, text: string) => mapOne(id, (o) => ops.addActivity(o, type, text, now())),
  setNextStep: (id: string, nextAction: string, nextFollowUp: string | null) =>
    mapOne(id, (o) => ({ ...o, nextAction, nextFollowUp })),
  removeDemo: () => {
    const demoIds = (state?.opportunities ?? []).filter((o) => o.demo).map((o) => o.id);
    setLocal((s) => ({
      ...s,
      opportunities: s.opportunities.filter((o) => !o.demo),
      proposals: s.proposals.filter((p) => !demoIds.includes(p.opportunityId)),
    }));
    if (demoIds.length) dbDeleteMany(demoIds);
  },
  loadDemo: () => {
    const demo = buildDemo(todayISO());
    setLocal((s) => ({ ...s, opportunities: [...s.opportunities.filter((o) => !o.demo), ...demo] }));
    dbUpsertMany(demo);
  },
  clearAll: () => {
    const allIds: string[] = [];
    setLocal((s) => {
      allIds.push(...s.opportunities.map((o) => o.id));
      return { ...s, opportunities: [], proposals: [] };
    });
    if (allIds.length) dbDeleteMany(allIds);
  },
  setIntroDismissed: (v: boolean) => {
    setLocal((s) => ({ ...s, introDismissed: v }));
    if (!currentUserId) return;
    supabase
      .from("user_preferences")
      .upsert({ user_id: currentUserId, intro_dismissed: v })
      .then(({ error }) => {
        if (error) toast.error("Não foi possível salvar sua preferência.");
      });
  },
  createProposal: (input: ProposalInput) => {
    const p = proposalOps.createProposal(input, now());
    setLocal((s) => ({ ...s, proposals: [p, ...s.proposals] }));
    dbUpsertProposal(p);
    return p;
  },
  updateProposal: (id: string, input: ProposalInput) => mapProposal(id, (p) => proposalOps.updateProposal(p, input)),
  setProposalStatus: (id: string, status: ProposalStatus) =>
    mapProposal(id, (p) => proposalOps.changeProposalStatus(p, status, now())),
  removeProposal: (id: string) => {
    setLocal((s) => ({ ...s, proposals: s.proposals.filter((p) => p.id !== id) }));
    dbDeleteProposal(id);
  },
  exportJSON: () => JSON.stringify(getSnapshot(), null, 2),
};

export const store = { initForUser, resetStore };
