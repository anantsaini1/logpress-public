import { colors } from './colors';

const sharedTheme = {
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 40,
  },
  fonts: {
    regular: 'Outfit-Regular',
    medium: 'Outfit-Medium',
    semiBold: 'Outfit-SemiBold',
    bold: 'Outfit-Bold',
  },
  // ...diğer paylaşılan tema özellikleri (fontlar, border radius vb.)
};

export const lightTheme = {
  ...sharedTheme,
  colors: {
    background: colors.backgroundLight,
    text: colors.textLight,
    primary: colors.primary,
  },
};

export const darkTheme = {
  ...sharedTheme,
  colors: {
    background: colors.backgroundDark,
    text: colors.textDark,
    primary: colors.primary,
  },
};

export type Theme = typeof lightTheme; 