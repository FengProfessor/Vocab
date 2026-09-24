-- =============================================================================
-- LingoPro Referral & Affiliate Program — Production Database Schema DDL
-- Migration Script for Supabase PostgreSQL (PostgreSQL 15+)
-- File: docs/proposals/referral-system/schema.sql
-- Date: 2026-09-18 (Hardened & Audited Version)
-- =============================================================================

-- Ensure UUID generator extension is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TABLE DEFINITIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1. referral_campaigns: Program configurations, tiers & reward policies
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_campaigns (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text UNIQUE NOT NULL,
  name                  text NOT NULL,
  referee_reward_days   integer NOT NULL DEFAULT 7 CHECK (referee_reward_days >= 0),
  referrer_reward_days  integer NOT NULL DEFAULT 7 CHECK (referrer_reward_days >= 0),
  commission_pct        integer NOT NULL DEFAULT 15 CHECK (commission_pct BETWEEN 0 AND 100),
  ambassador_comm_pct   integer NOT NULL DEFAULT 20 CHECK (ambassador_comm_pct BETWEEN 0 AND 100),
  holding_period_days   integer NOT NULL DEFAULT 7 CHECK (holding_period_days >= 0),
  min_payout_amount     integer NOT NULL DEFAULT 100000 CHECK (min_payout_amount >= 10000),
  monthly_ref_cap       integer NOT NULL DEFAULT 15 CHECK (monthly_ref_cap > 0),
  activation_criteria   jsonb NOT NULL DEFAULT '{"min_streak": 3, "min_words": 30}'::jsonb,
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Seed default standard 2026 campaign
INSERT INTO public.referral_campaigns (slug, name, referee_reward_days, referrer_reward_days, commission_pct, ambassador_comm_pct, holding_period_days, min_payout_amount, monthly_ref_cap, is_active)
VALUES ('standard-2026', 'Chiến dịch Giới thiệu Chuẩn 2026', 7, 7, 15, 20, 7, 100000, 15, true)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 1.2. referral_links: Referral codes and custom sharing slugs per user
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_links (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code         text UNIQUE NOT NULL,
  custom_slug           text UNIQUE,
  clicks_count          integer NOT NULL DEFAULT 0 CHECK (clicks_count >= 0),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_referral_links_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_links_code ON public.referral_links (referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_links_slug ON public.referral_links (custom_slug) WHERE custom_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referral_links_user_id ON public.referral_links (user_id);

-- -----------------------------------------------------------------------------
-- 1.3. referral_logs: Referral relationships, attribution graph & funnel state
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id           uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  referee_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id           uuid REFERENCES public.referral_campaigns(id) ON DELETE SET NULL,
  referral_code         text NOT NULL,
  status                text NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'activated', 'converted', 'fraud_flagged')),
  ip_address            text,
  ip_subnet             text,
  device_fingerprint    text,
  risk_score            integer NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  flagged_reason        text,
  activated_at          timestamptz,
  converted_at          timestamptz,
  first_order_id        uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_referral_logs_referee UNIQUE (referee_id),
  CONSTRAINT chk_no_self_referral CHECK (referrer_id IS NULL OR referrer_id <> referee_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_logs_referrer ON public.referral_logs (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_logs_status ON public.referral_logs (status);
CREATE INDEX IF NOT EXISTS idx_referral_logs_code ON public.referral_logs (referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_logs_created_at ON public.referral_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_logs_ip_subnet ON public.referral_logs (ip_subnet, created_at DESC) WHERE ip_subnet IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 1.4. reward_transactions: Ledger for Pro days & cash commissions
-- Double-entry support: allows negative amounts for payout debits and clawbacks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reward_transactions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_log_id       uuid REFERENCES public.referral_logs(id) ON DELETE SET NULL,
  order_id              uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  reward_type           text NOT NULL CHECK (reward_type IN ('pro_days', 'cash_commission', 'affiliate_cash', 'milestone_bonus', 'payout_debit', 'clawback_debt')),
  pro_days              integer NOT NULL DEFAULT 0 CHECK (pro_days >= 0),
  amount                integer NOT NULL DEFAULT 0,
  status                text NOT NULL DEFAULT 'available'
    CHECK (status IN ('pending_clearance', 'available', 'deducted', 'withdrawn', 'cancelled', 'clawback')),
  available_at          timestamptz NOT NULL DEFAULT now(),
  note                  text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reward_tx_user_status ON public.reward_transactions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_reward_tx_order_id ON public.reward_transactions (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reward_tx_available ON public.reward_transactions (status, available_at);

-- Idempotency Guarantee: Prevent duplicate cash rewards on concurrent webhook retries
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cash_reward_order 
  ON public.reward_transactions (order_id, user_id) 
  WHERE reward_type IN ('affiliate_cash', 'cash_commission');

-- -----------------------------------------------------------------------------
-- 1.5. payout_requests: Withdrawal requests for affiliate commission balances
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount                integer NOT NULL CHECK (amount >= 100000 AND amount <= 2000000),
  bank_name             text NOT NULL,
  bank_account_number   text NOT NULL,
  bank_account_holder   text NOT NULL,
  status                text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_note            text,
  processed_by          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  processed_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_user ON public.payout_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests (status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_bank_acc ON public.payout_requests (bank_account_number);
CREATE INDEX IF NOT EXISTS idx_payout_requests_created_at ON public.payout_requests (created_at DESC);


-- =============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- 2.1. referral_campaigns RLS: Anyone can view active campaigns
DROP POLICY IF EXISTS "Active campaigns viewable by all" ON public.referral_campaigns;
CREATE POLICY "Active campaigns viewable by all"
  ON public.referral_campaigns
  FOR SELECT
  USING (is_active = true);

-- 2.2. referral_links RLS: Tightened security (NO unrestricted USING (true) dump)
-- Authenticated users can view, create, and update their own referral link.
-- Public code resolution MUST use the security definer function fn_resolve_referral_code().
DROP POLICY IF EXISTS "Users can view own referral link" ON public.referral_links;
CREATE POLICY "Users can view own referral link"
  ON public.referral_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own referral link" ON public.referral_links;
CREATE POLICY "Users can create own referral link"
  ON public.referral_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own referral link" ON public.referral_links;
CREATE POLICY "Users can update own referral link"
  ON public.referral_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2.3. referral_logs RLS: Referrers can view their invitees; Mutations strictly restricted
DROP POLICY IF EXISTS "Referrers can view their invited friends" ON public.referral_logs;
CREATE POLICY "Referrers can view their invited friends"
  ON public.referral_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

REVOKE INSERT, UPDATE, DELETE ON TABLE public.referral_logs FROM anon, authenticated;

-- 2.4. reward_transactions RLS: Users can view their own reward ledger; Mutations forbidden
DROP POLICY IF EXISTS "Users can view own reward ledger" ON public.reward_transactions;
CREATE POLICY "Users can view own reward ledger"
  ON public.reward_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON TABLE public.reward_transactions FROM anon, authenticated;

-- 2.5. payout_requests RLS: Direct client INSERTs forbidden; Exclusive access via fn_request_payout()
-- Users can only SELECT their own payout requests.
DROP POLICY IF EXISTS "Users can view own payout requests" ON public.payout_requests;
CREATE POLICY "Users can view own payout requests"
  ON public.payout_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Direct client INSERT, UPDATE, DELETE are strictly revoked to prevent arbitrary balance drain bypass
REVOKE INSERT, UPDATE, DELETE ON TABLE public.payout_requests FROM anon, authenticated;


-- =============================================================================
-- 3. STORED PROCEDURES & BUSINESS LOGIC FUNCTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.0. fn_resolve_referral_code(p_code text)
-- Secure public invite resolution without exposing full table scanning
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_resolve_referral_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_link     public.referral_links%ROWTYPE;
  v_referrer public.profiles%ROWTYPE;
BEGIN
  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'empty_code');
  END IF;

  SELECT * INTO v_link
  FROM public.referral_links
  WHERE upper(trim(referral_code)) = upper(trim(p_code))
     OR lower(trim(custom_slug)) = lower(trim(p_code));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  -- Atomically increment click count
  UPDATE public.referral_links
  SET clicks_count = clicks_count + 1,
      updated_at = now()
  WHERE id = v_link.id;

  SELECT * INTO v_referrer
  FROM public.profiles
  WHERE id = v_link.user_id;

  RETURN jsonb_build_object(
    'valid', true,
    'referral_code', v_link.referral_code,
    'custom_slug', v_link.custom_slug,
    'referrer_id', v_link.user_id,
    'referrer_name', coalesce(v_referrer.full_name, 'Học viên LingoPro'),
    'referrer_avatar', v_referrer.avatar_url
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_resolve_referral_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.fn_resolve_referral_code(text) TO anon, authenticated;


-- -----------------------------------------------------------------------------
-- 3.1. fn_evaluate_referral_activation(p_referee_id uuid)
-- Evaluates learning milestones (Streak >= 3 AND Words >= 30) with:
-- 1. SQL three-valued logic safety (COALESCE against empty user_gamification)
-- 2. Anti-bot dwell time check (referee account age >= 24h OR 2 distinct learning days, plus >60s srs dwell)
-- 3. Monthly referrer cap enforcement (referral_campaigns.monthly_ref_cap)
-- 4. Correct subscription history rank preservation for Premium users
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_evaluate_referral_activation(p_referee_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_log                     public.referral_logs%ROWTYPE;
  v_campaign                public.referral_campaigns%ROWTYPE;
  v_streak                  integer := 0;
  v_words                   integer := 0;
  v_min_streak              integer := 3;
  v_min_words               integer := 30;
  v_reward_days             integer := 7;
  v_monthly_cap             integer := 15;
  v_now                     timestamptz := now();
  v_referee_prof            public.profiles%ROWTYPE;
  v_referrer_prof           public.profiles%ROWTYPE;
  v_new_referee_exp         timestamptz;
  v_new_ref_exp             timestamptz;
  v_srs_count               integer := 0;
  v_words_count             integer := 0;
  v_distinct_days           integer := 0;
  v_srs_dwell               interval;
  v_referrer_month_rewards  integer := 0;
  v_referrer_cap_reached    boolean := false;
BEGIN
  -- 1. Check if an active registered referral log exists for referee
  SELECT * INTO v_log
  FROM public.referral_logs
  WHERE referee_id = p_referee_id AND status = 'registered'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_registered_referral');
  END IF;

  -- 2. Retrieve campaign configurations
  IF v_log.campaign_id IS NOT NULL THEN
    SELECT * INTO v_campaign FROM public.referral_campaigns WHERE id = v_log.campaign_id;
    IF FOUND THEN
      v_reward_days := v_campaign.referee_reward_days;
      v_min_streak := coalesce((v_campaign.activation_criteria->>'min_streak')::integer, 3);
      v_min_words := coalesce((v_campaign.activation_criteria->>'min_words')::integer, 30);
      v_monthly_cap := coalesce(v_campaign.monthly_ref_cap, 15);
    END IF;
  END IF;

  -- 3. Retrieve Referee Profile for Account Age Dwell-Time Check
  SELECT * INTO v_referee_prof FROM public.profiles WHERE id = p_referee_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'referee_profile_not_found');
  END IF;

  -- 4. Evaluate Referee Streak safely (Scalar subquery prevents NULL assignment if record does not exist)
  SELECT coalesce((
    SELECT current_streak FROM public.user_gamification WHERE user_id = p_referee_id
  ), 0) INTO v_streak;

  -- 5. Evaluate Referee Words Count (SRS + words table)
  SELECT count(*) INTO v_srs_count FROM public.srs_progress WHERE user_id = p_referee_id;
  SELECT count(*) INTO v_words_count FROM public.words WHERE added_by = p_referee_id;
  v_words := greatest(coalesce(v_srs_count, 0), coalesce(v_words_count, 0));

  -- 6. Validate Activation Criteria: streak >= min_streak AND words >= min_words
  -- Must satisfy BOTH conditions: continuous streak >= 3 days AND word count >= 30
  -- Strict COALESCE ensures three-valued logic cannot slip NULL past comparison
  IF coalesce(v_streak, 0) < v_min_streak OR coalesce(v_words, 0) < v_min_words THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'criteria_not_met',
      'current_streak', coalesce(v_streak, 0),
      'min_streak', v_min_streak,
      'current_words', coalesce(v_words, 0),
      'min_words', v_min_words
    );
  END IF;

  -- 7. Anti-Bot Dwell Time & Temporal Engagement Verification
  -- Requirement: referee account age >= 24h OR learning activity across at least 2 distinct days
  SELECT count(DISTINCT date(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')) INTO v_distinct_days
  FROM public.srs_progress
  WHERE user_id = p_referee_id;

  IF (v_referee_prof.created_at > (v_now - interval '24 hours')) AND (coalesce(v_distinct_days, 0) < 2) THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'dwell_time_not_met',
      'message', 'Tài khoản cần có thời gian hoạt động tối thiểu 24h hoặc học tập qua 2 ngày riêng biệt'
    );
  END IF;

  -- Fast-review bot defense: If word count was satisfied via SRS, verify dwell duration between reviews >= 60s
  IF v_words >= v_min_words AND v_srs_count >= v_min_words THEN
    SELECT (max(created_at) - min(created_at)) INTO v_srs_dwell
    FROM public.srs_progress
    WHERE user_id = p_referee_id;

    IF v_srs_dwell IS NOT NULL AND v_srs_dwell < interval '60 seconds' THEN
      UPDATE public.referral_logs
      SET status = 'fraud_flagged',
          flagged_reason = 'Dwell-time bất thường trên srs_progress (< 60s cho 30 từ, nghi vấn bot)'
      WHERE id = v_log.id;

      RETURN jsonb_build_object(
        'success', false,
        'reason', 'bot_dwell_time_violation',
        'message', 'Phát hiện tốc độ học bất thường vi phạm chính sách chống bot'
      );
    END IF;
  END IF;

  -- 8. Criteria Satisfied -> Mark referral as activated
  UPDATE public.referral_logs
  SET status = 'activated', activated_at = v_now
  WHERE id = v_log.id;

  -- 9. Grant Pro VIP Days to Referee
  IF v_referee_prof.plan_expires_at IS NOT NULL AND v_referee_prof.plan_expires_at > v_now THEN
    v_new_referee_exp := v_referee_prof.plan_expires_at + make_interval(days => v_reward_days);
  ELSE
    v_new_referee_exp := v_now + make_interval(days => v_reward_days);
  END IF;

  UPDATE public.profiles
  SET plan = CASE WHEN plan = 'premium' AND plan_expires_at > v_now THEN 'premium' ELSE 'pro' END,
      plan_expires_at = v_new_referee_exp
  WHERE id = p_referee_id;

  -- Log to subscription_history with tier rank preservation
  INSERT INTO public.subscription_history (user_id, old_plan, new_plan, reason)
  VALUES (
    p_referee_id,
    v_referee_prof.plan,
    CASE WHEN v_referee_prof.plan = 'premium' AND v_referee_prof.plan_expires_at > v_now THEN 'premium' ELSE 'pro' END,
    'referral_activation_referee'
  );

  -- Log to reward_transactions
  INSERT INTO public.reward_transactions (user_id, referral_log_id, reward_type, pro_days, amount, status, note)
  VALUES (p_referee_id, v_log.id, 'pro_days', v_reward_days, 0, 'available', 'Tặng 7 ngày Pro kích hoạt giới thiệu');

  -- 10. Enforce Monthly Referrer Cap & Grant Pro VIP Days to Referrer
  IF v_log.referrer_id IS NOT NULL THEN
    -- Check count of Pro VIP rewards received by this referrer in the current calendar month
    SELECT count(*) INTO v_referrer_month_rewards
    FROM public.reward_transactions
    WHERE user_id = v_log.referrer_id
      AND reward_type = 'pro_days'
      AND status IN ('available', 'pending_clearance')
      AND created_at >= date_trunc('month', v_now);

    IF v_referrer_month_rewards >= v_monthly_cap THEN
      -- Cap reached: Reject / flag referrer Pro days reward without granting extra days
      v_referrer_cap_reached := true;
      INSERT INTO public.reward_transactions (user_id, referral_log_id, reward_type, pro_days, amount, status, note)
      VALUES (
        v_log.referrer_id,
        v_log.id,
        'pro_days',
        0,
        0,
        'cancelled',
        format('Đã đạt giới hạn trần %s lượt mời/tháng (monthly_ref_cap). Không cấp thêm Pro VIP.', v_monthly_cap)
      );
    ELSE
      -- Referrer within cap: Grant reward
      SELECT * INTO v_referrer_prof FROM public.profiles WHERE id = v_log.referrer_id FOR UPDATE;
      IF FOUND THEN
        IF v_referrer_prof.plan_expires_at IS NOT NULL AND v_referrer_prof.plan_expires_at > v_now THEN
          v_new_ref_exp := v_referrer_prof.plan_expires_at + make_interval(days => v_reward_days);
        ELSE
          v_new_ref_exp := v_now + make_interval(days => v_reward_days);
        END IF;

        UPDATE public.profiles
        SET plan = CASE WHEN plan = 'premium' AND plan_expires_at > v_now THEN 'premium' ELSE 'pro' END,
            plan_expires_at = v_new_ref_exp
        WHERE id = v_log.referrer_id;

        -- Log to subscription_history
        INSERT INTO public.subscription_history (user_id, old_plan, new_plan, reason)
        VALUES (
          v_log.referrer_id,
          v_referrer_prof.plan,
          CASE WHEN v_referrer_prof.plan = 'premium' AND v_referrer_prof.plan_expires_at > v_now THEN 'premium' ELSE 'pro' END,
          'referral_activation_referrer'
        );

        -- Log to reward_transactions
        INSERT INTO public.reward_transactions (user_id, referral_log_id, reward_type, pro_days, amount, status, note)
        VALUES (v_log.referrer_id, v_log.id, 'pro_days', v_reward_days, 0, 'available', 'Thưởng người mời khi bạn bè hoàn thành kích hoạt');
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'referee_id', p_referee_id,
    'referrer_id', v_log.referrer_id,
    'pro_days_awarded', v_reward_days,
    'referrer_cap_reached', v_referrer_cap_reached,
    'referee_new_expires_at', v_new_referee_exp
  );
END;
$$;


-- -----------------------------------------------------------------------------
-- 3.2. fn_process_referral_reward(p_order_id, p_referee_id, p_order_amount)
-- Allocates cash commission to Referrer upon confirmed paid order:
-- 1. Idempotency guaranteed via UNIQUE INDEX and IF EXISTS check
-- 2. Fraud protection: Checks referral_logs.status != 'fraud_flagged'
-- 3. Format type safety without PostgreSQL string concatenation errors
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_process_referral_reward(
  p_order_id      uuid,
  p_referee_id    uuid,
  p_order_amount  integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_log                   public.referral_logs%ROWTYPE;
  v_campaign              public.referral_campaigns%ROWTYPE;
  v_comm_pct              integer := 15;
  v_holding_days          integer := 7;
  v_commission_val        integer := 0;
  v_available_at          timestamptz;
  v_now                   timestamptz := now();
  v_referrer_active_count integer := 0;
BEGIN
  -- 1. Check idempotency: Return immediately if cash reward already processed for this order
  IF EXISTS (
    SELECT 1 FROM public.reward_transactions 
    WHERE order_id = p_order_id 
      AND reward_type IN ('cash_commission', 'affiliate_cash')
  ) THEN
    RETURN jsonb_build_object('reward_awarded', false, 'status', 'duplicate_order_ignored');
  END IF;

  -- 2. Query referral log with row lock for this referee
  SELECT * INTO v_log
  FROM public.referral_logs
  WHERE referee_id = p_referee_id
  FOR UPDATE;

  IF NOT FOUND OR v_log.referrer_id IS NULL THEN
    RETURN jsonb_build_object('reward_awarded', false, 'status', 'no_referrer_found');
  END IF;

  -- 3. Fraud Flag Check: Do not award commissions or transition to converted if fraud was flagged
  IF v_log.status = 'fraud_flagged' THEN
    RETURN jsonb_build_object(
      'reward_awarded', false,
      'status', 'fraud_flagged_ignored',
      'reason', 'Lượt giới thiệu đã bị gắn cờ gian lận, không áp dụng hoa hồng'
    );
  END IF;

  -- 4. Load Campaign parameters
  IF v_log.campaign_id IS NOT NULL THEN
    SELECT * INTO v_campaign FROM public.referral_campaigns WHERE id = v_log.campaign_id;
    IF FOUND THEN
      v_comm_pct := v_campaign.commission_pct;
      v_holding_days := v_campaign.holding_period_days;
    END IF;
  END IF;

  -- 5. Check Ambassador Tier: If referrer has >= 20 converted referrals (Mốc 5), upgrade to 20%
  SELECT count(*) INTO v_referrer_active_count
  FROM public.referral_logs
  WHERE referrer_id = v_log.referrer_id AND status = 'converted';

  IF v_referrer_active_count >= 20 THEN
    v_comm_pct := greatest(v_comm_pct, 20);
  END IF;

  -- 6. Calculate commission amount strictly on NET paid order amount
  v_commission_val := round(p_order_amount * v_comm_pct / 100.0);
  IF v_commission_val <= 0 THEN
    RETURN jsonb_build_object('reward_awarded', false, 'status', 'zero_commission');
  END IF;

  -- 7. Determine holding period (14 days for annual plans >= 500k, 7 days for monthly)
  IF p_order_amount >= 500000 THEN
    v_holding_days := greatest(v_holding_days, 14);
  END IF;
  v_available_at := v_now + make_interval(days => v_holding_days);

  -- 8. Insert into reward_transactions as pending_clearance
  -- Uses format() to avoid PostgreSQL operator does not exist: text || uuid runtime error
  INSERT INTO public.reward_transactions (
    user_id,
    referral_log_id,
    order_id,
    reward_type,
    amount,
    status,
    available_at,
    note
  ) VALUES (
    v_log.referrer_id,
    v_log.id,
    p_order_id,
    'cash_commission',
    v_commission_val,
    'pending_clearance',
    v_available_at,
    format('Hoa hồng giới thiệu %s%% cho đơn hàng #%s', v_comm_pct, p_order_id::text)
  );

  -- 9. Update referral log state to converted
  UPDATE public.referral_logs
  SET status = 'converted',
      converted_at = v_now,
      first_order_id = coalesce(first_order_id, p_order_id)
  WHERE id = v_log.id;

  RETURN jsonb_build_object(
    'reward_awarded', true,
    'referrer_id', v_log.referrer_id,
    'commission_amount', v_commission_val,
    'commission_pct', v_comm_pct,
    'available_at', v_available_at
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 3.2.1. Overload for fn_process_referral_reward with single argument (p_order_id)
-- Resolves user_id (referee) and amount directly from the orders table
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_process_referral_reward(
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_order record;
BEGIN
  SELECT user_id, amount INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('reward_awarded', false, 'status', 'order_not_found');
  END IF;

  RETURN public.fn_process_referral_reward(p_order_id, v_order.user_id, v_order.amount);
END;
$$;


-- -----------------------------------------------------------------------------
-- 3.3. fn_clear_matured_rewards()
-- Automated maintenance procedure to mature pending_clearance transactions
-- whose holding period has passed (available_at <= now())
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_clear_matured_rewards()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_cleared_count integer := 0;
BEGIN
  UPDATE public.reward_transactions SET status = 'available' WHERE status = 'pending_clearance'
    AND available_at <= now()
    AND reward_type IN ('cash_commission', 'affiliate_cash', 'milestone_bonus');

  GET DIAGNOSTICS v_cleared_count = ROW_COUNT;
  RETURN v_cleared_count;
END;
$$;


-- -----------------------------------------------------------------------------
-- 3.4. fn_request_payout(...)
-- Hardened withdrawal request procedure:
-- 1. Row-level locking on user profile (PERFORM FOR UPDATE) prevents double-spending
-- 2. Enforces daily withdrawal cap (max 2,000,000đ per 24 hours)
-- 3. Enforces cross-user bank account deduplication (Anti-Sybil/KYC)
-- 4. Automatically matures expired holding periods
-- 5. Atomic ledger debit entry (reward_type = 'payout_debit', amount = -p_amount)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_request_payout(
  p_user_id             uuid,
  p_amount              integer,
  p_bank_name           text,
  p_bank_account_number text,
  p_bank_account_holder text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_available_credits integer := 0;
  v_withdrawn_payouts integer := 0;
  v_net_available     integer := 0;
  v_daily_payout_sum  integer := 0;
  v_new_payout_id     uuid;
  v_now               timestamptz := now();
BEGIN
  -- 1. Validate Input Parameters
  IF p_amount < 100000 THEN
    RAISE EXCEPTION 'Số tiền rút tối thiểu là 100.000 VNĐ' USING errcode = 'P0001';
  END IF;

  IF p_amount > 2000000 THEN
    RAISE EXCEPTION 'Số tiền rút tối đa cho mỗi yêu cầu là 2.000.000 VNĐ' USING errcode = 'P0004';
  END IF;

  IF trim(p_bank_name) = '' OR trim(p_bank_account_number) = '' OR trim(p_bank_account_holder) = '' THEN
    RAISE EXCEPTION 'Vui lòng điền đầy đủ thông tin ngân hàng thụ hưởng' USING errcode = 'P0002';
  END IF;

  -- 2. ROW-LEVEL LOCK ON USER PROFILE (Serializes concurrent requests, prevents double-spend race condition)
  PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  -- 3. Enforce Daily Payout Cap (max 2,000,000đ per 24 hours per user)
  SELECT coalesce(sum(amount), 0) INTO v_daily_payout_sum
  FROM public.payout_requests
  WHERE user_id = p_user_id
    AND status IN ('pending', 'approved', 'completed')
    AND created_at >= (v_now - interval '24 hours');

  IF (v_daily_payout_sum + p_amount) > 2000000 THEN
    RAISE EXCEPTION 'Vượt quá hạn mức rút tiền tối đa 2.000.000 VNĐ trong 24 giờ (Đã yêu cầu: % VNĐ, Yêu cầu thêm: % VNĐ)', v_daily_payout_sum, p_amount USING errcode = 'P0005';
  END IF;

  -- 4. Enforce Bank Account Deduplication Across Users (Anti-Sybil KYC Protection)
  IF EXISTS (
    SELECT 1 FROM public.payout_requests
    WHERE bank_account_number = trim(p_bank_account_number)
      AND user_id <> p_user_id
      AND status IN ('pending', 'approved', 'completed')
  ) THEN
    RAISE EXCEPTION 'Số tài khoản ngân hàng này đã được liên kết với một tài khoản học viên khác. Vui lòng liên hệ bộ phận hỗ trợ để xác thực KYC.' USING errcode = 'P0006';
  END IF;

  -- 5. Automatically Mature Holding Period Rewards for this User
  UPDATE public.reward_transactions
  SET status = 'available'
  WHERE user_id = p_user_id
    AND status = 'pending_clearance'
    AND available_at <= v_now
    AND reward_type IN ('cash_commission', 'affiliate_cash', 'milestone_bonus');

  -- 6. Calculate Net Available Balance using Double-Entry Ledger (Credits minus Debits)
  SELECT coalesce(sum(amount), 0) INTO v_net_available
  FROM public.reward_transactions
  WHERE user_id = p_user_id
    AND status IN ('available', 'deducted')
    AND available_at <= v_now
    AND reward_type IN ('cash_commission', 'affiliate_cash', 'milestone_bonus', 'payout_debit');

  IF v_net_available < p_amount THEN
    RAISE EXCEPTION 'Số dư hoa hồng khả dụng không đủ (Khả dụng: % VNĐ, Yêu cầu: % VNĐ)', v_net_available, p_amount USING errcode = 'P0003';
  END IF;

  -- 7. Create Payout Request Record
  INSERT INTO public.payout_requests (
    user_id,
    amount,
    bank_name,
    bank_account_number,
    bank_account_holder,
    status
  ) VALUES (
    p_user_id,
    p_amount,
    trim(p_bank_name),
    trim(p_bank_account_number),
    upper(trim(p_bank_account_holder)),
    'pending'
  ) RETURNING id INTO v_new_payout_id;

  -- 8. Atomic Ledger Debit Entry: Immediately record negative transaction to deduct available balance
  INSERT INTO public.reward_transactions (
    user_id,
    reward_type,
    amount,
    status,
    available_at,
    note
  ) VALUES (
    p_user_id,
    'payout_debit',
    -p_amount,
    'deducted',
    v_now,
    format('Ghi nợ yêu cầu rút tiền #%s về ngân hàng %s (%s)', v_new_payout_id::text, p_bank_name, p_bank_account_number)
  );

  RETURN jsonb_build_object(
    'success', true,
    'payout_id', v_new_payout_id,
    'amount', p_amount,
    'remaining_available', (v_net_available - p_amount)
  );
END;
$$;


-- -----------------------------------------------------------------------------
-- 3.5. Trigger: Auto-Clawback Rewards on Order Refund / Cancellation
-- 1. Triggers on status IN ('refunded', 'cancelled')
-- 2. Updates reward_transactions to 'clawback'
-- 3. Automatically rejects any pending payout requests for that user, preventing cashouts on refunded orders
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_handle_order_refund_clawback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_tx record;
BEGIN
  IF NEW.status IN ('refunded', 'cancelled') AND OLD.status NOT IN ('refunded', 'cancelled') THEN
    FOR v_tx IN
      SELECT * FROM public.reward_transactions
      WHERE order_id = NEW.id AND status IN ('pending_clearance', 'available')
      FOR UPDATE
    LOOP
      -- 1. Update reward transaction to clawback
      UPDATE public.reward_transactions
      SET status = 'clawback',
          note = format('Tự động thu hồi do đơn hàng #%s chuyển trạng thái sang %s vào lúc %s', NEW.id::text, NEW.status, now()::text)
      WHERE id = v_tx.id;

      -- 2. Automatically cancel / reject any pending payout requests associated with this user
      UPDATE public.payout_requests
      SET status = 'rejected',
          admin_note = format('Hệ thống tự động hủy do đơn hàng #%s liên kết bị hoàn tiền hoặc hủy bỏ', NEW.id::text)
      WHERE user_id = v_tx.user_id AND status = 'pending';
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_refund_clawback ON public.orders;
CREATE TRIGGER trg_order_refund_clawback
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_handle_order_refund_clawback();

-- =============================================================================
-- End of Migration Script
-- =============================================================================
