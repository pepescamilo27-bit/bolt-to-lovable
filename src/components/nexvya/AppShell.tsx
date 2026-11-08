import { Link, useLocation } from "@/lib/nexvya/nav";
import {
  BarChart3,
  Columns3,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MoreHorizontal,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/nexvya/auth";

const NAV = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard },
  { to: "/oportunidades", label: "Oportunidades", icon: Users },
  { to: "/pipeline", label: "Pipeline", icon: Columns3 },
  { to: "/acoes", label: "Central de ações", icon: ListChecks },
  { to: "/propostas", label: "Propostas", icon: FileText },
  { to: "/assistente", label: "Assistente", icon: Sparkles },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

const MOBILE_MAIN = NAV.slice(0, 4);
const MOBILE_MORE = NAV.slice(4);

function useActive() {
  const location = useLocation();
  const path = location.pathname;
  return (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
}

export function AppShell({ children }: { children: ReactNode }) {
  const isActive = useActive();
  const [more, setMore] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-5 py-6 text-sidebar-accent-foreground">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Navegação principal">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                isActive(n.to) && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <n.icon className={cn("h-4 w-4", isActive(n.to) && "text-sidebar-primary")} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {user?.email}
              </p>
              <p className="mt-0.5 text-xs text-sidebar-foreground/50">Conta pessoal</p>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="shrink-0 rounded-lg p-2 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center border-b bg-navy px-4 text-navy-foreground md:hidden">
          <Logo className="scale-90 origin-left" />
        </header>
        <main className="flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <nav
        aria-label="Navegação"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {MOBILE_MAIN.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground",
              isActive(n.to) && "text-primary",
            )}
          >
            <n.icon className="h-5 w-5" />
            {n.label.replace("Central de ações", "Ações")}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMore(true)}
          className={cn(
            "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground",
            MOBILE_MORE.some((n) => isActive(n.to)) && "text-primary",
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          Mais
        </button>
      </nav>

      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Mais áreas</SheetTitle>
          </SheetHeader>
          <div className="grid gap-1 p-4 pt-0">
            {MOBILE_MORE.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMore(false)}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted", isActive(n.to) && "bg-accent text-accent-foreground")}
              >
                <n.icon className="h-5 w-5" />
                {n.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
