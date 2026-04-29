import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatHmx, formatPct } from "@/lib/format";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — HUMANEX" },
      { name: "description", content: "Your HUMANEX holdings, profit and loss." },
    ],
  }),
  component: PortfolioPage,
});

type HoldingRow = {
  id: string;
  shares: number;
  avg_cost: number;
  personality: { id: string; slug: string; name: string; category: string; current_price: number };
};

function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [holdings, setHoldings] = useState<HoldingRow[] | null>(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      const { data: prof } = await supabase.from("profiles").select("balance").eq("id", user.id).single();
      if (prof && mounted) setBalance(Number(prof.balance));

      const { data } = await supabase
        .from("holdings")
        .select("id, shares, avg_cost, personality:personalities(id,slug,name,category,current_price)")
        .eq("user_id", user.id);
      if (mounted) {
        setHoldings(
          (data ?? []).map((h) => {
            const joined = h.personality as { id: string; slug: string; name: string; category: string; current_price: number | string };
            return {
              id: h.id,
              shares: Number(h.shares),
              avg_cost: Number(h.avg_cost),
              personality: { ...joined, current_price: Number(joined.current_price) },
            };
          })
        );
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  if (authLoading || !user || !holdings) {
    return <main className="mx-auto max-w-7xl px-4 py-12"><div className="h-64 animate-pulse rounded-xl bg-surface" /></main>;
  }

  const investedValue = holdings.reduce((s, h) => s + h.shares * h.personality.current_price, 0);
  const costBasis = holdings.reduce((s, h) => s + h.shares * h.avg_cost, 0);
  const pl = investedValue - costBasis;
  const plPct = costBasis > 0 ? (pl / costBasis) * 100 : 0;
  const total = balance + investedValue;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Portfolio</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your positions and net worth on HUMANEX.</p>

      {/* Top stats */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BigStat label="Total net worth" value={`${formatHmx(total)} HMX`} highlight />
        <BigStat label="Cash balance" value={`${formatHmx(balance)} HMX`} />
        <BigStat label="Invested" value={`${formatHmx(investedValue)} HMX`} />
        <BigStat
          label="Unrealized P/L"
          value={`${pl >= 0 ? "+" : ""}${formatHmx(pl)} HMX`}
          sub={formatPct(plPct)}
          accent={pl >= 0 ? "bull" : "bear"}
        />
      </section>

      {/* Holdings */}
      <section className="mt-8 rounded-xl border border-border/70 gradient-surface shadow-card">
        <div className="border-b border-border/60 px-6 py-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Holdings</h2>
        </div>
        {holdings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">You don't hold any positions yet.</p>
            <Link to="/" className="mt-3 inline-block rounded-md gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
              Browse market
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Asset</th>
                  <th className="px-6 py-3 font-medium text-right">Shares</th>
                  <th className="px-6 py-3 font-medium text-right">Avg cost</th>
                  <th className="px-6 py-3 font-medium text-right">Price</th>
                  <th className="px-6 py-3 font-medium text-right">Value</th>
                  <th className="px-6 py-3 font-medium text-right">P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {holdings.map((h) => {
                  const value = h.shares * h.personality.current_price;
                  const cost = h.shares * h.avg_cost;
                  const rowPl = value - cost;
                  const rowPlPct = cost > 0 ? (rowPl / cost) * 100 : 0;
                  const up = rowPl >= 0;
                  const initials = h.personality.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <tr key={h.id} className="transition-colors hover:bg-surface-elevated/40">
                      <td className="px-6 py-3.5">
                        <Link to="/p/$slug" params={{ slug: h.personality.slug }} className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated text-xs font-bold text-gold">{initials}</div>
                          <div>
                            <div className="font-medium">{h.personality.name}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{h.personality.category}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-3.5 text-right ticker-mono">{formatHmx(h.shares, 4)}</td>
                      <td className="px-6 py-3.5 text-right ticker-mono text-muted-foreground">{formatHmx(h.avg_cost)}</td>
                      <td className="px-6 py-3.5 text-right ticker-mono">{formatHmx(h.personality.current_price)}</td>
                      <td className="px-6 py-3.5 text-right ticker-mono font-semibold">{formatHmx(value)}</td>
                      <td className="px-6 py-3.5 text-right">
                        <div className={`ticker-mono font-semibold ${up ? "text-bull" : "text-bear"}`}>
                          {up ? "+" : ""}{formatHmx(rowPl)}
                        </div>
                        <div className={`ticker-mono text-[10px] ${up ? "text-bull" : "text-bear"}`}>
                          {formatPct(rowPlPct)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function BigStat({
  label, value, sub, accent, highlight,
}: { label: string; value: string; sub?: string; accent?: "bull" | "bear"; highlight?: boolean }) {
  const color = accent === "bull" ? "text-bull" : accent === "bear" ? "text-bear" : highlight ? "text-gold" : "text-foreground";
  return (
    <div className="rounded-xl border border-border/70 gradient-surface p-5 shadow-card">
      <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1.5 ticker-mono text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className={`mt-0.5 ticker-mono text-xs ${color}`}>{sub}</div>}
    </div>
  );
}
