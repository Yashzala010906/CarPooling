import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { CompanyRegisterForm } from '@/components/company/company-register-form';
import { PageHeader } from '@/components/ui/primitives';

export const metadata = { title: 'Register Company' };

export default function CompanyRegisterPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/company"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Company
      </Link>
      <PageHeader
        title="Register a Company"
        description="You'll become the owner and get a code to invite others."
      />
      <CompanyRegisterForm />
    </div>
  );
}
