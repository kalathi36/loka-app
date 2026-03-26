import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Order } from '../types';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';
import { formatCurrency, formatDateTime, getEntityName } from '../utils/formatters';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';
import { StatusChip } from './StatusChip';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const OrderCard = ({ order, onPress, actionLabel, onActionPress }: OrderCardProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.orderId}>Order #{order._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.date}>{formatDateTime(order.createdAt)}</Text>
          </View>
          <StatusChip status={order.status} />
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metricChip}>
            <Text style={styles.metricLabel}>Items</Text>
            <Text style={styles.metricValue}>{order.items.length}</Text>
          </View>
          <View style={styles.metricChip}>
            <Text style={styles.metricLabel}>Value</Text>
            <Text style={styles.metricValue}>{formatCurrency(order.totalAmount)}</Text>
          </View>
        </View>
        <Text style={styles.line}>Worker: {getEntityName(order.assignedWorker)}</Text>
        <Text style={styles.line}>Address: {order.deliveryAddress || 'Customer will confirm on call'}</Text>
        {actionLabel && onActionPress ? (
          <PrimaryButton label={actionLabel} onPress={onActionPress} style={styles.action} />
        ) : null}
      </Card>
    </Pressable>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: 10,
      backgroundColor: theme.colors.surfaceRaised,
    },
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    orderId: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    date: {
      color: theme.colors.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
    line: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    metricChip: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flex: 1,
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    metricLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    metricValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontWeight: '700',
    },
    action: {
      marginTop: 6,
    },
  });
