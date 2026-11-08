import { createFileRoute } from "@tanstack/react-router";
import { StoreGate } from "@/components/nexvya/common";
import { Pipeline } from "@/views/Pipeline";

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — Nexvya" },
      { name: "description", content: "Visualize suas negociações por etapa." },
      { property: "og:title", content: "Pipeline — Nexvya" },
      { property: "og:description", content: "Visualize suas negociações por etapa." },
    ],
  }),
  component: () => <StoreGate>{(s) => <Pipeline s={s} />}</StoreGate>,
});
