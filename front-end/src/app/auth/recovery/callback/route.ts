import { finishRecoveryCallback, recoveryFailure } from '@/lib/password-recovery';

export async function GET(req: Request) {
  try { return await finishRecoveryCallback(req); }
  catch (error) { return recoveryFailure(error); }
}
