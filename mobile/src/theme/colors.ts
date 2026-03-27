export interface ThemeColors {
  background: string;
  backgroundSoft: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textOnAccent: string;
  accent: string;
  accentSecondary: string;
  accentMuted: string;
  success: string;
  warning: string;
  danger: string;
  overlay: string;
  glowPrimary: string;
  glowSecondary: string;
  shadow: string;
}

export const darkColors: ThemeColors = {
  background: '#050608',
  backgroundSoft: '#0A0D10',
  surface: '#0E1217',
  surfaceRaised: '#151B23',
  surfaceMuted: '#1A2330',
  border: '#212A36',
  text: '#F5F7FB',
  textMuted: '#94A0B2',
  textOnAccent: '#001217',
  accent: '#25E0FF',
  accentSecondary: '#7CFF6B',
  accentMuted: 'rgba(37, 224, 255, 0.14)',
  success: '#7CFF6B',
  warning: '#FFD166',
  danger: '#FF5C8A',
  overlay: 'rgba(5, 6, 8, 0.92)',
  glowPrimary: 'rgba(37, 224, 255, 0.10)',
  glowSecondary: 'rgba(124, 255, 107, 0.08)',
  shadow: 'rgba(0, 0, 0, 0.22)',
};

export const lightColors: ThemeColors = {
  background: '#F4F8FB',
  backgroundSoft: '#E8F0F5',
  surface: '#FFFFFF',
  surfaceRaised: '#F8FBFF',
  surfaceMuted: '#EDF5FA',
  border: '#D5E1EB',
  text: '#0E1724',
  textMuted: '#5F7186',
  textOnAccent: '#FFFFFF',
  accent: '#168CFF',
  accentSecondary: '#19A463',
  accentMuted: 'rgba(22, 140, 255, 0.12)',
  success: '#19A463',
  warning: '#C88A00',
  danger: '#D33F6A',
  overlay: 'rgba(244, 248, 251, 0.92)',
  glowPrimary: 'rgba(0, 126, 237, 0.10)',
  glowSecondary: 'rgba(25, 164, 99, 0.08)',
  shadow: 'rgba(19, 33, 52, 0.12)',
};
