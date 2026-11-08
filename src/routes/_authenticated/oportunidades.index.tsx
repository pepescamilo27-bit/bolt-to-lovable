import { createFileRoute } from "@tanstack/react-router";
import { StoreGate } from "@/components/nexvya/common";
import { OportunidadesList } from "@/views/OportunidadesList";

export const Route = createFileRoute("/_authenticated/oportunidades/")({
  head: () => ({
    meta: [
      { title: "Oportunidades — Nexvya" },
      { name: "description", content: "Lista de oportunidades comerciais com busca e filtros." },
      { property: "og:title", content: "Oportunidades — Nexvya" },
      { property: "og:description", content: "Lista de oportunidades comerciais com busca e filtros." },
    ],
  }),
  component: () => <StoreGate>{(s) => <OportunidadesList s={s} />}</StoreGate>,
});
