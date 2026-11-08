import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/views/Auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — Nexvya" },
      { name: "description", content: "Entre ou crie sua conta Nexvya para acompanhar suas negociações." },
      { property: "og:title", content: "Entrar — Nexvya" },
      { property: "og:description", content: "Entre ou crie sua conta Nexvya para acompanhar suas negociações." },
    ],
  }),
  component: AuthPage,
});
