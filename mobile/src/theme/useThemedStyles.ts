import { useMemo } from 'react';
import { AppTheme } from './theme';
import { useAppTheme } from './ThemeProvider';

export const useThemedStyles = <T,>(factory: (theme: AppTheme) => T) => {
  const { theme } = useAppTheme();

  return useMemo(() => factory(theme), [factory, theme]);
};
