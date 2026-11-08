import { createFileRoute } from "@tanstack/react-router";
import { OpportunityDetail } from "@/views/OpportunityDetail";

export const Route = createFileRoute("/_authenticated/oportunidades/$id")({
  head: () => ({
    meta: [
      { title: "Oportunidade — Nexvya" },
      { name: "description", content: "Detalhes, histórico e próximas ações da oportunidade." },
      { property: "og:title", content: "Oportunidade — Nexvya" },
      { property: "og:description", content: "Detalhes, histórico e próximas ações da oportunidade." },
    ],
  }),
  component: () => <OpportunityDetail />,
});
