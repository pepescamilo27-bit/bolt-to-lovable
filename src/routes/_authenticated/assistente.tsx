import { createFileRoute } from "@tanstack/react-router";
import { Assistant } from "@/views/Assistant";

export const Route = createFileRoute("/_authenticated/assistente")({
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined } => ({
    id: typeof s["id"] === "string" ? s["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Assistente — Nexvya" },
      { name: "description", content: "Análises e rascunhos de mensagens com IA para cada oportunidade." },
      { property: "og:title", content: "Assistente — Nexvya" },
      { property: "og:description", content: "Análises e rascunhos de mensagens com IA para cada oportunidade." },
    ],
  }),
  component: () => <Assistant />,
});
