-- Imbunatatire tick_market cu sentiment bazat pe date externe
-- Aceasta functie acum accepta un delta_pct calculat de frontend
-- si il aplica in loc de random

CREATE OR REPLACE FUNCTION public.tick_market_with_delta(
  p_personality_id UUID,
  p_delta_pct NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p RECORD;
  new_price NUMERIC;
  clamped_delta NUMERIC;
BEGIN
  SELECT id, current_price INTO p
  FROM public.personalities
  WHERE id = p_personality_id;

  IF p.id IS NULL THEN RETURN; END IF;

  -- Limiteaza delta la -8% / +8% per ciclu
  clamped_delta := GREATEST(-8, LEAST(8, p_delta_pct));

  new_price := GREATEST(1, ROUND((p.current_price * (1 + clamped_delta / 100))::NUMERIC, 2));

  UPDATE public.personalities
  SET current_price = new_price,
      change_pct = ROUND(clamped_delta::NUMERIC, 2)
  WHERE id = p.id;

  INSERT INTO public.price_history (personality_id, price)
  VALUES (p.id, new_price);
END;
$$;

-- Permite anon + authenticated sa invoce functia
GRANT EXECUTE ON FUNCTION public.tick_market_with_delta(UUID, NUMERIC) TO anon, authenticated;
