import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { useAppTheme } from '../theme/ThemeProvider';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';

interface TabGlyphProps {
  name: string;
  focused: boolean;
  color: string;
}

export const TabGlyph = ({ name, focused, color }: TabGlyphProps) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={[
        styles.shell,
        focused
          ? { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }
          : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <AppIcon
        name={name}
        size={16}
        color={focused ? theme.colors.textOnAccent : color}
      />
    </View>
  );
};

const createStyles = (_theme: AppTheme) =>
  StyleSheet.create({
    shell: {
      alignItems: 'center',
      borderRadius: 999,
      borderWidth: 1,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
  });
