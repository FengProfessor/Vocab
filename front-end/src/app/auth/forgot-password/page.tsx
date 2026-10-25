import PasswordRecoveryForm from '@/components/auth/PasswordRecoveryForm';

export const dynamic = 'force-dynamic';
export default function ForgotPasswordPage() {
  return <PasswordRecoveryForm mode="request" />;
}
