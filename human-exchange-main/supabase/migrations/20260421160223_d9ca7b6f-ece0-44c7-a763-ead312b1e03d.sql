-- Simulation tick: pick one random personality, apply -2%..+3% change, log history
CREATE OR REPLACE FUNCTION public.tick_market()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p RECORD;
  delta_pct numeric;
  new_price numeric;
BEGIN
  SELECT id, current_price INTO p
  FROM public.personalities
  ORDER BY random()
  LIMIT 1;

  IF p.id IS NULL THEN RETURN; END IF;

  -- Random between -2% and +3%
  delta_pct := (random() * 5 - 2);
  new_price := GREATEST(1, round((p.current_price * (1 + delta_pct / 100))::numeric, 2));

  UPDATE public.personalities
  SET current_price = new_price,
      change_pct = round(((new_price - p.current_price) / p.current_price * 100)::numeric, 2)
  WHERE id = p.id;

  INSERT INTO public.price_history (personality_id, price)
  VALUES (p.id, new_price);
END;
$$;

-- Allow anon + authenticated to invoke the tick
GRANT EXECUTE ON FUNCTION public.tick_market() TO anon, authenticated;

-- Enable realtime on the tables the UI subscribes to
ALTER PUBLICATION supabase_realtime ADD TABLE public.personalities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_history;

-- Ensure UPDATE payloads include the full new row
ALTER TABLE public.personalities REPLICA IDENTITY FULL;
ALTER TABLE public.price_history REPLICA IDENTITY FULL;