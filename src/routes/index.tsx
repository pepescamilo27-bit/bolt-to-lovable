import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/nexvya/AppShell";
import { StoreGate } from "@/components/nexvya/common";
import { requireUser } from "@/lib/nexvya/guard";
import { Overview } from "@/views/Overview";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: requireUser,
  head: () => ({
    meta: [
      { title: "Visão geral — Nexvya" },
      { name: "description", content: "Seu pipeline comercial, ações do dia e oportunidades em um só lugar." },
      { property: "og:title", content: "Nexvya — Inteligência comercial" },
      { property: "og:description", content: "Organize negociações, recupere oportunidades esquecidas e saiba qual é sua próxima ação." },
    ],
  }),
  component: () => (
    <AppShell>
      <StoreGate>{(s) => <Overview s={s} />}</StoreGate>
    </AppShell>
  ),
});
