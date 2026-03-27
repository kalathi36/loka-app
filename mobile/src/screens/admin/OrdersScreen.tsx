import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { OrderCard } from '../../components/OrderCard';
import { ScreenLayout } from '../../components/ScreenLayout';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { ApiEnvelope, Order } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { upsertById } from '../../utils/collections';
import { extractErrorMessage, formatDateTime, humanizeStatus } from '../../utils/formatters';
import { getOrderAttentionReasons } from '../../utils/orderPreferences';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'attention', label: 'Attention' },
  { key: 'live', label: 'Live' },
  { key: 'delivered', label: 'Delivered' },
] as const;

type QueueFilter = (typeof FILTERS)[number]['key'];

const getPriority = (status: Order['status']) => {
  if (status === 'pending') {
    return 0;
  }

  if (status === 'approved') {
    return 1;
  }

  if (status === 'out_for_delivery') {
    return 2;
  }

  return 3;
};

const OrdersScreen = ({ navigation }: { navigation: any }) => {
  const styles = useThemedStyles(createStyles);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<QueueFilter>('all');

  const loadOrders = async () => {
    try {
      setError('');
      const response = await api.get<ApiEnvelope<Order[]>>('/orders');
      setOrders(response.data.data);
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    }
  };

  useEffect(() => {
    loadOrders();
    const unsubscribe = navigation.addListener('focus', () => {
      loadOrders();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      return;
    }

    const onOrderUpdated = (incomingOrder: Order) => {
      setOrders((currentOrders) => upsertById(currentOrders, incomingOrder));
    };

    socket.on('order:updated', onOrderUpdated);

    return () => {
      socket.off('order:updated', onOrderUpdated);
    };
  }, []);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort((left, right) => {
        const priorityGap = getPriority(left.status) - getPriority(right.status);

        if (priorityGap !== 0) {
          return priorityGap;
        }

        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      }),
    [orders],
  );
  const attentionOrders = useMemo(
    () =>
      sortedOrders
        .map((order) => ({
          order,
          reasons: getOrderAttentionReasons(order),
        }))
        .filter((entry) => entry.reasons.length > 0),
    [sortedOrders],
  );
  const attentionCount = attentionOrders.length;
  const liveCount = useMemo(
    () => sortedOrders.filter((order) => order.status === 'out_for_delivery').length,
    [sortedOrders],
  );
  const deliveredCount = useMemo(
    () => sortedOrders.filter((order) => order.status === 'delivered').length,
    [sortedOrders],
  );
  const filteredOrders = useMemo(() => {
    if (filter === 'attention') {
      return attentionOrders.map((entry) => entry.order);
    }

    if (filter === 'live') {
      return sortedOrders.filter((order) => order.status === 'out_for_delivery');
    }

    if (filter === 'delivered') {
      return sortedOrders.filter((order) => order.status === 'delivered');
    }

    return sortedOrders;
  }, [attentionOrders, filter, sortedOrders]);

  const leadAlert = attentionOrders[0];

  return (
    <ScreenLayout>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Dispatch queue</Text>
        <Text style={styles.heroTitle}>
          {attentionCount ? `${attentionCount} orders need intervention` : 'Queue is under control'}
        </Text>
        <Text style={styles.heroMeta}>
          {leadAlert
            ? `Top risk: ${leadAlert.reasons[0]} on order #${leadAlert.order._id.slice(-6).toUpperCase()}`
            : 'New orders and live deliveries will appear here automatically.'}
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{attentionCount}</Text>
            <Text style={styles.heroStatLabel}>Attention</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{liveCount}</Text>
            <Text style={styles.heroStatLabel}>Live</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{deliveredCount}</Text>
            <Text style={styles.heroStatLabel}>Delivered</Text>
          </View>
        </View>
      </View>

      {attentionOrders.length ? (
        <View style={styles.alertList}>
          {attentionOrders.slice(0, 3).map(({ order, reasons }) => {
            const routeName =
              order.status === 'pending' || order.status === 'approved' ? 'AssignWorker' : 'MapTracking';

            return (
              <Pressable
                key={order._id}
                onPress={() => navigation.navigate(routeName, { order })}
              >
                <Card style={styles.alertCard}>
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertTitle}>#{order._id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.alertStatus}>{humanizeStatus(order.status)}</Text>
                  </View>
                  <Text style={styles.alertReason}>{reasons[0]}</Text>
                  <Text numberOfLines={2} style={styles.alertMeta}>
                    {order.deliveryAddress || 'Delivery point still missing'} • Updated {formatDateTime(order.updatedAt)}
                  </Text>
                </Card>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.filterWrap}>
        {FILTERS.map((option) => {
          const active = option.key === filter;

          return (
            <Pressable
              key={option.key}
              onPress={() => setFilter(option.key)}
              style={[styles.filterChip, active ? styles.filterChipActive : null]}
            >
              <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {filteredOrders.length === 0 ? (
        <EmptyState
          title={orders.length === 0 ? 'No orders available' : `No ${filter} orders`}
          subtitle={
            orders.length === 0
              ? 'Orders will appear here as customers place them.'
              : 'Try a different filter to review the rest of the queue.'
          }
        />
      ) : (
        filteredOrders.map((order) => {
          const actionLabel =
            order.status === 'pending' || order.status === 'approved' ? 'Assign' : 'Track';

          return (
            <OrderCard
              key={order._id}
              order={order}
              onPress={() =>
                navigation.navigate(
                  order.status === 'pending' || order.status === 'approved' ? 'AssignWorker' : 'MapTracking',
                  {
                    order,
                  },
                )
              }
              actionLabel={actionLabel}
              onActionPress={() =>
                navigation.navigate(
                  order.status === 'pending' || order.status === 'approved' ? 'AssignWorker' : 'MapTracking',
                  {
                    order,
                  },
                )
              }
            />
          );
        })
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    alertCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 8,
    },
    alertHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    alertList: {
      gap: theme.spacing.sm,
    },
    alertMeta: {
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
    alertReason: {
      color: theme.colors.warning,
      fontFamily: theme.fontFamily.heading,
      fontWeight: '700',
    },
    alertStatus: {
      color: theme.colors.textMuted,
      fontSize: 12,
      textTransform: 'uppercase',
    },
    alertTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
    },
    error: {
      color: theme.colors.danger,
    },
    filterChip: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: 14,
    },
    filterChipActive: {
      backgroundColor: theme.colors.accentMuted,
      borderColor: theme.colors.accent,
    },
    filterChipText: {
      color: theme.colors.textMuted,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    filterChipTextActive: {
      color: theme.colors.accent,
    },
    filterWrap: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    heroCard: {
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 10,
      padding: theme.spacing.lg,
    },
    heroEyebrow: {
      color: theme.colors.textMuted,
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    heroMeta: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    heroStat: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flex: 1,
      gap: 4,
      padding: theme.spacing.md,
    },
    heroStatLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    heroStats: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    heroStatValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 20,
      fontWeight: '700',
    },
    heroTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 30,
    },
  });

export default OrdersScreen;
