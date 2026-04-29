-- Add last_reality_score + score_updated_at to personalities
ALTER TABLE public.personalities
  ADD COLUMN IF NOT EXISTS last_reality_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ;

-- Create news_history table
CREATE TABLE IF NOT EXISTS public.news_history (
  id BIGSERIAL PRIMARY KEY,
  personality_id UUID NOT NULL REFERENCES public.personalities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  source TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  published_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index on URL to prevent duplicate news entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_history_url
  ON public.news_history(url) WHERE url IS NOT NULL;

-- Index for fast personality lookups ordered by time
CREATE INDEX IF NOT EXISTS idx_news_history_personality
  ON public.news_history(personality_id, processed_at DESC);

-- RLS
ALTER TABLE public.news_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News history public read"
  ON public.news_history FOR SELECT USING (true);

-- Inserts vin de pe client (anon key) — news cache, date non-sensibile
CREATE POLICY "News history public insert"
  ON public.news_history FOR INSERT WITH CHECK (true);

-- Granteaza tick_market_with_delta si pentru service role (folosit in trade.ts)
GRANT EXECUTE ON FUNCTION public.tick_market_with_delta(UUID, NUMERIC) TO service_role;
