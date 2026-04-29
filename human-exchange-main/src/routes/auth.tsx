import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — HUMANEX" },
      { name: "description", content: "Sign in or create an account on HUMANEX." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) toast.error(error);
        else navigate({ to: "/" });
      } else {
        if (!name.trim()) { toast.error("Please enter a display name"); return; }
        if (password.length < 6) { toast.error("Password must be at least 6 characters long."); return; }
        const { error } = await signUp(email, password, name.trim());
        if (error) toast.error(error);
        else {
          toast.success("Account created. Welcome — 10,000 HMX has been credited.");
          navigate({ to: "/" });
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-gold shadow-glow">
              <span className="font-display text-lg font-bold text-primary-foreground">H</span>
            </div>
          </Link>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Open your trading account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to access your portfolio." : "Sign up and receive 10,000 HMX to start trading."}
          </p>
        </div>

        <form onSubmit={submit} className="rounded-xl border border-border/70 gradient-surface p-6 shadow-card">
          {mode === "signup" && (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Display name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                placeholder="Trader Joe"
                maxLength={50}
              />
            </div>
          )}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              placeholder="you@example.com"
            />
          </div>
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md gradient-gold py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition disabled:opacity-50"
          >
            {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>Don't have an account? <button type="button" onClick={() => setMode("signup")} className="text-gold hover:underline">Sign up</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => setMode("signin")} className="text-gold hover:underline">Sign in</button></>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
