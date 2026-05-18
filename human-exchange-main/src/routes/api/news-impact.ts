import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const NewsImpactSchema = {
  personality_id: (v: unknown) => typeof v === "string" && v.length > 0,
  delta: (v: unknown) => typeof v === "number",
};

function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

export const Route = createFileRoute("/api/news-impact")({
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

        if (
          !NewsImpactSchema.personality_id((body as any).personality_id) ||
          !NewsImpactSchema.delta((body as any).delta)
        ) {
          return Response.json({ error: "Invalid personality_id or delta" }, { status: 400 });
        }

        const { personality_id, delta } = body as { personality_id: string; delta: number };

        if (Math.abs(delta) < 0.01) {
          return Response.json({ success: true, skipped: true });
        }

        // 3. Apply price impact via RPC (server-side, service role)
        const { error } = await supabaseAdmin.rpc("tick_market_with_delta", {
          p_personality_id: personality_id,
          p_delta_pct: delta,
        });

        if (error) {
          console.error("[news-impact] rpc failed:", error);
          return Response.json({ error: "Failed to apply impact" }, { status: 500 });
        }

        return Response.json({ success: true, delta });
      },
    },
  },
});
