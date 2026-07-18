import { Suspense } from 'react';

import { AuthCard } from '@/components/auth/auth-card';
import { VerifyOtpForm } from '@/components/auth/verify-otp-form';

export const metadata = { title: 'Verify Email' };

export default function VerifyOtpPage() {
  return (
    <AuthCard sideLabel="Verify">
      <Suspense>
        <VerifyOtpForm />
      </Suspense>
    </AuthCard>
  );
}
