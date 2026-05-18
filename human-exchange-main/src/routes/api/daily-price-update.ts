import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ReputationScore } from "@/lib/reputationScore";

function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

export const Route = createFileRoute("/api/daily-price-update")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Authenticate
        const token = extractBearerToken(request);
        if (!token) {
          return Response.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const { data: authData, error: authError } =
          await supabaseAdmin.auth.getUser(token);
        if (authError || !authData.user) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse body
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const { personality_id, score } = body as {
          personality_id: string;
          score: { total: number; breakdown: { newsScore: number; interestScore: number; consistencyScore: number }; newArticles: number; daysOfData: number; trend: string; label: string; color: string; calculatedAt: string; newsPositive: number; newsNegative: number; newsNeutral: number; weeklyViews: number; viewsTrend: number };
        };

        if (!personality_id || typeof score?.total !== "number") {
          return Response.json({ error: "Invalid personality_id or score" }, { status: 400 });
        }

        // 3. Check if already updated today (server-side check via DB)
        const today = new Date().toISOString().split("T")[0];

        const { data: pers, error: persError } = await supabaseAdmin
          .from("personalities")
          .select("last_reality_score, score_updated_at, current_price")
          .eq("id", personality_id)
          .maybeSingle();

        if (persError || !pers) {
          return Response.json({ error: "Personality not found" }, { status: 404 });
        }

        // Check if score_updated_at is today
        if (pers.score_updated_at) {
          const updatedDate = new Date(pers.score_updated_at).toISOString().split("T")[0];
          if (updatedDate === today) {
            return Response.json({
              updated: false,
              delta: 0,
              reason: "Price already updated today. Next update tomorrow.",
            });
          }
        }

        // 4. Calculate price delta based on score difference
        const yesterdayScore = pers.last_reality_score
          ? Number(pers.last_reality_score)
          : 50;

        const scoreDiff = score.total - yesterdayScore;
        const rawDelta = scoreDiff * 0.3;

        // Limit to ±5% per day
        const delta = Math.max(-5, Math.min(5, rawDelta));

        // 5. Apply price update via RPC
        if (Math.abs(delta) >= 0.1) {
          const { error: rpcError } = await supabaseAdmin.rpc("tick_market_with_delta", {
            p_personality_id: personality_id,
            p_delta_pct: delta,
          });

          if (rpcError) {
            console.error("[daily-price] rpc failed:", rpcError);
            return Response.json({ error: "Failed to update price" }, { status: 500 });
          }
        }

        // 6. Save new score in personalities
        const { error: updError } = await supabaseAdmin
          .from("personalities")
          .update({
            last_reality_score: score.total,
            score_updated_at: new Date().toISOString(),
          })
          .eq("id", personality_id);

        if (updError) {
          console.error("[daily-price] update score failed:", updError);
          return Response.json({ error: "Failed to save score" }, { status: 500 });
        }

        const reason = delta > 0
          ? `Score improved ${yesterdayScore} → ${score.total} (+${scoreDiff.toFixed(1)} pts)`
          : delta < 0
            ? `Score declined ${yesterdayScore} → ${score.total} (${scoreDiff.toFixed(1)} pts)`
            : `Score unchanged (${score.total}/100)`;

        return Response.json({ updated: true, delta, reason });
      },
    },
  },
});
