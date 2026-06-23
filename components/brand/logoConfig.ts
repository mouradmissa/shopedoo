export const LOGO_VARIANTS = {
  nav: {
    height: 28,
    imageClassName: 'h-7 w-auto max-w-[96px] sm:h-8 sm:max-w-[108px]',
  },
  hero: {
    height: 32,
    imageClassName: 'h-8 sm:h-10 w-auto max-w-[min(180px,68vw)]',
  },
  auth: {
    height: 36,
    imageClassName: 'h-9 sm:h-10 w-auto max-w-[min(180px,72vw)]',
  },
  footer: {
    height: 28,
    imageClassName: 'h-7 w-auto max-w-[110px]',
  },
  invoice: {
    height: 28,
    imageClassName: 'h-7 sm:h-8 w-auto max-w-[min(140px,60vw)]',
  },
} as const;

export type LogoVariant = keyof typeof LOGO_VARIANTS;
