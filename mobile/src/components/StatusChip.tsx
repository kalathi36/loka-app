import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OrderStatus } from '../types';
import { AppTheme } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { humanizeStatus } from '../utils/formatters';

export const StatusChip = ({ status }: { status: OrderStatus }) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const statusColorMap: Record<OrderStatus, string> = {
    pending: theme.colors.warning,
    approved: theme.colors.accent,
    out_for_delivery: theme.colors.accentSecondary,
    delivered: theme.colors.success,
  };

  return (
    <View style={[styles.chip, { borderColor: statusColorMap[status] }]}>
      <Text style={[styles.text, { color: statusColorMap[status] }]}>{humanizeStatus(status)}</Text>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    chip: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    text: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
  });
