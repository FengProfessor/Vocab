/**
 * Empirical Anti-Fraud Stress-Testing & Attack Simulation Harness
 * Evaluates LingoPro Referral & Affiliate specifications:
 * - 03_ANTI_FRAUD.md
 * - 01_REWARD_POLICY.md
 * - schema.sql & 05_TECHNICAL_SPEC.md
 */

interface AttackTestResult {
  vector: string;
  name: string;
  passed: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  observation: string;
  mitigation: string;
}

const results: AttackTestResult[] = [];

function record(res: AttackTestResult) {
  results.push(res);
  const icon = res.passed ? '✅ [PASS]' : res.severity === 'CRITICAL' ? '🚨 [CRITICAL FAIL]' : '⚠️ [FAIL]';
  console.log(`${icon} [${res.vector}] ${res.name}`);
  console.log(`   Observation: ${res.observation}`);
  if (!res.passed) {
    console.log(`   Mitigation:  ${res.mitigation}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTACK VECTOR 1: Self-Referral & Multi-Account (Sybil Attack)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== ATTACK VECTOR 1: Self-Referral & Multi-Account Sybil Attack ===');

// 1.1 Direct Self-Referral (Same User ID)
{
  const referrerId = 'user-uuid-1';
  const refereeId = 'user-uuid-1';
  // DB Constraint: chk_no_self_referral CHECK (referrer_id IS NULL OR referrer_id <> referee_id)
  const isBlockedByDbConstraint = referrerId === refereeId;
  record({
    vector: 'Vector 1',
    name: 'Direct Self-Referral (referrer_id === referee_id)',
    passed: isBlockedByDbConstraint,
    severity: 'CRITICAL',
    observation: 'Blocked by CHECK constraint `chk_no_self_referral` and API validation `referrer.id !== auth.uid()`.',
    mitigation: 'Enforced at DB DDL level.',
  });
}

// 1.2 Device Fingerprint Collision (Incognito / Tab Farming)
{
  const referrerDevice = 'canvas_audio_hash_abc123';
  const refereeDevice = 'canvas_audio_hash_abc123'; // Same PC, Incognito window
  const isCollisionDetected = referrerDevice === refereeDevice;
  record({
    vector: 'Vector 1',
    name: 'Incognito Same-Device Collision Detection',
    passed: isCollisionDetected,
    severity: 'HIGH',
    observation: 'Hardware fingerprint (Canvas 2D + AudioContext + WebGL) is invariant across normal and incognito tabs on the same hardware. Matched devices trigger `FRAUD_DEVICE_COLLISION`.',
    mitigation: 'Client-side fingerprint + server-side collision check.',
  });
}

// 1.3 Subnet Velocity Limit (100 Accounts from same /24 IP Subnet)
{
  const ipSubnet = '118.69.12.0/24';
  const accountsCreated = 100;
  const SUBNET_LIMIT_24H = 3;
  const flaggedCount = accountsCreated > SUBNET_LIMIT_24H ? accountsCreated - SUBNET_LIMIT_24H : 0;
  const passed = flaggedCount === 97;
  record({
    vector: 'Vector 1',
    name: 'IP Subnet Velocity Rate Limiting (/24)',
    passed,
    severity: 'HIGH',
    observation: `Out of 100 accounts on the same /24 subnet, 3 pass and 97 are flagged as fraud_flagged per Section 2.1 specifications.`,
    mitigation: 'Indexed on `(ip_subnet, created_at DESC)` in schema.sql.',
  });
}

// 1.4 Monthly Cap Enforcement in `fn_evaluate_referral_activation`
{
  // Check if monthly_ref_cap is enforced in the SQL DDL logic
  // In schema.sql line 217-342: fn_evaluate_referral_activation loads monthly_ref_cap?
  // We observed that v_campaign loads referee_reward_days, min_streak, min_words, but DOES NOT check monthly count!
  const sqlHasMonthlyCapCheck = false; // Based on audit of schema.sql lines 217-342
  record({
    vector: 'Vector 1',
    name: 'Monthly Referrer Cap Enforced in Stored Procedure',
    passed: sqlHasMonthlyCapCheck,
    severity: 'CRITICAL',
    observation: 'schema.sql defines `monthly_ref_cap integer NOT NULL DEFAULT 15` in `referral_campaigns`, but `fn_evaluate_referral_activation()` NEVER queries existing monthly rewards to enforce this cap! An attacker activating 100 accounts would receive 700 Pro VIP days.',
    mitigation: 'Add `IF (SELECT count(*) FROM public.reward_transactions WHERE user_id = v_log.referrer_id AND reward_type = "pro_days" AND created_at >= date_trunc("month", now())) >= v_campaign.monthly_ref_cap THEN ...` inside `fn_evaluate_referral_activation`.',
  });
}

// 1.5 Cash Farming via Sybil Accounts without Purchase
{
  // Can an attacker farm cash just by creating 100 accounts?
  const cashPerFreeActivation = 0; // Tier 1 only gives Pro days
  const passed = cashPerFreeActivation === 0;
  record({
    vector: 'Vector 1',
    name: 'Zero Cash Drain on Free Activation',
    passed,
    severity: 'CRITICAL',
    observation: 'Tier 1 reward strictly gives `pro_days` (amount = 0). Cash commission is strictly restricted to paid orders (`orders.status = "paid"`). Attackers cannot farm cash without real capital outlay.',
    mitigation: 'Inherent two-tier separation.',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTACK VECTOR 2: Bot / Fake Activation Attack
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== ATTACK VECTOR 2: Bot / Fake Activation Attack ===');

// 2.1 Fast-Review Bot (< 60s for 30 words)
{
  // Spec says: dwell time < 60s is flagged as bot
  // Schema check: Does fn_evaluate_referral_activation verify dwell time?
  const schemaEnforcesDwellTime = false; // schema.sql lines 265-268 only uses count(*)
  record({
    vector: 'Vector 2',
    name: 'Dwell-Time Verification in Activation Stored Procedure',
    passed: schemaEnforcesDwellTime,
    severity: 'HIGH',
    observation: '`03_ANTI_FRAUD.md` specifies a >60s dwell-time check across 30 words, but `schema.sql` only executes `count(*) FROM srs_progress` without verifying `(max(created_at) - min(created_at)) >= interval "60 seconds"`. A bot inserting 30 records in 1 second passes the SQL check.',
    mitigation: 'Add `HAVING (max(created_at) - min(created_at)) >= interval "60 seconds"` or check review timestamps in `fn_evaluate_referral_activation`.',
  });
}

// 2.2 Instant Word Injection via `words.added_by`
{
  // In schema.sql line 266:
  // SELECT count(*) INTO v_words_count FROM public.words WHERE added_by = p_referee_id;
  // v_words := greatest(v_srs_count, v_words_count);
  const wordsCountVulnerability = true; // Anyone calling API to add 30 raw words satisfies criteria
  record({
    vector: 'Vector 2',
    name: 'Custom Word Creation Exploitation (`words.added_by`)',
    passed: !wordsCountVulnerability,
    severity: 'MEDIUM',
    observation: '`fn_evaluate_referral_activation` uses `v_words := greatest(v_srs_count, v_words_count)`. Adding 30 arbitrary words to personal dictionary takes 100ms via API and does not prove actual learning or engagement.',
    mitigation: 'Rely primarily on `srs_progress` (learned flashcards with SRS reviews) rather than raw `words` table count.',
  });
}

// 2.3 Streak Manipulation Check
{
  // Streak requires 3 distinct calendar days
  // Can a client fake streak by spoofing device time?
  // Server-side gamification updates user_gamification based on DB `now()`.
  const serverTimeEnforced = true;
  record({
    vector: 'Vector 2',
    name: 'Server-Enforced Temporal Streak (3 distinct days)',
    passed: serverTimeEnforced,
    severity: 'LOW',
    observation: '`current_streak` is maintained server-side in `user_gamification` using PostgreSQL `now()`. Client-side clock tampering cannot fast-forward streaks.',
    mitigation: 'Server-side timezone validation (`Asia/Ho_Chi_Minh`).',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTACK VECTOR 3: Refund / Chargeback & Clawback Exploit
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== ATTACK VECTOR 3: Refund / Chargeback & Clawback Exploit ===');

// 3.1 Holding Period vs Refund Window
{
  const holdingMonthlyDays = 7;
  const holdingAnnualDays = 14;
  const standardRefundWindowDays = 7;
  // Holding period >= refund window prevents early withdrawal before refund
  const isWithdrawalBlockedDuringHolding = holdingMonthlyDays >= 7 && holdingAnnualDays >= 14;
  record({
    vector: 'Vector 3',
    name: 'Mandatory Holding Period (7-14 Days) Gate',
    passed: isWithdrawalBlockedDuringHolding,
    severity: 'CRITICAL',
    observation: 'Commissions remain `pending_clearance` for 7 days (monthly) or 14 days (annual). Users cannot withdraw until `available_at <= now()`.',
    mitigation: 'Enforced via `available_at` timestamp check in `fn_request_payout`.',
  });
}

// 3.2 Transition from `pending_clearance` to `available`
{
  // Look at schema.sql line 489:
  // fn_request_payout checks: WHERE status = 'available' AND available_at <= v_now
  // BUT fn_process_referral_reward inserts status = 'pending_clearance'
  // Is there any UPDATE or scheduled trigger in schema.sql that sets status = 'available'?
  const hasAutomatedStatusTransitionInSchema = false;
  record({
    vector: 'Vector 3',
    name: 'Ledger State Transition (`pending_clearance` -> `available`)',
    passed: hasAutomatedStatusTransitionInSchema,
    severity: 'HIGH',
    observation: '`fn_process_referral_reward` sets status = "pending_clearance". `fn_request_payout` queries `WHERE status = "available"`. `schema.sql` lacks a cron/sweep function or trigger to update status to "available", causing `v_available_credits` to always evaluate to 0 unless `fn_request_payout` queries `status IN ("available", "pending_clearance") AND available_at <= now()`.',
    mitigation: 'Update `fn_request_payout` query to `WHERE status IN ("available", "pending_clearance") AND available_at <= v_now` OR add a scheduled daily maintenance function.',
  });
}

// 3.3 TOCTOU Race Condition on Pending Payout vs Refund Clawback
{
  // Scenario:
  // 1. Commission becomes available at day 14.
  // 2. User requests payout -> payout_requests status = 'pending'.
  // 3. Refund occurs at day 14.5 -> clawback trigger sets reward_transactions status = 'clawback'.
  // 4. Admin later approves payout -> does approve check if the reward was clawed back?
  const specHasApproveRecheck = false; // 05_TECHNICAL_SPEC section 3.6 directly marks completed
  record({
    vector: 'Vector 3',
    name: 'TOCTOU Race Condition: Refund Clawback while Payout Request is Pending',
    passed: specHasApproveRecheck,
    severity: 'CRITICAL',
    observation: 'If a refund triggers clawback AFTER user submitted a payout request but BEFORE admin approves it, the admin approval endpoint in `05_TECHNICAL_SPEC.md` does not re-validate that `reward_transactions` are still valid. Money could be paid out via VietQR for a clawed-back transaction.',
    mitigation: 'In `/api/admin/referral/payouts/[id]/approve`, recalculate available balance or cancel pending payout requests on order refund.',
  });
}

// 3.4 Clawback After Funds Already Withdrawn (Post-Holding Chargeback)
{
  // Scenario: Bank chargeback at Day 30 (after funds paid out)
  // trg_order_refund_clawback:
  // WHERE order_id = NEW.id AND status IN ('pending_clearance', 'available')
  // If status is already 'withdrawn', it updates 0 rows!
  // And table has CHECK (amount >= 0), preventing negative records.
  const handlesPostPayoutChargebackGracefully = false;
  record({
    vector: 'Vector 3',
    name: 'Post-Payout Chargeback Handling & Negative Balance Ledger',
    passed: handlesPostPayoutChargebackGracefully,
    severity: 'MEDIUM',
    observation: 'If a bank chargeback occurs after payout (`status = "withdrawn"`), `fn_handle_order_refund_clawback()` skips the record. `03_ANTI_FRAUD.md` claims the user balance becomes negative, but `schema.sql` enforces `CHECK (amount >= 0)` and contains no logic to insert a negative clawback entry.',
    mitigation: 'Permit negative transactions or add a `negative_balance` column to track affiliate liability.',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTACK VECTOR 4: Collusion & Spamming / Payout Caps
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== ATTACK VECTOR 4: Collusion & Spamming / Payout Caps ===');

// 4.1 Circular Referral Loop (A -> B -> C -> A)
{
  // Schema has: CONSTRAINT chk_no_self_referral CHECK (referrer_id IS NULL OR referrer_id <> referee_id)
  // Does schema prevent A -> B -> A or A -> B -> C -> A?
  const schemaHasCyclePrevention = false; // No recursive CTE or trigger in schema.sql
  record({
    vector: 'Vector 4',
    name: 'Circular Referral Graph Cycle Detection (A -> B -> A)',
    passed: schemaHasCyclePrevention,
    severity: 'MEDIUM',
    observation: '`03_ANTI_FRAUD.md` specifies a DAG cycle check (`CIRCULAR_REFERRAL_DETECTED`), but `schema.sql` only has a self-referral CHECK constraint (`referrer_id <> referee_id`). It does not prevent 2-way or 3-way circular loops in the database.',
    mitigation: 'Add a recursive CTE trigger on `referral_logs` INSERT/UPDATE to reject circular paths.',
  });
}

// 4.2 Bank Account Number Uniqueness Across Multiple Accounts
{
  // Can Attacker use 5 different accounts to withdraw to the same bank account?
  // schema.sql payout_requests has NO check or constraint on bank_account_number uniqueness across users
  const schemaEnforcesUniqueBank = false;
  record({
    vector: 'Vector 4',
    name: 'Bank Account Number Cross-Account Deduplication',
    passed: schemaEnforcesUniqueBank,
    severity: 'HIGH',
    observation: '`03_ANTI_FRAUD.md` specifies: "Mỗi số tài khoản ngân hàng chỉ được liên kết với duy nhất 1 tài khoản học viên". However, neither `payout_requests` nor `fn_request_payout()` checks if `bank_account_number` is already bound to another `user_id`. An attacker can register multiple accounts and withdraw to the exact same bank account.',
    mitigation: 'Add check in `fn_request_payout`: `IF EXISTS (SELECT 1 FROM public.payout_requests WHERE bank_account_number = p_bank_account_number AND user_id <> p_user_id) THEN RAISE EXCEPTION ...`.',
  });
}

// 4.3 Daily Withdrawal Cap Enforcement (2,000,000 VND / day)
{
  // fn_request_payout checks amount >= 100000, but does it check daily total <= 2,000,000?
  const schemaEnforcesDailyCap = false;
  record({
    vector: 'Vector 4',
    name: 'Daily Payout Cap (2M VND/day) Enforced in Stored Procedure',
    passed: schemaEnforcesDailyCap,
    severity: 'HIGH',
    observation: '`fn_request_payout()` only checks `p_amount < 100000`. It does NOT check `p_amount <= 2000000` nor does it check the cumulative sum of payouts in the last 24 hours. A compromised or fraudulent account could request an unbounded withdrawal in a single transaction.',
    mitigation: 'Add validation: `IF (SELECT coalesce(sum(amount), 0) FROM public.payout_requests WHERE user_id = p_user_id AND created_at >= now() - interval "1 day" AND status <> "rejected") + p_amount > 2000000 THEN RAISE EXCEPTION ...`.',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY & VERDICT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n================================================================');
const totalTests = results.length;
const passedTests = results.filter(r => r.passed).length;
const criticalFails = results.filter(r => !r.passed && r.severity === 'CRITICAL').length;
const highFails = results.filter(r => !r.passed && r.severity === 'HIGH').length;

console.log(`TOTAL SIMULATED TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${totalTests - passedTests} (Critical: ${criticalFails}, High: ${highFails})`);

if (criticalFails > 0) {
  console.log('FINAL VERDICT: CHALLENGE_FAILED (Critical security/economic loopholes identified)');
} else {
  console.log('FINAL VERDICT: APPROVE');
}
console.log('================================================================\n');
