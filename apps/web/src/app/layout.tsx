import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Carpool — Enterprise Carpooling Platform',
    template: '%s | Carpool',
  },
  description: 'Share rides with colleagues. Save costs, cut congestion, commute sustainably.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
