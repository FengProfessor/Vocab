import * as fs from 'fs';
import * as path from 'path';

const sqlPath = path.resolve('docs/proposals/referral-system/schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('--- Static SQL Schema Analysis ---');
console.log('Total SQL characters:', sql.length);

// 1. Table Definitions Check
const expectedTables = [
  'referral_campaigns',
  'referral_links',
  'referral_logs',
  'reward_transactions',
  'payout_requests'
];

for (const t of expectedTables) {
  const match = sql.includes(`CREATE TABLE IF NOT EXISTS public.${t}`);
  console.log(`Table ${t}: ${match ? 'FOUND' : 'MISSING'}`);
}

// 2. Foreign Key References Check
const expectedFks = [
  'REFERENCES public.profiles(id)',
  'REFERENCES public.orders(id)',
  'REFERENCES public.referral_campaigns(id)',
  'REFERENCES public.referral_logs(id)'
];
for (const fk of expectedFks) {
  const match = sql.includes(fk);
  console.log(`Foreign Key ${fk}: ${match ? 'FOUND' : 'MISSING'}`);
}

// 3. Functions & Triggers Check
const expectedRpcs = [
  'fn_evaluate_referral_activation',
  'fn_process_referral_reward',
  'fn_request_payout',
  'fn_handle_order_refund_clawback',
  'trg_order_refund_clawback'
];
for (const fn of expectedRpcs) {
  const match = sql.includes(fn);
  console.log(`Routine ${fn}: ${match ? 'FOUND' : 'MISSING'}`);
}

// 4. Detailed Bug Checks
console.log('\n--- Checking for Discrepancies between 03_ANTI_FRAUD.md and schema.sql ---');

// Bug 1: Monthly cap check in fn_evaluate_referral_activation
const fnActivationBody = sql.substring(
  sql.indexOf('CREATE OR REPLACE FUNCTION public.fn_evaluate_referral_activation'),
  sql.indexOf('CREATE OR REPLACE FUNCTION public.fn_process_referral_reward')
);
const hasCapCheckInActivation = /monthly_ref_cap/i.test(fnActivationBody) && /SELECT\s+count\(\*\)/i.test(fnActivationBody);
console.log('Bug 1 - monthly_ref_cap checked in fn_evaluate_referral_activation:', hasCapCheckInActivation ? 'Enforced' : 'MISSING (VULNERABILITY)');

// Bug 2: Dwell-time check in fn_evaluate_referral_activation
const hasDwellTimeCheck = /interval/i.test(fnActivationBody) && /srs_progress/i.test(fnActivationBody) && /(max|min)/i.test(fnActivationBody);
console.log('Bug 2 - Dwell-time verified in fn_evaluate_referral_activation:', hasDwellTimeCheck ? 'Enforced' : 'MISSING (VULNERABILITY)');

// Bug 3: Unique bank account check across users in fn_request_payout
const fnPayoutBody = sql.substring(
  sql.indexOf('CREATE OR REPLACE FUNCTION public.fn_request_payout'),
  sql.indexOf('CREATE OR REPLACE FUNCTION public.fn_handle_order_refund_clawback')
);
const hasCrossUserBankCheck = /payout_requests/i.test(fnPayoutBody) && /bank_account_number\s*=/i.test(fnPayoutBody) && /user_id\s*<>/i.test(fnPayoutBody);
console.log('Bug 3 - Cross-user bank account deduplication in fn_request_payout:', hasCrossUserBankCheck ? 'Enforced' : 'MISSING (VULNERABILITY)');

// Bug 4: Daily 2M withdrawal cap in fn_request_payout
const hasDailyCapCheck = /2000000/i.test(fnPayoutBody) || /interval\s*'1 day'/i.test(fnPayoutBody);
console.log('Bug 4 - Daily payout cap (2,000,000 VND) in fn_request_payout:', hasDailyCapCheck ? 'Enforced' : 'MISSING (VULNERABILITY)');

// Bug 5: Transition pending_clearance to available
const hasStatusTransition = /UPDATE.*reward_transactions.*SET status = 'available'.*WHERE status = 'pending_clearance'/i.test(sql);
console.log('Bug 5 - Automated status update pending_clearance -> available:', hasStatusTransition ? 'Found' : 'MISSING (DEADLOCK ON PAYOUT)');

// Bug 6: Clawback post-withdrawal negative balance support
const allowsNegativeBalance = !/CHECK\s*\(\s*amount\s*>=\s*0\s*\)/i.test(sql);
console.log('Bug 6 - Negative balance ledger allowed in reward_transactions:', allowsNegativeBalance ? 'Allowed' : 'BLOCKED by CHECK (amount >= 0)');
