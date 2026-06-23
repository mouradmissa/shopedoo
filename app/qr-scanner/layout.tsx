import { CustomerShell } from '@/components/layout/CustomerShell';

export default function QrScannerLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
