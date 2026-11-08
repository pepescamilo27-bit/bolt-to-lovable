import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { validateProposal, type ProposalFieldErrors } from "@/lib/nexvya/proposals";
import { actions } from "@/lib/nexvya/store";
import type { Opportunity, Proposal } from "@/lib/nexvya/types";
import { Field, NativeSelect } from "./common";

interface FormState {
  opportunityId: string;
  title: string;
  description: string;
  valueText: string;
}

const blank = (opportunityId: string): FormState => ({ opportunityId, title: "", description: "", valueText: "" });

export function ProposalFormDialog({
  open,
  onOpenChange,
  proposal,
  opportunities,
  defaultOpportunityId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proposal?: Proposal | undefined;
  opportunities: Opportunity[];
  defaultOpportunityId?: string;
}) {
  const [v, setV] = useState<FormState>(blank(""));
  const [errors, setErrors] = useState<ProposalFieldErrors>({});

  useEffect(() => {
    if (!open) return;
    setV(
      proposal
        ? {
            opportunityId: proposal.opportunityId,
            title: proposal.title,
            description: proposal.description,
            valueText: String(proposal.value).replace(".", ","),
          }
        : blank(defaultOpportunityId ?? opportunities[0]?.id ?? ""),
    );
    setErrors({});
  }, [open, proposal, defaultOpportunityId, opportunities]);

  const up = <K extends keyof FormState>(k: K, val: FormState[K]) => setV((s) => ({ ...s, [k]: val }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = v.valueText.trim();
    const raw = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
    const input = {
      opportunityId: v.opportunityId,
      title: v.title,
      description: v.description,
      value: raw === "" ? null : Number(raw),
    };
    const errs = validateProposal(input);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (proposal) {
      actions.updateProposal(proposal.id, input);
    } else {
      actions.createProposal(input);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{proposal ? "Editar proposta" : "Nova proposta"}</DialogTitle>
          <DialogDescription>Associe a proposta a um cliente e informe o valor oferecido.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <Field label="Cliente (oportunidade)" htmlFor="p-opp" error={errors.opportunityId}>
            <NativeSelect id="p-opp" value={v.opportunityId} onChange={(e) => up("opportunityId", e.target.value)}>
              {!v.opportunityId && <option value="">Escolha um cliente...</option>}
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.contact}
                  {o.company ? ` · ${o.company}` : ""} — {o.product}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da proposta" htmlFor="p-title" error={errors.title}>
              <Input id="p-title" value={v.title} onChange={(e) => up("title", e.target.value)} placeholder="Ex.: Plano anual" autoFocus />
            </Field>
            <Field label="Valor (R$)" htmlFor="p-value" error={errors.value}>
              <Input id="p-value" inputMode="decimal" value={v.valueText} onChange={(e) => up("valueText", e.target.value)} placeholder="Ex.: 4800" />
            </Field>
          </div>
          <Field label="Descrição" htmlFor="p-desc" error={errors.description} optional hint="O que está incluído, condições e prazos.">
            <Textarea id="p-desc" rows={3} value={v.description} onChange={(e) => up("description", e.target.value)} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{proposal ? "Salvar alterações" : "Criar proposta"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
