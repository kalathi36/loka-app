import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';

interface QuantityStepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  compact?: boolean;
  disableIncrement?: boolean;
  disableDecrement?: boolean;
}

export const QuantityStepper = ({
  value,
  onIncrement,
  onDecrement,
  compact = false,
  disableIncrement = false,
  disableDecrement = false,
}: QuantityStepperProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.shell, compact ? styles.shellCompact : null]}>
      <Pressable
        disabled={disableDecrement}
        onPress={onDecrement}
        style={({ pressed }) => [
          styles.button,
          compact ? styles.buttonCompact : null,
          pressed && !disableDecrement ? styles.pressed : null,
          disableDecrement ? styles.disabled : null,
        ]}
      >
        <Text style={styles.buttonText}>-</Text>
      </Pressable>
      <Text style={[styles.value, compact ? styles.valueCompact : null]}>{value}</Text>
      <Pressable
        disabled={disableIncrement}
        onPress={onIncrement}
        style={({ pressed }) => [
          styles.button,
          compact ? styles.buttonCompact : null,
          pressed && !disableIncrement ? styles.pressed : null,
          disableIncrement ? styles.disabled : null,
        ]}
      >
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    shell: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    shellCompact: {
      gap: 8,
      paddingHorizontal: 6,
      paddingVertical: 6,
    },
    button: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    buttonCompact: {
      height: 30,
      width: 30,
    },
    buttonText: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 20,
    },
    value: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
      minWidth: 28,
      textAlign: 'center',
    },
    valueCompact: {
      fontSize: 14,
      minWidth: 24,
    },
    pressed: {
      opacity: 0.82,
    },
    disabled: {
      opacity: 0.45,
    },
  });
