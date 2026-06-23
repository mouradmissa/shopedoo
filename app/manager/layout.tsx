import { ManagerGuard } from '@/components/guards/ManagerGuard';
import { ManagerNav } from '@/components/manager/ManagerNav';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ManagerGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex flex-col">
        <ManagerNav />
        <main className="flex-1">{children}</main>
      </div>
    </ManagerGuard>
  );
}
