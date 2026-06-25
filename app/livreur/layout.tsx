'use client';

import { DriverGuard } from '@/components/guards/DriverGuard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';

export default function LivreurLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <DriverGuard>
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader
          logoHref="/livreur"
          sectionLabel="Livreur"
          userName={user?.name}
          userSubtitle="Livraisons"
          onLogout={() => {
            logout();
            router.push('/');
          }}
        />
        <main className="flex-1">{children}</main>
      </div>
    </DriverGuard>
  );
}
