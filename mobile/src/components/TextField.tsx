import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';

interface TextFieldProps extends TextInputProps {
  label: string;
  hint?: string;
}

export const TextField = ({ label, hint, style, ...rest }: TextFieldProps) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, style]}
        {...rest}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    wrapper: {
      gap: 8,
    },
    label: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 13,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    input: {
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      color: theme.colors.text,
      fontFamily: theme.fontFamily.body,
      minHeight: 50,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 12,
    },
    hint: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
  });
