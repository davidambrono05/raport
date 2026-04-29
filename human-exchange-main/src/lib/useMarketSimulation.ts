import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Runs a market simulation tick every 30s.
 * Uses a localStorage lock so only one open tab ticks the market.
 */
export function useMarketSimulation() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const TICK_MS = 30_000;
    const LOCK_KEY = "humanex:ticker-lock";
    const LOCK_TTL_MS = 45_000;
    const myId = Math.random().toString(36).slice(2);

    const acquireLock = (): boolean => {
      try {
        const raw = localStorage.getItem(LOCK_KEY);
        const now = Date.now();
        if (raw) {
          const { id, ts } = JSON.parse(raw) as { id: string; ts: number };
          if (id !== myId && now - ts < LOCK_TTL_MS) return false;
        }
        localStorage.setItem(LOCK_KEY, JSON.stringify({ id: myId, ts: now }));
        return true;
      } catch {
        return true;
      }
    };

    const tick = async () => {
      if (!acquireLock()) return;
      try {
        // tick_market isn't in generated types yet; cast to bypass.
        await (supabase.rpc as unknown as (fn: string) => Promise<unknown>)("tick_market");
      } catch {
        // ignore network errors
      }
    };

    // First tick after a short delay so the page loads cleanly
    const t0 = window.setTimeout(tick, 2_000);
    const iv = window.setInterval(tick, TICK_MS);
    return () => {
      window.clearTimeout(t0);
      window.clearInterval(iv);
    };
  }, []);
}
