import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'ghost' | 'outline';
  style?: StyleProp<ViewStyle>;
}

export const PrimaryButton = ({
  label,
  onPress,
  loading,
  disabled,
  variant = 'solid',
  style,
}: PrimaryButtonProps) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'solid' ? theme.colors.textOnAccent : theme.colors.text} />
      ) : (
        <Text style={[styles.label, variant !== 'solid' ? styles.labelAlt : null]}>{label}</Text>
      )}
    </Pressable>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    base: {
      alignItems: 'center',
      borderRadius: theme.radius.sm,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: theme.spacing.md,
    },
    solid: {
      backgroundColor: theme.colors.accent,
    },
    ghost: {
      backgroundColor: theme.colors.accentMuted,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
    pressed: {
      opacity: 0.82,
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      color: theme.colors.textOnAccent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    labelAlt: {
      color: theme.colors.text,
    },
  });
