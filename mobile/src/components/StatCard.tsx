import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { AppIcon } from './AppIcon';
import { useAppTheme } from '../theme/ThemeProvider';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: string;
  iconName?: string;
  helper?: string;
}

export const StatCard = ({ label, value, accent, iconName = 'sparkles-outline', helper }: StatCardProps) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const tone = accent || theme.colors.accent;

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.accent, { backgroundColor: tone }]} />
        <View style={styles.iconShell}>
          <AppIcon name={iconName} size={16} color={tone} />
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={2} style={styles.value}>
        {value}
      </Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </Card>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      flex: 1,
      gap: 10,
      backgroundColor: theme.colors.surfaceRaised,
      minHeight: 122,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: theme.isDark ? 0.16 : 0.07,
      shadowRadius: 18,
    },
    topRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    accent: {
      borderRadius: 999,
      height: 8,
      width: 42,
    },
    iconShell: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: 999,
      height: 28,
      justifyContent: 'center',
      width: 28,
    },
    label: {
      color: theme.colors.textMuted,
      fontSize: 12,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    value: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 28,
    },
    helper: {
      color: theme.colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
  });
