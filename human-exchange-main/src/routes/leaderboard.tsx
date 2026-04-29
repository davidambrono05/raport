import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatHmx } from "@/lib/format";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — HUMANEX" },
      { name: "description", content: "Top investors on HUMANEX this week." },
    ],
  }),
  component: LeaderboardPage,
});

type Entry = { id: string; display_name: string; net_worth: number };

function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Fetch all profiles
      const { data: profiles } = await supabase.from("profiles").select("id,display_name,balance");
      if (!profiles) { if (mounted) setEntries([]); return; }

      // Fetch all holdings + current prices in one go
      const { data: holdings } = await supabase
        .from("holdings")
        .select("user_id,shares,personality:personalities(current_price)");

      const investedByUser = new Map<string, number>();
      (holdings ?? []).forEach((h) => {
        const joined = h.personality as { current_price: number | string } | null;
        const price = Number(joined?.current_price ?? 0);
        const shares = Number(h.shares);
        investedByUser.set(h.user_id, (investedByUser.get(h.user_id) ?? 0) + shares * price);
      });

      const list: Entry[] = profiles
        .map((p) => ({
          id: p.id,
          display_name: p.display_name,
          net_worth: Number(p.balance) + (investedByUser.get(p.id) ?? 0),
        }))
        .sort((a, b) => b.net_worth - a.net_worth)
        .slice(0, 10);

      if (mounted) setEntries(list);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">Weekly Rankings</span>
      </div>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Top Investors</h1>
      <p className="mt-1 text-sm text-muted-foreground">Ranked by total net worth (cash + holdings).</p>

      <section className="mt-8 rounded-xl border border-border/70 gradient-surface shadow-card">
        {!entries ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-elevated" />)}
          </div>
        ) : entries.length === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">No investors yet — be the first.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {entries.map((e, i) => {
              const isMe = user?.id === e.id;
              const rank = i + 1;
              const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
              const initials = e.display_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";
              return (
                <li
                  key={e.id}
                  className={`flex items-center justify-between gap-4 px-5 py-4 transition-colors ${
                    isMe ? "bg-gold-soft" : "hover:bg-surface-elevated/40"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                      rank <= 3 ? "border-gold bg-gold-soft text-gold" : "border-border bg-surface-elevated text-muted-foreground"
                    }`}>
                      <span className="ticker-mono text-sm font-bold">{medal ? medal : `#${rank}`}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold text-foreground">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{e.display_name}{isMe && <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-gold">You</span>}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="ticker-mono text-base font-bold text-gold">{formatHmx(e.net_worth)}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">HMX</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
