'use client';

import { CashierAreaGuard } from '@/components/guards/CashierAreaGuard';
import { CashierShell } from '@/components/cashier/CashierNav';

export default function CaissierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CashierAreaGuard>
      <CashierShell>{children}</CashierShell>
    </CashierAreaGuard>
  );
}
