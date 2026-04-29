import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Personality = {
  id: string;
  name: string;
  current_price: number;
  youtube_channel_id: string | null;
  last_subscriber_count: number | null;
};

type YTResponse = {
  items?: Array<{ id: string; statistics?: { subscriberCount?: string } }>;
  error?: { message?: string };
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export const Route = createFileRoute("/api/public/hooks/update-prices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.WEBHOOK_SECRET;
        if (secret) {
          const provided = request.headers.get("X-Webhook-Secret");
          if (provided !== secret) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
        }

        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
          return Response.json(
            { success: false, error: "YOUTUBE_API_KEY is not configured" },
            { status: 500 }
          );
        }

        const { data: rows, error } = await supabaseAdmin
          .from("personalities")
          .select("id,name,current_price,youtube_channel_id,last_subscriber_count")
          .not("youtube_channel_id", "is", null);

        if (error) {
          console.error("Failed to load personalities:", error);
          return Response.json({ success: false, error: error.message }, { status: 500 });
        }

        const personalities = (rows ?? []) as unknown as Personality[];
        if (personalities.length === 0) {
          return Response.json({ success: true, processed: 0, message: "No YouTube-linked personalities" });
        }

        // Batch-fetch YouTube statistics
        const ids = personalities.map((p) => p.youtube_channel_id!).join(",");
        const ytUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${ids}&key=${apiKey}`;
        const ytRes = await fetch(ytUrl);
        const yt = (await ytRes.json()) as YTResponse;

        if (!ytRes.ok) {
          console.error("YouTube API error:", yt);
          return Response.json(
            { success: false, error: yt.error?.message ?? "YouTube API error" },
            { status: 502 }
          );
        }

        const subsByChannel = new Map<string, number>();
        for (const item of yt.items ?? []) {
          const count = Number(item.statistics?.subscriberCount ?? 0);
          if (item.id && count > 0) subsByChannel.set(item.id, count);
        }

        const results: Array<{ name: string; oldPrice: number; newPrice: number; deltaPct: number; subs: number }> = [];

        for (const p of personalities) {
          const subs = subsByChannel.get(p.youtube_channel_id!);
          if (!subs) continue;

          let pricePct = 0;
          if (p.last_subscriber_count && p.last_subscriber_count > 0) {
            const growthPct = ((subs - p.last_subscriber_count) / p.last_subscriber_count) * 100;

            if (growthPct > 0.5) {
              pricePct = rand(3, 7);
            } else if (growthPct >= 0) {
              pricePct = rand(0, 3);
            } else {
              pricePct = -rand(1, 4);
            }
          }
          // else: first observation — only seed last_subscriber_count, no price change

          const oldPrice = Number(p.current_price);
          const newPrice = Math.max(1, Math.round(oldPrice * (1 + pricePct / 100) * 100) / 100);
          const changePct = Math.round(((newPrice - oldPrice) / oldPrice) * 10000) / 100;

          const { error: updErr } = await supabaseAdmin
            .from("personalities")
            // last_subscriber_count is on the table but not in generated types yet
            .update({
              current_price: newPrice,
              change_pct: changePct,
              last_subscriber_count: subs,
            } as never)
            .eq("id", p.id);

          if (updErr) {
            console.error(`Update failed for ${p.name}:`, updErr);
            continue;
          }

          if (newPrice !== oldPrice) {
            await supabaseAdmin.from("price_history").insert({
              personality_id: p.id,
              price: newPrice,
            });
          }

          results.push({ name: p.name, oldPrice, newPrice, deltaPct: changePct, subs });
        }

        return Response.json({ success: true, processed: results.length, results });
      },
    },
  },
});
