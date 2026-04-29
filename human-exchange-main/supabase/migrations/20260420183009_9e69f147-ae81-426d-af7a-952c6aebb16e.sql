
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  balance NUMERIC(14,2) NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by all authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Personalities
CREATE TYPE public.category AS ENUM ('Sport','Entertainment','Tech','Politics');
CREATE TABLE public.personalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category public.category NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  current_price NUMERIC(12,2) NOT NULL,
  change_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.personalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Personalities public read" ON public.personalities FOR SELECT USING (true);

-- Price history
CREATE TABLE public.price_history (
  id BIGSERIAL PRIMARY KEY,
  personality_id UUID NOT NULL REFERENCES public.personalities(id) ON DELETE CASCADE,
  price NUMERIC(12,2) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_price_history_personality ON public.price_history(personality_id, recorded_at);
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Price history public read" ON public.price_history FOR SELECT USING (true);

-- Events (news affecting price)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personality_id UUID NOT NULL REFERENCES public.personalities(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  impact NUMERIC(6,2) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_personality ON public.events(personality_id, occurred_at DESC);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events public read" ON public.events FOR SELECT USING (true);

-- Holdings
CREATE TABLE public.holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personality_id UUID NOT NULL REFERENCES public.personalities(id) ON DELETE CASCADE,
  shares NUMERIC(14,4) NOT NULL DEFAULT 0,
  avg_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, personality_id)
);
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Holdings own select" ON public.holdings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Holdings own insert" ON public.holdings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Holdings own update" ON public.holdings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Holdings own delete" ON public.holdings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Transactions
CREATE TYPE public.txn_side AS ENUM ('buy','sell');
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personality_id UUID NOT NULL REFERENCES public.personalities(id) ON DELETE CASCADE,
  side public.txn_side NOT NULL,
  shares NUMERIC(14,4) NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  total NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_user ON public.transactions(user_id, created_at DESC);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Transactions own select" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Transactions own insert" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    10000
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed personalities
INSERT INTO public.personalities (name, slug, category, bio, current_price, change_pct) VALUES
  ('Cristiano Ronaldo', 'cristiano-ronaldo', 'Sport', 'Portuguese forward, all-time record goalscorer.', 487.50, 2.34),
  ('MrBeast', 'mrbeast', 'Entertainment', 'YouTube creator and philanthropist.', 412.20, 5.12),
  ('Elon Musk', 'elon-musk', 'Tech', 'CEO of Tesla, SpaceX and X.', 356.80, -3.41),
  ('Greta Thunberg', 'greta-thunberg', 'Politics', 'Climate activist.', 198.40, 1.07),
  ('LeBron James', 'lebron-james', 'Sport', 'NBA forward, four-time champion.', 324.10, -0.85),
  ('Taylor Swift', 'taylor-swift', 'Entertainment', 'Singer-songwriter, global superstar.', 498.70, 4.62);

-- Seed 30 days of price history with random walk
DO $$
DECLARE
  p RECORD;
  i INT;
  base NUMERIC;
  px NUMERIC;
BEGIN
  FOR p IN SELECT id, current_price FROM public.personalities LOOP
    base := p.current_price * 0.85;
    FOR i IN 0..29 LOOP
      px := base + (random() * p.current_price * 0.3);
      INSERT INTO public.price_history (personality_id, price, recorded_at)
      VALUES (p.id, ROUND(px::numeric, 2), now() - ((29 - i) || ' days')::interval);
    END LOOP;
    INSERT INTO public.price_history (personality_id, price, recorded_at)
    VALUES (p.id, p.current_price, now());
  END LOOP;
END $$;

-- Seed some events
INSERT INTO public.events (personality_id, headline, impact, occurred_at)
SELECT id, 'Major brand deal announced', 3.20, now() - interval '2 days' FROM public.personalities WHERE slug='cristiano-ronaldo'
UNION ALL SELECT id, 'Hat-trick in Champions League', 4.80, now() - interval '5 days' FROM public.personalities WHERE slug='cristiano-ronaldo'
UNION ALL SELECT id, '$1M giveaway video hits 200M views', 6.10, now() - interval '1 day' FROM public.personalities WHERE slug='mrbeast'
UNION ALL SELECT id, 'Launches new chocolate flavor', 2.30, now() - interval '4 days' FROM public.personalities WHERE slug='mrbeast'
UNION ALL SELECT id, 'Tesla quarterly earnings miss estimates', -4.10, now() - interval '1 day' FROM public.personalities WHERE slug='elon-musk'
UNION ALL SELECT id, 'SpaceX successful Starship launch', 5.20, now() - interval '6 days' FROM public.personalities WHERE slug='elon-musk'
UNION ALL SELECT id, 'UN climate speech goes viral', 2.10, now() - interval '3 days' FROM public.personalities WHERE slug='greta-thunberg'
UNION ALL SELECT id, '40-point triple double vs Warriors', 3.40, now() - interval '2 days' FROM public.personalities WHERE slug='lebron-james'
UNION ALL SELECT id, 'Knee soreness, listed questionable', -2.10, now() - interval '1 day' FROM public.personalities WHERE slug='lebron-james'
UNION ALL SELECT id, 'New album shatters streaming records', 7.20, now() - interval '1 day' FROM public.personalities WHERE slug='taylor-swift'
UNION ALL SELECT id, 'Eras Tour grosses $2B globally', 5.50, now() - interval '7 days' FROM public.personalities WHERE slug='taylor-swift';
