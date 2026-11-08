import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardList, Columns3, Plus, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Target,
    title: "Bem-vindo à Nexvya",
    text: "A Nexvya organiza suas vendas, mostra quais clientes precisam de atenção e indica o próximo passo de cada negociação. Leva cerca de um minuto para entender.",
    example: null,
  },
  {
    icon: Plus,
    title: "Cadastre sua primeira oportunidade",
    text: "Cada cliente em negociação vira uma oportunidade. Informe o contato, o produto, o valor estimado e a próxima ação.",
    example: "Maria Souza · Plano anual · R$ 4.800 · Enviar proposta até sexta",
  },
  {
    icon: ClipboardList,
    title: "Acompanhe cada cliente",
    text: "Agende a data do próximo contato. A seção “O que devo fazer agora?” mostra o que está atrasado, o que é para hoje e o que ainda não tem data.",
    example: null,
  },
  {
    icon: Columns3,
    title: "Registre contatos e propostas",
    text: "Dentro de cada oportunidade, registre conversas, objeções e propostas enviadas. Ao mover o cliente pelas etapas, o histórico fica salvo.",
    example: null,
  },
  {
    icon: Sparkles,
    title: "Use o Assistente",
    text: "O Assistente sugere o próximo passo e cria rascunhos de mensagem a partir dos seus registros. Ele não envia nada: você copia o texto e envia pelo seu canal.",
    example: null,
  },
];

export function OnboardingTour({
  open,
  onFinish,
  onCreateFirst,
}: {
  open: boolean;
  onFinish: () => void;
  onCreateFirst: () => void;
}) {
  const [step, setStep] = useState(0);
  const current = STEPS[step] ?? STEPS[0]!;
  const last = step === STEPS.length - 1;
  const Icon = current.icon;

  function close() {
    setStep(0);
    onFinish();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Icon className="h-5 w-5" />
          </span>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{current.text}</DialogDescription>
        </DialogHeader>

        {current.example && (
          <div className="animate-rise rounded-lg border border-dashed bg-muted/50 px-4 py-3 text-sm">
            <p className="text-xs font-medium text-muted-foreground">Exemplo</p>
            <p className="mt-1">{current.example}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5" aria-label={`Passo ${step + 1} de ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`Ir para o passo ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60",
              )}
            />
          ))}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={close} className="text-muted-foreground">
            Pular tutorial
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            )}
            {last ? (
              <Button variant="outline" onClick={() => { close(); onCreateFirst(); }}>
                <Plus className="h-4 w-4" /> Cadastrar agora
              </Button>
            ) : (
              <Button onClick={() => setStep(step + 1)}>
                Próximo <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {last && (
              <Button onClick={close}>
                <Check className="h-4 w-4" /> Concluir
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
