-- Atomic trade function with row-level locking to prevent race conditions
-- Replaces the multi-step approach in api/trade.ts with a single DB transaction

CREATE OR REPLACE FUNCTION execute_trade(
  p_user_id UUID,
  p_personality_id UUID,
  p_side TEXT,        -- 'buy' or 'sell'
  p_shares INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_price NUMERIC;
  v_balance NUMERIC;
  v_total NUMERIC;
  v_holding_shares INT;
  v_holding_avg NUMERIC;
  v_new_balance NUMERIC;
  v_new_shares INT;
  v_new_avg NUMERIC;
  v_result JSONB;
BEGIN
  -- 1. Lock profile row and get current balance
  SELECT balance INTO v_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User profile not found');
  END IF;

  -- 2. Get authoritative price from personalities
  SELECT current_price INTO v_price
  FROM personalities
  WHERE id = p_personality_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Personality not found');
  END IF;

  v_total := v_price * p_shares;

  -- 3. Lock or get holding row
  SELECT shares, avg_cost INTO v_holding_shares, v_holding_avg
  FROM holdings
  WHERE user_id = p_user_id AND personality_id = p_personality_id
  FOR UPDATE;

  -- 4. Business rule validation
  IF p_side = 'buy' THEN
    IF v_total > v_balance THEN
      RETURN jsonb_build_object(
        'error', 'Insufficient HMX balance',
        'needed', v_total,
        'have', v_balance
      );
    END IF;
  ELSE
    IF v_holding_shares IS NULL OR p_shares > v_holding_shares THEN
      RETURN jsonb_build_object(
        'error', 'Insufficient shares',
        'requested', p_shares,
        'owned', COALESCE(v_holding_shares, 0)
      );
    END IF;
  END IF;

  -- 5. Insert transaction record
  INSERT INTO transactions (user_id, personality_id, side, shares, price, total)
  VALUES (p_user_id, p_personality_id, p_side, p_shares, v_price, v_total);

  -- 6. Update balance
  IF p_side = 'buy' THEN
    v_new_balance := v_balance - v_total;
  ELSE
    v_new_balance := v_balance + v_total;
  END IF;

  UPDATE profiles SET balance = v_new_balance WHERE id = p_user_id;

  -- 7. Upsert/delete holding
  IF p_side = 'buy' THEN
    v_new_shares := COALESCE(v_holding_shares, 0) + p_shares;
    v_new_avg := ((COALESCE(v_holding_shares, 0) * COALESCE(v_holding_avg, 0)) + v_total) / v_new_shares;

    INSERT INTO holdings (user_id, personality_id, shares, avg_cost, updated_at)
    VALUES (p_user_id, p_personality_id, v_new_shares, v_new_avg, NOW())
    ON CONFLICT (user_id, personality_id)
    DO UPDATE SET shares = EXCLUDED.shares, avg_cost = EXCLUDED.avg_cost, updated_at = EXCLUDED.updated_at;

    v_result := jsonb_build_object(
      'success', true,
      'newBalance', v_new_balance,
      'newHolding', jsonb_build_object('shares', v_new_shares, 'avg_cost', v_new_avg)
    );
  ELSE
    v_new_shares := v_holding_shares - p_shares;

    IF v_new_shares <= 0 THEN
      DELETE FROM holdings WHERE user_id = p_user_id AND personality_id = p_personality_id;
      v_result := jsonb_build_object(
        'success', true,
        'newBalance', v_new_balance,
        'newHolding', NULL
      );
    ELSE
      UPDATE holdings SET shares = v_new_shares, updated_at = NOW()
      WHERE user_id = p_user_id AND personality_id = p_personality_id;

      v_result := jsonb_build_object(
        'success', true,
        'newBalance', v_new_balance,
        'newHolding', jsonb_build_object('shares', v_new_shares, 'avg_cost', v_holding_avg)
      );
    END IF;
  END IF;

  RETURN v_result;
END;
$$;

-- Grant execute to service role (used by supabaseAdmin)
GRANT EXECUTE ON FUNCTION execute_trade(UUID, UUID, TEXT, INT) TO service_role;
