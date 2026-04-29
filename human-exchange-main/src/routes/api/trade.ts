import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const TradeSchema = z.object({
  personality_id: z.string().uuid("Invalid personality_id"),
  side: z.enum(["buy", "sell"]),
  shares: z.number().int("Shares must be an integer").positive("Shares must be > 0"),
});

type TradeInput = z.infer<typeof TradeSchema>;

interface TradeSuccess {
  success: true;
  newBalance: number;
  newHolding: { shares: number; avg_cost: number } | null;
}

function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

export const Route = createFileRoute("/api/trade")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Authenticate: verify JWT server-side with supabaseAdmin
        const token = extractBearerToken(request);
        if (!token) {
          return Response.json(
            { error: "Missing or invalid Authorization header" },
            { status: 401 },
          );
        }

        const { data: authData, error: authError } =
          await supabaseAdmin.auth.getUser(token);
        if (authError || !authData.user) {
          return Response.json(
            { error: "Unauthorized" },
            { status: 401 },
          );
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
        const input: TradeInput = parsed.data;

        // 3. Fetch authoritative price from DB — never trust client price
        const { data: personality, error: persError } = await supabaseAdmin
          .from("personalities")
          .select("id, current_price")
          .eq("id", input.personality_id)
          .maybeSingle();

        if (persError || !personality) {
          return Response.json({ error: "Personality not found" }, { status: 404 });
        }
        const price = Number(personality.current_price);
        const total = price * input.shares;

        // 4. Fetch current balance and holding from DB
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("balance")
          .eq("id", userId)
          .single();

        if (profileError || !profile) {
          return Response.json({ error: "User profile not found" }, { status: 404 });
        }
        const currentBalance = Number(profile.balance);

        const { data: holdingRow } = await supabaseAdmin
          .from("holdings")
          .select("shares, avg_cost")
          .eq("user_id", userId)
          .eq("personality_id", input.personality_id)
          .maybeSingle();

        const currentHolding = holdingRow
          ? { shares: Number(holdingRow.shares), avg_cost: Number(holdingRow.avg_cost) }
          : null;

        // 5. Business rule validation — server-side authority, not client state
        if (input.side === "buy") {
          if (total > currentBalance) {
            return Response.json(
              {
                error:
                  "Insufficient HMX balance. Need " +
                  total.toFixed(2) +
                  ", have " +
                  currentBalance.toFixed(2),
              },
              { status: 400 },
            );
          }
        } else {
          const owned = currentHolding?.shares ?? 0;
          if (input.shares > owned) {
            return Response.json(
              {
                error:
                  "You do not own that many shares. Requested " +
                  input.shares +
                  ", you have " +
                  owned,
              },
              { status: 400 },
            );
          }
        }

        // 6a. Insert transaction record
        const { error: txErr } = await supabaseAdmin
          .from("transactions")
          .insert({
            user_id: userId,
            personality_id: input.personality_id,
            side: input.side,
            shares: input.shares,
            price,
            total,
          });

        if (txErr) {
          console.error("[trade] insert transaction failed:", txErr);
          return Response.json({ error: "Failed to record transaction" }, { status: 500 });
        }

        // 6b. Update profile balance
        const newBalance =
          input.side === "buy" ? currentBalance - total : currentBalance + total;

        const { error: balErr } = await supabaseAdmin
          .from("profiles")
          .update({ balance: newBalance })
          .eq("id", userId);

        if (balErr) {
          console.error("[trade] update balance failed:", balErr);
          return Response.json({ error: "Failed to update balance" }, { status: 500 });
        }

        // 6c. Upsert / update / delete holding
        let newHolding: { shares: number; avg_cost: number } | null = null;

        if (input.side === "buy") {
          const prevShares = currentHolding?.shares ?? 0;
          const prevCost = (currentHolding?.avg_cost ?? 0) * prevShares;
          const newShares = prevShares + input.shares;
          const newAvgCost = (prevCost + total) / newShares;

          const { error: hErr } = await supabaseAdmin.from("holdings").upsert(
            {
              user_id: userId,
              personality_id: input.personality_id,
              shares: newShares,
              avg_cost: newAvgCost,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,personality_id" },
          );

          if (hErr) {
            console.error("[trade] upsert holding failed:", hErr);
            return Response.json({ error: "Trade partially applied" }, { status: 500 });
          }
          newHolding = { shares: newShares, avg_cost: newAvgCost };

        } else {
          const newShares = (currentHolding?.shares ?? 0) - input.shares;

          if (newShares <= 0) {
            const { error: delErr } = await supabaseAdmin
              .from("holdings")
              .delete()
              .eq("user_id", userId)
              .eq("personality_id", input.personality_id);

            if (delErr) {
              console.error("[trade] delete holding failed:", delErr);
              return Response.json({ error: "Trade partially applied" }, { status: 500 });
            }
            newHolding = null;

          } else {
            const { error: updErr } = await supabaseAdmin
              .from("holdings")
              .update({ shares: newShares, updated_at: new Date().toISOString() })
              .eq("user_id", userId)
              .eq("personality_id", input.personality_id);

            if (updErr) {
              console.error("[trade] update holding failed:", updErr);
              return Response.json({ error: "Trade partially applied" }, { status: 500 });
            }
            // avg_cost is unchanged on a sell; currentHolding is non-null here (validated above)
            newHolding = { shares: newShares, avg_cost: currentHolding!.avg_cost };
          }
        }

        // 7. Return success payload
        const response: TradeSuccess = { success: true, newBalance, newHolding };
        return Response.json(response, { status: 200 });
      },
    },
  },
});