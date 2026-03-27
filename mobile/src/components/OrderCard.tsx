import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Order } from '../types';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';
import { formatCurrency, formatDateTime, getEntityName } from '../utils/formatters';
import { getOrderPreferenceBadges } from '../utils/orderPreferences';
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

  const totalUnits = useMemo(
    () => order.items.reduce((sum, item) => sum + item.quantity, 0),
    [order.items],
  );
  const itemPreview = useMemo(() => {
    const visibleItems = order.items.slice(0, 2).map((item) => item.name);
    const remaining = order.items.length - visibleItems.length;

    if (!visibleItems.length) {
      return 'Awaiting item details';
    }

    return `${visibleItems.join(', ')}${remaining > 0 ? ` +${remaining} more` : ''}`;
  }, [order.items]);
  const preferenceBadges = useMemo(() => getOrderPreferenceBadges(order.notes), [order.notes]);

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.orderId}>Order #{order._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.date}>Created {formatDateTime(order.createdAt)}</Text>
          </View>
          <StatusChip status={order.status} />
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metricChip}>
            <Text style={styles.metricLabel}>Units</Text>
            <Text style={styles.metricValue}>{totalUnits}</Text>
          </View>
          <View style={styles.metricChip}>
            <Text style={styles.metricLabel}>Value</Text>
            <Text style={styles.metricValue}>{formatCurrency(order.totalAmount)}</Text>
          </View>
        </View>
        <Text numberOfLines={2} style={styles.preview}>
          {itemPreview}
        </Text>
        {preferenceBadges.length ? (
          <View style={styles.badgeRow}>
            {preferenceBadges.map((badge) => (
              <View key={badge} style={styles.badge}>
                <Text style={styles.badgeLabel}>{badge}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <Text style={styles.line}>Worker: {getEntityName(order.assignedWorker)}</Text>
        <Text numberOfLines={2} style={styles.line}>
          Address: {order.deliveryAddress || 'Customer will confirm on call'}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.updatedAt}>Updated {formatDateTime(order.updatedAt)}</Text>
          {actionLabel && onActionPress ? (
            <PrimaryButton label={actionLabel} onPress={onActionPress} style={styles.action} />
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    action: {
      minHeight: 42,
    },
    badge: {
      backgroundColor: theme.colors.accentMuted,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    badgeLabel: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    card: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 10,
    },
    date: {
      color: theme.colors.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
    footer: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
      justifyContent: 'space-between',
      marginTop: 2,
    },
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    headerCopy: {
      flex: 1,
      paddingRight: theme.spacing.sm,
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
    orderId: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    preview: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.body,
      lineHeight: 20,
    },
    updatedAt: {
      color: theme.colors.textMuted,
      flex: 1,
      fontSize: 12,
    },
  });
