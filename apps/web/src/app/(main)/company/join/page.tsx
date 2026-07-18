import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { JoinCompanyForm } from '@/components/company/join-company-form';
import { PageHeader } from '@/components/ui/primitives';

export const metadata = { title: 'Join Company' };

export default function JoinCompanyPage() {
  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/company"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Company
      </Link>
      <PageHeader title="Join a Company" description="Enter the code shared by a company admin." />
      <JoinCompanyForm />
    </div>
  );
}
