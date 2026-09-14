-- Migration v2: Challenge Campaign — Model C (Hybrid Revenue)
-- Adds: refund_cash_amount, streak freeze support, reward choice tracking

-- 1. Add new columns to challenges table
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS refund_cash_amount integer NOT NULL DEFAULT 200000,
  ADD COLUMN IF NOT EXISTS streak_freeze_price integer NOT NULL DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS max_streak_freezes integer NOT NULL DEFAULT 3;

COMMENT ON COLUMN public.challenges.refund_cash_amount IS 'Fixed cash refund amount for successful participants who choose cash (VND)';
COMMENT ON COLUMN public.challenges.streak_freeze_price IS 'Price to buy one streak freeze (VND)';
COMMENT ON COLUMN public.challenges.max_streak_freezes IS 'Maximum streak freezes allowed per participant';

-- 2. Add new columns to challenge_participants table
ALTER TABLE public.challenge_participants
  ADD COLUMN IF NOT EXISTS streak_freezes_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_choice text CHECK (reward_choice IN ('cash', 'pro', NULL));

COMMENT ON COLUMN public.challenge_participants.streak_freezes_used IS 'Number of streak freezes used so far';
COMMENT ON COLUMN public.challenge_participants.reward_choice IS 'Chosen reward: cash refund or bonus Pro time (set upon completion)';

-- 3. Create streak_freeze_purchases table for tracking freeze purchases
CREATE TABLE IF NOT EXISTS public.streak_freeze_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.challenge_participants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  used_for_date date NOT NULL,
  amount_paid integer NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(participant_id, used_for_date)
);

CREATE INDEX IF NOT EXISTS idx_streak_freeze_participant ON public.streak_freeze_purchases(participant_id);

-- RLS for streak_freeze_purchases
ALTER TABLE public.streak_freeze_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak freezes"
  ON public.streak_freeze_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages streak freezes"
  ON public.streak_freeze_purchases FOR ALL
  USING (auth.role() = 'service_role');
