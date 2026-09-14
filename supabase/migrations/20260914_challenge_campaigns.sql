-- =============================================
-- Challenge Campaigns — Commitment-based daily learning
-- =============================================
-- Participants pay a deposit, receive Pro for the campaign duration.
-- If they study daily without missing a single day → full refund + bonus Pro.
-- If they miss a day → deposit forfeited.
-- =============================================

-- 1. CHALLENGES: campaign definitions (admin-created)
CREATE TABLE IF NOT EXISTS public.challenges (
  id                     uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name                   text NOT NULL,
  slug                   text UNIQUE NOT NULL,
  description            text,
  duration_days          int NOT NULL CHECK (duration_days > 0),
  deposit_amount         int NOT NULL CHECK (deposit_amount >= 0),  -- VNĐ
  refund_pct             int NOT NULL DEFAULT 100 CHECK (refund_pct BETWEEN 0 AND 100),
  bonus_pro_days         int NOT NULL DEFAULT 0 CHECK (bonus_pro_days >= 0),

  -- Tiêu chí học hằng ngày — JSONB linh hoạt, admin cấu hình
  -- Keys: min_srs_reviews, min_quizzes, min_reading_sessions, min_listening_sessions
  daily_criteria         jsonb NOT NULL DEFAULT '{
    "min_srs_reviews": 10,
    "min_quizzes": 1,
    "min_reading_sessions": 0,
    "min_listening_sessions": 0
  }'::jsonb,

  -- Lifecycle timestamps
  registration_opens_at  timestamptz NOT NULL,
  registration_closes_at timestamptz NOT NULL,
  starts_at              timestamptz NOT NULL,   -- ngày bắt đầu tính streak
  ends_at                timestamptz NOT NULL,   -- ngày kết thúc

  max_participants       int,                     -- null = unlimited
  status                 text DEFAULT 'draft' CHECK (status IN ('draft','open','active','completed','cancelled')),
  created_by             uuid REFERENCES public.profiles(id),
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now(),

  -- Sanity constraints
  CONSTRAINT chk_registration_window CHECK (registration_opens_at < registration_closes_at),
  CONSTRAINT chk_campaign_window CHECK (starts_at < ends_at),
  CONSTRAINT chk_reg_before_start CHECK (registration_closes_at <= starts_at)
);

-- 2. CHALLENGE_PARTICIPANTS: enrollment + lifecycle
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id               uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  challenge_id     uuid REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id          uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_id         uuid REFERENCES public.orders(id),

  status           text DEFAULT 'pending' CHECK (status IN (
    'pending',      -- chờ thanh toán
    'active',       -- đang tham gia (đã thanh toán)
    'failed',       -- miss 1 ngày → out
    'completed',    -- hoàn thành toàn bộ chiến dịch
    'refunded'      -- đã hoàn tiền thành công
  )),

  joined_at        timestamptz DEFAULT now(),
  activated_at     timestamptz,                -- khi thanh toán thành công
  failed_at        timestamptz,
  failed_reason    text,                       -- e.g. "Missed 2026-10-05"
  completed_at     timestamptz,
  refunded_at      timestamptz,
  refund_amount    int,                        -- VNĐ
  bonus_expires_at timestamptz,                -- hạn Pro thưởng

  current_streak   int DEFAULT 0,
  longest_streak   int DEFAULT 0,
  total_active_days int DEFAULT 0,

  UNIQUE(challenge_id, user_id)
);

-- 3. CHALLENGE_DAILY_LOG: 1 row per participant per calendar day (VN timezone)
CREATE TABLE IF NOT EXISTS public.challenge_daily_log (
  id                 uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_id     uuid REFERENCES public.challenge_participants(id) ON DELETE CASCADE NOT NULL,
  user_id            uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id       uuid REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  log_date           date NOT NULL,

  -- Raw metrics for the day
  srs_reviews        int DEFAULT 0,
  quizzes_done       int DEFAULT 0,
  reading_sessions   int DEFAULT 0,
  listening_sessions int DEFAULT 0,
  xp_earned          int DEFAULT 0,

  -- Verdict
  criteria_met       boolean DEFAULT false,
  checked_at         timestamptz,

  UNIQUE(participant_id, log_date)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_slug ON public.challenges(slug);
CREATE INDEX IF NOT EXISTS idx_challenges_starts_at ON public.challenges(starts_at);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_status ON public.challenge_participants(status);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_status
  ON public.challenge_participants(challenge_id, status);

CREATE INDEX IF NOT EXISTS idx_challenge_daily_log_participant ON public.challenge_daily_log(participant_id);
CREATE INDEX IF NOT EXISTS idx_challenge_daily_log_date ON public.challenge_daily_log(log_date);
CREATE INDEX IF NOT EXISTS idx_challenge_daily_log_participant_date
  ON public.challenge_daily_log(participant_id, log_date);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_daily_log ENABLE ROW LEVEL SECURITY;

-- Challenges: everyone can read non-draft, admin manages via service client
CREATE POLICY "Anyone can view published challenges" ON public.challenges
  FOR SELECT USING (status != 'draft');

-- Participants: users see own, admin all (service client)
CREATE POLICY "Users view own participation" ON public.challenge_participants
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users join challenges" ON public.challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily log: users see own
CREATE POLICY "Users view own daily log" ON public.challenge_daily_log
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- HELPER: update updated_at on challenges
-- =============================================
CREATE OR REPLACE FUNCTION public.update_challenges_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_challenges_updated_at ON public.challenges;
CREATE TRIGGER trg_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_challenges_updated_at();

-- =============================================
-- Add 'challenge' to orders.order_kind if the column exists
-- (order_kind was added in a previous migration for group plans)
-- =============================================
DO $$
BEGIN
  -- Check if order_kind column exists and update its constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_kind'
  ) THEN
    -- Drop old constraint if it exists
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_kind_check;
    -- Add new constraint including 'challenge'
    ALTER TABLE public.orders ADD CONSTRAINT orders_order_kind_check
      CHECK (order_kind IN ('individual', 'group', 'challenge'));
  END IF;
END $$;
