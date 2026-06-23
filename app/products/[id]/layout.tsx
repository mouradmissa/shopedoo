import { CustomerShell } from '@/components/layout/CustomerShell';

export default function ProductDetailLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
