import * as fs from 'fs';
import * as path from 'path';

const sqlPath = path.resolve('docs/proposals/referral-system/schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const fnActivationBody = sql.substring(
  sql.indexOf('CREATE OR REPLACE FUNCTION public.fn_evaluate_referral_activation'),
  sql.indexOf('CREATE OR REPLACE FUNCTION public.fn_process_referral_reward')
);

const hasDwellTimeOnSrs = /srs_progress.*created_at/i.test(fnActivationBody) || /created_at.*srs_progress/i.test(fnActivationBody) || /dwell/i.test(fnActivationBody);
console.log('True Dwell-Time check on srs_progress in fn_evaluate_referral_activation:', hasDwellTimeOnSrs ? 'PRESENT' : 'MISSING');
