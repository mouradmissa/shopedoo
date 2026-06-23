import { CustomerShell } from '@/components/layout/CustomerShell';

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
