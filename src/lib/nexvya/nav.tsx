// Small adapter so the ported screens keep string paths while routing stays fully typed.
import {
  Link as TLink,
  useLocation as useTLocation,
  useNavigate as useTNavigate,
  getRouteApi,
  useSearch,
} from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";

const STATIC_PATHS = [
  "/",
  "/oportunidades",
  "/pipeline",
  "/acoes",
  "/propostas",
  "/assistente",
  "/relatorios",
  "/configuracoes",
  "/auth",
] as const;
type StaticPath = (typeof STATIC_PATHS)[number];

type Target =
  | { kind: "opp"; id: string }
  | { kind: "assistant"; id?: string | undefined }
  | { kind: "static"; to: StaticPath };

export function resolvePath(path: string): Target {
  const [pathname = "", query = ""] = path.split("?");
  const opp = pathname.match(/^\/oportunidades\/([^/]+)$/);
  if (opp) return { kind: "opp", id: decodeURIComponent(opp[1] ?? "") };
  if (pathname === "/assistente") {
    const id = new URLSearchParams(query).get("id") ?? undefined;
    return { kind: "assistant", id };
  }
  const known = STATIC_PATHS.find((p) => p === pathname);
  return { kind: "static", to: known ?? "/" };
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string; children?: ReactNode };

export function Link({ to, ...rest }: LinkProps) {
  const t = resolvePath(to);
  if (t.kind === "opp") return <TLink to="/oportunidades/$id" params={{ id: t.id }} {...(rest as object)} />;
  if (t.kind === "assistant") return <TLink to="/assistente" search={{ id: t.id }} {...(rest as object)} />;
  return <TLink to={t.to} {...(rest as object)} />;
}

export function useNavigate() {
  const navigate = useTNavigate();
  return (to: string) => {
    const t = resolvePath(to);
    if (t.kind === "opp") return navigate({ to: "/oportunidades/$id", params: { id: t.id } });
    if (t.kind === "assistant") return navigate({ to: "/assistente", search: { id: t.id } });
    return navigate({ to: t.to });
  };
}

const oppRoute = getRouteApi("/_authenticated/oportunidades/$id");

/** Only the opportunity detail page reads path params. */
export function useParams(): { id: string } {
  return oppRoute.useParams();
}

export function useLocation() {
  return useTLocation();
}

/** Only the assistant page uses query params (`?id=`). */
export function useSearchParams(): [URLSearchParams, (next: { id?: string }) => void] {
  const search = useSearch({ strict: false }) as { id?: string };
  const navigate = useTNavigate();
  const params = new URLSearchParams();
  if (search.id) params.set("id", search.id);
  return [params, (next) => navigate({ to: "/assistente", search: { id: next.id } })];
}
