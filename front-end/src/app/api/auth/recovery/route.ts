import { recoveryFailure, recoveryStatus, updateRecoveredPassword } from '@/lib/password-recovery';

export async function GET(req: Request) {
  try { return await recoveryStatus(req); }
  catch (error) { return recoveryFailure(error); }
}

export async function POST(req: Request) {
  try { return await updateRecoveredPassword(req); }
  catch (error) { return recoveryFailure(error); }
}
