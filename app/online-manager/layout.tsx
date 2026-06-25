'use client';

import { OnlineManagerGuard } from '@/components/guards/OnlineManagerGuard';
import { OnlineManagerNav } from '@/components/online-manager/OnlineManagerNav';

export default function OnlineManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnlineManagerGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex flex-col">
        <OnlineManagerNav />
        <main className="flex-1">{children}</main>
      </div>
    </OnlineManagerGuard>
  );
}
