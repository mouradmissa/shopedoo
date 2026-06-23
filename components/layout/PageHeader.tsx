'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  icon?: ReactNode;
}

export function PageHeader({
  title,
  backHref = '/',
  backLabel = 'Retour',
  icon,
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border safe-top">
      <div className="page-container h-14 sm:h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-sm font-medium hover:opacity-75 transition min-w-0"
        >
          <ArrowLeft className="w-5 h-5 shrink-0" />
          <span className="truncate hidden sm:inline">{backLabel}</span>
        </Link>

        <h1 className="font-bold text-base sm:text-lg flex items-center justify-center gap-2 truncate">
          {icon}
          <span className="truncate">{title}</span>
        </h1>

        <div aria-hidden className="w-10 sm:w-20" />
      </div>
    </header>
  );
}
