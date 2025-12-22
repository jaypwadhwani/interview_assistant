export type ColorScheme = 'purple' | 'blue' | 'green' | 'orange' | 'teal';

export interface ThemeColors {
  bg: string; // Background
  bgSecondary: string; // Secondary background
  primary: string; // Primary button/icon color
  primaryHover: string; // Primary hover state
  accent: string; // Accent highlights
  text: string; // Primary text
  textSecondary: string; // Secondary text
  border: string; // Border color
  glass: string; // Glassmorphism background
  glassBorder: string; // Glass border
}

export const themes: Record<ColorScheme, ThemeColors> = {
  purple: {
    bg: 'bg-gray-50',
    bgSecondary: 'bg-purple-50/50',
    primary: 'bg-purple-600',
    primaryHover: 'bg-purple-700',
    accent: 'purple-500',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    glass: 'bg-white/80 backdrop-blur-xl',
    glassBorder: 'border-white/60',
  },
  blue: {
    bg: 'bg-gray-50',
    bgSecondary: 'bg-blue-50/50',
    primary: 'bg-blue-600',
    primaryHover: 'bg-blue-700',
    accent: 'blue-500',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    glass: 'bg-white/80 backdrop-blur-xl',
    glassBorder: 'border-white/60',
  },
  green: {
    bg: 'bg-gray-50',
    bgSecondary: 'bg-emerald-50/50',
    primary: 'bg-emerald-600',
    primaryHover: 'bg-emerald-700',
    accent: 'emerald-500',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    glass: 'bg-white/80 backdrop-blur-xl',
    glassBorder: 'border-white/60',
  },
  orange: {
    bg: 'bg-gray-50',
    bgSecondary: 'bg-orange-50/50',
    primary: 'bg-orange-600',
    primaryHover: 'bg-orange-700',
    accent: 'orange-500',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    glass: 'bg-white/80 backdrop-blur-xl',
    glassBorder: 'border-white/60',
  },
  teal: {
    bg: 'bg-gray-50',
    bgSecondary: 'bg-teal-50/50',
    primary: 'bg-teal-600',
    primaryHover: 'bg-teal-700',
    accent: 'teal-500',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    glass: 'bg-white/80 backdrop-blur-xl',
    glassBorder: 'border-white/60',
  },
};

export const getTheme = (scheme: ColorScheme): ThemeColors => {
  return themes[scheme];
};

// Default theme - Mint (Teal)
export const defaultTheme: ColorScheme = 'teal';
