import { AuthCard } from '@/components/auth/auth-card';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata = { title: 'Forgot Password' };

export default function ForgotPasswordPage() {
  return (
    <AuthCard sideLabel="Reset">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
