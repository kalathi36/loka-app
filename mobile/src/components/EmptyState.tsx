import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card } from './Card';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';

export const EmptyState = ({ title, subtitle }: { title: string; subtitle: string }) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Card>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: 8,
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
  });
