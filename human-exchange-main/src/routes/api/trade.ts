import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const TradeSchema = z.object({
  personality_id: z.string().uuid("Invalid personality_id"),
  side: z.enum(["buy", "sell"]),
  shares: z.number().int("Shares must be an integer").positive("Shares must be > 0"),
});

type TradeInput = z.infer<typeof TradeSchema>;

function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

export const Route = createFileRoute("/api/trade")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Authenticate: verify JWT server-side
        const token = extractBearerToken(request);
        if (!token) {
          return Response.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
        }

        const { data: authData, error: authError } =
          await supabaseAdmin.auth.getUser(token);
        if (authError || !authData.user) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = authData.user.id;

        // 2. Parse and validate body
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const parsed = TradeSchema.safeParse(body);
        if (!parsed.success) {
          const message = parsed.error.errors.map((e) => e.message).join("; ");
          return Response.json({ error: message }, { status: 400 });
        }
        const input = parsed.data;

        // 3. Execute trade atomically in DB with row-level locking
        //    Uses execute_trade() PostgreSQL function which:
        //    - Locks profile row (SELECT FOR UPDATE) to prevent race conditions
        //    - Locks holding row (SELECT FOR UPDATE) for sell validation
        //    - Validates business rules server-side (balance, share count)
        //    - Inserts transaction, updates balance, upserts/delete holding
        //    - Returns { success, newBalance, newHolding } or { error }
        const { data, error } = await supabaseAdmin.rpc("execute_trade", {
          p_user_id: userId,
          p_personality_id: input.personality_id,
          p_side: input.side,
          p_shares: input.shares,
        });

        if (error) {
          console.error("[trade] rpc execute_trade failed:", error);
          return Response.json({ error: "Trade execution failed" }, { status: 500 });
        }

        const result = data as Record<string, unknown>;

        // Check if the DB function returned an error (business rule violation)
        if (result.error) {
          const errMsg = result.error as string;
          const status = errMsg.includes("balance")
            ? 400
            : errMsg.includes("shares")
              ? 400
              : errMsg.includes("not found")
                ? 404
                : 500;
          return Response.json({ error: errMsg }, { status });
        }

        return Response.json(result, { status: 200 });
      },
    },
  },
});
