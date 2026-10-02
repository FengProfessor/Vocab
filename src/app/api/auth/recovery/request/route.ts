import { recoveryFailure, requestPasswordRecovery } from '@/lib/password-recovery';

export async function POST(req: Request) {
  try { return await requestPasswordRecovery(req); }
  catch (error) { return recoveryFailure(error); }
}
