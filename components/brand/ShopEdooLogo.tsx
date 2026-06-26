import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LOGO_VARIANTS, type LogoVariant } from './logoConfig';

const LOGO_SRC = '/shopedoo-logo.png';
const LOGO_ASPECT = 920 / 271;

interface ShopEdooLogoProps {
  href?: string;
  height?: number;
  variant?: LogoVariant;
  className?: string;
  imageClassName?: string;
  suffix?: React.ReactNode;
  priority?: boolean;
}

function LogoImage({
  height = 52,
  imageClassName,
  priority,
}: Pick<ShopEdooLogoProps, 'height' | 'imageClassName' | 'priority'>) {
  const width = Math.round(height * LOGO_ASPECT);

  return (
    <Image
      src={LOGO_SRC}
      alt="shopedoo"
      width={width}
      height={height}
      className={cn('object-contain rounded-md w-auto max-w-full h-auto', imageClassName)}
      priority={priority}
    />
  );
}

export function ShopEdooLogo({
  href,
  height,
  variant,
  className,
  imageClassName,
  suffix,
  priority,
}: ShopEdooLogoProps) {
  const preset = variant ? LOGO_VARIANTS[variant] : null;
  const resolvedHeight = height ?? preset?.height ?? 52;
  const resolvedImageClass = imageClassName ?? preset?.imageClassName;

  const logo = (
    <LogoImage height={resolvedHeight} imageClassName={resolvedImageClass} priority={priority} />
  );

  if (href) {
    return (
      <Link href={href} className={cn('flex items-center gap-2 shrink-0 min-w-0', className)}>
        {logo}
        {suffix}
      </Link>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 shrink-0 min-w-0', className)}>
      {logo}
      {suffix}
    </div>
  );
}
