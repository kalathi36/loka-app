import { Platform } from 'react-native';
import { darkColors, lightColors, ThemeColors } from './colors';

export type ThemeMode = 'light' | 'dark';

const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
};

const radius = {
  sm: 12,
  md: 18,
  lg: 24,
};

const fontFamily = {
  heading: Platform.select({ ios: 'Avenir Next', android: 'sans-serif-medium' }) || 'System',
  body: Platform.select({ ios: 'Avenir', android: 'sans-serif' }) || 'System',
};

export interface AppTheme {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  fontFamily: typeof fontFamily;
}

export const buildTheme = (mode: ThemeMode): AppTheme => ({
  mode,
  isDark: mode === 'dark',
  colors: mode === 'dark' ? darkColors : lightColors,
  spacing: {
    ...spacing,
  },
  radius: {
    ...radius,
  },
  fontFamily: {
    ...fontFamily,
  },
});

export const darkTheme = buildTheme('dark');
export const lightTheme = buildTheme('light');

export const theme = darkTheme;
