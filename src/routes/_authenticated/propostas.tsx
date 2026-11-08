import { createFileRoute } from "@tanstack/react-router";
import { Propostas } from "@/views/Propostas";

export const Route = createFileRoute("/_authenticated/propostas")({
  head: () => ({
    meta: [
      { title: "Propostas — Nexvya" },
      { name: "description", content: "Acompanhe propostas enviadas, aceitas e recusadas." },
      { property: "og:title", content: "Propostas — Nexvya" },
      { property: "og:description", content: "Acompanhe propostas enviadas, aceitas e recusadas." },
    ],
  }),
  component: () => <Propostas />,
});
