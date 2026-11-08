import { Database, Download, HardDrive, LogOut, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/nexvya/ActionDialogs";
import { PageHeader, Panel } from "@/components/nexvya/common";
import { Button } from "@/components/ui/button";
import { todayISO } from "@/lib/nexvya/dates";
import { actions, type NexvyaState } from "@/lib/nexvya/store";
import { useAuth } from "@/lib/nexvya/auth";

export function Configuracoes({ s }: { s: NexvyaState }) {
  const [confirm, setConfirm] = useState<"demo" | "all" | null>(null);
  const { user, signOut } = useAuth();
  const demo = s.opportunities.filter((o) => o.demo).length;
  const mine = s.opportunities.length - demo;

  function exportData() {
    const blob = new Blob([actions.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexvya-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo de backup baixado.");
  }

  return (
    <>
      <PageHeader title="Configurações" />
      <div className="grid max-w-3xl gap-6">
        <Panel title="Onde ficam seus dados">
          <div className="flex gap-3">
            <HardDrive className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              Seus dados ficam salvos em um banco de dados online, protegidos por sua conta. Acesse de qualquer dispositivo entrando com o mesmo email e senha.
            </p>
          </div>
          <p className="mt-4 text-sm">{mine} oportunidades suas · {demo} de demonstração</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportData}><Download className="h-4 w-4" /> Exportar backup (JSON)</Button>
            <Button variant="outline" onClick={() => signOut()}><LogOut className="h-4 w-4" /> Sair da conta</Button>
          </div>
        </Panel>

        <Panel title="Dados de demonstração" description="Exemplos marcados como demo para explorar a Nexvya.">
          <div className="flex flex-wrap gap-2">
            {demo > 0 ? (
              <Button variant="outline" onClick={() => setConfirm("demo")}><Trash2 className="h-4 w-4" /> Remover demonstração</Button>
            ) : (
              <Button variant="outline" onClick={() => { actions.loadDemo(); toast.success("Dados de demonstração adicionados."); }}><Database className="h-4 w-4" /> Carregar demonstração</Button>
            )}
            <Button variant="ghost" onClick={() => { actions.setIntroDismissed(false); toast.success("A introdução voltará a aparecer na Visão geral."); }}>
              <RotateCcw className="h-4 w-4" /> Mostrar introdução novamente
            </Button>
          </div>
        </Panel>

        <Panel title="Zona de risco">
          <Button variant="destructive" disabled={!s.opportunities.length} onClick={() => setConfirm("all")}><Trash2 className="h-4 w-4" /> Excluir todas as oportunidades</Button>
        </Panel>

        <Panel title="Sobre esta versão">
          <ul className="grid gap-1 text-sm text-muted-foreground">
            <li>• O assistente usa regras baseadas nos seus registros; não há conexão com inteligência artificial.</li>
            <li>• Mensagens nunca são enviadas automaticamente — você copia e envia pelo canal que preferir.</li>
            <li>• Cada conta tem seus próprios dados, protegidos por senha. Acesse de qualquer dispositivo entrando na sua conta.</li>
          </ul>
        </Panel>
      </div>
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={confirm === "all" ? "Excluir todas as oportunidades?" : "Remover dados de demonstração?"}
        description={confirm === "all" ? `Todas as ${s.opportunities.length} oportunidades e seus históricos serão apagados da sua conta. Não é possível desfazer.` : "Apenas as oportunidades marcadas como demo serão removidas."}
        confirmLabel={confirm === "all" ? "Excluir tudo" : "Remover"}
        onConfirm={() => {
          if (confirm === "all") actions.clearAll();
          else actions.removeDemo();
          toast.success(confirm === "all" ? "Todas as oportunidades foram excluídas." : "Dados de demonstração removidos.");
          setConfirm(null);
        }}
      />
    </>
  );
}

export default Configuracoes;
