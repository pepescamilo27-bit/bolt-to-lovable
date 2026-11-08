import { createFileRoute } from "@tanstack/react-router";
import { StoreGate } from "@/components/nexvya/common";
import { Configuracoes } from "@/views/Configuracoes";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Nexvya" },
      { name: "description", content: "Preferências da conta, dados de exemplo e exportação." },
      { property: "og:title", content: "Configurações — Nexvya" },
      { property: "og:description", content: "Preferências da conta, dados de exemplo e exportação." },
    ],
  }),
  component: () => <StoreGate>{(s) => <Configuracoes s={s} />}</StoreGate>,
});
