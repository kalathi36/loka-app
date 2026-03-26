import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { useAppTheme } from '../theme/ThemeProvider';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';

export const ThemeToggleButton = ({ compact = false }: { compact?: boolean }) => {
  const { isDark, theme, toggleTheme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable onPress={toggleTheme} style={styles.button}>
      <View style={styles.content}>
        <AppIcon
          name={isDark ? 'sunny-outline' : 'moon-outline'}
          size={compact ? 14 : 16}
          color={theme.colors.text}
        />
        <Text style={styles.label}>
          {compact ? (isDark ? 'LIGHT' : 'DARK') : isDark ? 'Switch to Light' : 'Switch to Dark'}
        </Text>
      </View>
    </Pressable>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: theme.spacing.sm,
      shadowColor: theme.colors.shadow,
      shadowOpacity: theme.isDark ? 0.16 : 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },
    content: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    label: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
  });
