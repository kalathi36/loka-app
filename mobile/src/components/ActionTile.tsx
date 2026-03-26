import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { useAppTheme } from '../theme/ThemeProvider';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';

interface ActionTileProps {
  title: string;
  subtitle: string;
  badge?: string;
  iconName?: string;
  accentColor?: string;
  onPress: () => void;
}

export const ActionTile = ({ title, subtitle, badge, iconName, accentColor, onPress }: ActionTileProps) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const nextAccentColor = accentColor || theme.colors.accent;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed ? styles.pressed : null]}>
      <View style={[styles.accentRail, { backgroundColor: nextAccentColor }]} />
      <View style={styles.leading}>
        <View style={styles.iconShell}>
          <AppIcon name={iconName || 'sparkles-outline'} size={20} color={nextAccentColor} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.meta}>
        {badge ? (
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: nextAccentColor }]}>{badge}</Text>
          </View>
        ) : null}
        <View style={styles.chevronShell}>
          <AppIcon name="chevron-forward" size={16} color={theme.colors.textMuted} />
        </View>
      </View>
    </Pressable>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    tile: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      flexDirection: 'row',
      gap: theme.spacing.md,
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: theme.isDark ? 0.2 : 0.08,
      shadowRadius: 16,
    },
    accentRail: {
      borderRadius: 999,
      height: 42,
      width: 4,
    },
    leading: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    iconShell: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: 18,
      height: 46,
      justifyContent: 'center',
      width: 46,
    },
    pressed: {
      opacity: 0.82,
    },
    copy: {
      flex: 1,
      gap: 6,
    },
    title: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    subtitle: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    meta: {
      alignItems: 'flex-end',
      gap: 8,
    },
    badge: {
      backgroundColor: theme.colors.accentMuted,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    chevronShell: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: 14,
      height: 28,
      justifyContent: 'center',
      width: 28,
    },
    badgeText: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
  });
