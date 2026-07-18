import { Suspense } from 'react';

import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = { title: 'Login' };

export default function LoginPage() {
  return (
    <AuthCard sideLabel="Login">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
