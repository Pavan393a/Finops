import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'FinOps — Autonomous Retail Control Plane',
  description: 'AI Agent that monitors retail store inventory, enforces financial spending mandates, and executes real money movements via Stripe test rails with Cognee knowledge graph provenance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        {children}
        <Toaster position="bottom-right" richColors theme="dark" />
      </body>
    </html>
  );
}
