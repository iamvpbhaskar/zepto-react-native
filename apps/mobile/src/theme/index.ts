export const colors = {
  primary: '#FF1E56',       // Zepto vibrant pink
  primaryDark: '#D81545',
  primaryLight: '#FF4D79',
  secondary: '#3B006B',     // Zepto deep purple
  secondaryDark: '#2D0052',
  secondaryLight: '#540099',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',

  background: '#F5F6F8',    // Light gray background
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F5F5', // Light gray surface for badges
  border: '#E2E8F0',

  text: '#1C1C1C',
  textSecondary: '#4A4A4A',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Gradients
  primaryGradient: ['#FF1E56', '#D81545'] as const,
  secondaryGradient: ['#3B006B', '#2D0052'] as const,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const
