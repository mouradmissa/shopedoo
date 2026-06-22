import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const LOGO_SRC = '/shopedoo-logo.png';
const LOGO_ASPECT = 920 / 271;

interface ShopEdooLogoProps {
  href?: string;
  height?: number;
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
      className={cn('object-contain rounded-md', imageClassName)}
      priority={priority}
    />
  );
}

export function ShopEdooLogo({
  href,
  height = 52,
  className,
  imageClassName,
  suffix,
  priority,
}: ShopEdooLogoProps) {
  const logo = (
    <LogoImage height={height} imageClassName={imageClassName} priority={priority} />
  );

  if (href) {
    return (
      <Link href={href} className={cn('flex items-center gap-2 shrink-0', className)}>
        {logo}
        {suffix}
      </Link>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 shrink-0', className)}>
      {logo}
      {suffix}
    </div>
  );
}
