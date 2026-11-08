import { createFileRoute } from "@tanstack/react-router";
import { StoreGate } from "@/components/nexvya/common";
import { Relatorios } from "@/views/Relatorios";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Nexvya" },
      { name: "description", content: "Relatórios baseados nos seus dados comerciais reais." },
      { property: "og:title", content: "Relatórios — Nexvya" },
      { property: "og:description", content: "Relatórios baseados nos seus dados comerciais reais." },
    ],
  }),
  component: () => <StoreGate>{(s) => <Relatorios s={s} />}</StoreGate>,
});
