import PasswordRecoveryForm from '@/components/auth/PasswordRecoveryForm';

export const dynamic = 'force-dynamic';
export default function RecoveryPage() {
  return <PasswordRecoveryForm mode="reset" />;
}
