import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@/lib/nexvya/nav";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/nexvya/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo, LogoMark } from "@/components/nexvya/Logo";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export function AuthPage() {
  const { signIn, signUp, sendPasswordReset, user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/");
  }, [loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function forgot() {
    const target = email.trim();
    if (!target) {
      toast.error("Digite seu email acima para receber o link.");
      return;
    }
    const { error } = await sendPasswordReset(target);
    if (error) toast.error(error);
    else toast.success("Enviamos um link para seu email. Use-o para criar uma nova senha.");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          toast.error(error);
          return;
        }
        toast.success("Bem-vindo de volta!");
        navigate("/");
      } else {
        const { error, needsConfirmation } = await signUp(email.trim(), password);
        if (error) {
          toast.error(error);
          return;
        }
        if (needsConfirmation) {
          toast.success("Conta criada! Confirme seu email pelo link que enviamos e depois entre.");
          setMode("signin");
          setPassword("");
        } else {
          navigate("/");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left: brand panel (hidden on mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[var(--navy)] p-10 text-[var(--navy-foreground)] lg:flex">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, var(--sidebar-primary) 0, transparent 50%), radial-gradient(circle at 80% 70%, var(--sidebar-primary) 0, transparent 50%)",
        }} />
        <div className="relative">
          <Logo className="[&_*]:!text-white" />
        </div>
        <div className="relative space-y-6">
          <h1 className="font-display text-3xl font-bold leading-tight">
            Seu pipeline comercial,<br />organizado e sempre à mão.
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--navy-muted)]">
            Nexvya ajuda você a acompanhar cada negociação, saber o que fazer
            a seguir e nunca perder um follow-up por esquecimento.
          </p>
          <ul className="space-y-2 text-sm">
            {[
              "Pipeline visual por etapas",
              "Central de ações com priorização automática",
              "Assistente com rascunhos de mensagem",
              "Relatórios com base nos seus dados reais",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-[var(--navy-foreground)]/80">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--sidebar-primary)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-[var(--navy-muted)]">
          Seus dados protegidos com autenticação individual.
        </p>
      </div>

      {/* Right: form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-4 lg:hidden">
            <LogoMark className="h-10 w-10" />
            <h1 className="font-display text-xl font-bold tracking-[0.14em]">NEXVYA</h1>
          </div>

          <h2 className="font-display text-2xl font-semibold">
            {mode === "signin" ? "Entrar na sua conta" : "Criar sua conta"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Acesse suas oportunidades e seu pipeline."
              : "Comece a usar a Nexvya em poucos segundos."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "••••••••"}
                  className="px-10"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Entrar" : "Criar conta"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {mode === "signin" && (
            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={forgot}
                className="font-medium text-primary hover:underline"
              >
                Esqueci minha senha / primeiro acesso
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setPassword("");
              }}
              className={cn("font-medium text-primary hover:underline")}
            >
              {mode === "signin" ? "Criar agora" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
