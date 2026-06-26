export const theme = {
  colors: {
    background: '#ffffff',
    foreground: '#0f0f0f',
    card: '#f5f5f5',
    cardForeground: '#0f0f0f',
    primary: '#ff3131',
    primaryForeground: '#ffffff',
    secondary: '#0f0f0f',
    secondaryForeground: '#ffffff',
    offer: '#f5c400',
    offerForeground: '#0f0f0f',
    muted: '#e8e8e8',
    mutedForeground: '#666666',
    border: '#e8e8e8',
    destructive: '#ff3131',
    success: '#16a34a',
    successBg: 'rgba(22, 163, 74, 0.1)',
    warning: '#d97706',
    warningBg: 'rgba(217, 119, 6, 0.1)',
    error: '#dc2626',
    errorBg: 'rgba(220, 38, 38, 0.1)',
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 10,
    xl: 14,
    '2xl': 16,
    full: 9999,
  },
  spacing: {
    page: 16,
  },
  shadow: {
    primary: {
      shadowColor: '#ff3131',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
  },
} as const;

export const colors = theme.colors;
