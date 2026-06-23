import { CustomerShell } from '@/components/layout/CustomerShell';

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
