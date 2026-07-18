import { AuthCard } from '@/components/auth/auth-card';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata = { title: 'Sign Up' };

export default function RegisterPage() {
  return (
    <AuthCard sideLabel="Sign Up" maxWidth="max-w-3xl">
      <RegisterForm />
    </AuthCard>
  );
}
