import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatHmx } from "@/lib/format";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setBalance(null);
      return;
    }
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("profiles").select("balance").eq("id", user.id).single();
      if (mounted && data) setBalance(Number(data.balance));
    };
    load();
    const ch = supabase
      .channel(`profile-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, (payload) => {
        const next = (payload.new as { balance: number | string } | null)?.balance;
        if (mounted && next !== undefined) setBalance(Number(next));
      })
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [user]);

  const linkClass = "text-sm text-muted-foreground hover:text-foreground transition-colors";
  const activeClass = "text-foreground font-medium";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md gradient-gold shadow-glow">
            <span className="font-display text-sm font-bold text-primary-foreground">H</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-bold tracking-tight">HUMANEX</span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Human Stock Exchange</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link to="/" className={linkClass} activeProps={{ className: activeClass }} activeOptions={{ exact: true }}>
            Market
          </Link>
          <Link to="/portfolio" className={linkClass} activeProps={{ className: activeClass }}>
            Portfolio
          </Link>
          <Link to="/leaderboard" className={linkClass} activeProps={{ className: activeClass }}>
            Leaderboard
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden items-center gap-2 rounded-md border border-border/70 bg-surface px-3 py-1.5 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-bull-soft" style={{ backgroundColor: "var(--bull)" }} />
                <span className="ticker-mono text-sm font-semibold text-gold">{balance !== null ? formatHmx(balance) : "—"}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">HMX</span>
              </div>
              <button
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/auth" });
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-md gradient-gold px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* mobile nav */}
      <div className="flex items-center gap-5 border-t border-border/60 px-4 py-2 md:hidden">
        <Link to="/" className={linkClass} activeProps={{ className: activeClass }} activeOptions={{ exact: true }}>Market</Link>
        <Link to="/portfolio" className={linkClass} activeProps={{ className: activeClass }}>Portfolio</Link>
        <Link to="/leaderboard" className={linkClass} activeProps={{ className: activeClass }}>Leaderboard</Link>
      </div>
    </header>
  );
}
