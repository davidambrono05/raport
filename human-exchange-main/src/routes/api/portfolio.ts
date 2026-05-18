import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

export const Route = createFileRoute("/api/portfolio")({
  server: {
    handlers: {
      GET: async ({ request }) => {
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
        const userId = authData.user.id;

        // 2. Fetch balance
        const { data: profile, error: profError } = await supabaseAdmin
          .from("profiles")
          .select("balance")
          .eq("id", userId)
          .single();

        if (profError || !profile) {
          return Response.json({ error: "Profile not found" }, { status: 404 });
        }

        // 3. Fetch holdings with personality data
        const { data: holdings, error: hError } = await supabaseAdmin
          .from("holdings")
          .select(`
            id, shares, avg_cost,
            personality:personalities(id, slug, name, category, current_price)
          `)
          .eq("user_id", userId);

        if (hError) {
          console.error("[portfolio] fetch holdings failed:", hError);
          return Response.json({ error: "Failed to fetch holdings" }, { status: 500 });
        }

        // 4. Format response
        const formattedHoldings = (holdings ?? []).map((h: any) => ({
          id: h.id,
          shares: Number(h.shares),
          avg_cost: Number(h.avg_cost),
          personality: {
            id: h.personality.id,
            slug: h.personality.slug,
            name: h.personality.name,
            category: h.personality.category,
            current_price: Number(h.personality.current_price),
          },
        }));

        return Response.json({
          balance: Number(profile.balance),
          holdings: formattedHoldings,
        });
      },
    },
  },
});
