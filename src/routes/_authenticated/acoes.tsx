import { createFileRoute } from "@tanstack/react-router";
import { StoreGate } from "@/components/nexvya/common";
import { Actions } from "@/views/Actions";

export const Route = createFileRoute("/_authenticated/acoes")({
  head: () => ({
    meta: [
      { title: "Central de ações — Nexvya" },
      { name: "description", content: "Follow-ups priorizados para hoje e atrasados." },
      { property: "og:title", content: "Central de ações — Nexvya" },
      { property: "og:description", content: "Follow-ups priorizados para hoje e atrasados." },
    ],
  }),
  component: () => <StoreGate>{(s) => <Actions s={s} />}</StoreGate>,
});
