'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageTitleBarProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  icon?: ReactNode;
}

export function PageTitleBar({
  title,
  backHref = '/',
  backLabel = 'Retour',
  icon,
}: PageTitleBarProps) {
  return (
    <div className="border-b border-border bg-muted/30">
      <div className="page-container h-12 sm:h-14 flex items-center gap-3">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>
        <h1 className="font-bold text-sm sm:text-base flex items-center gap-2 truncate min-w-0">
          {icon}
          <span className="truncate">{title}</span>
        </h1>
      </div>
    </div>
  );
}
