import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/nexvya/AppShell";
import { requireUser } from "@/lib/nexvya/guard";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: requireUser,
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
