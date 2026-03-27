import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { OrderCard } from '../../components/OrderCard';
import { ScreenLayout } from '../../components/ScreenLayout';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { ApiEnvelope, Order } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { upsertById } from '../../utils/collections';
import { extractErrorMessage, formatDateTime } from '../../utils/formatters';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
] as const;

type WorkerFilter = (typeof FILTERS)[number]['key'];

const getPriority = (status: Order['status']) => {
  if (status === 'out_for_delivery') {
    return 0;
  }

  if (status === 'approved') {
    return 1;
  }

  if (status === 'pending') {
    return 2;
  }

  return 3;
};

const AssignedOrdersScreen = ({ navigation }: { navigation: any }) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<WorkerFilter>('all');

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
  const activeCount = useMemo(
    () => sortedOrders.filter((order) => order.status !== 'delivered').length,
    [sortedOrders],
  );
  const deliveredCount = useMemo(
    () => sortedOrders.filter((order) => order.status === 'delivered').length,
    [sortedOrders],
  );
  const filteredOrders = useMemo(() => {
    if (filter === 'active') {
      return sortedOrders.filter((order) => order.status !== 'delivered');
    }

    if (filter === 'delivered') {
      return sortedOrders.filter((order) => order.status === 'delivered');
    }

    return sortedOrders;
  }, [filter, sortedOrders]);

  return (
    <ScreenLayout>
      {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}

      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Assigned route</Text>
        <Text style={styles.heroTitle}>{activeCount ? `${activeCount} live job${activeCount === 1 ? '' : 's'}` : 'No active jobs right now'}</Text>
        <Text style={styles.heroMeta}>
          {filteredOrders[0]
            ? `Latest update ${formatDateTime(filteredOrders[0].updatedAt)}`
            : 'New deliveries will appear here once dispatch assigns them.'}
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{activeCount}</Text>
            <Text style={styles.heroStatLabel}>Active</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{deliveredCount}</Text>
            <Text style={styles.heroStatLabel}>Delivered</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{orders.length}</Text>
            <Text style={styles.heroStatLabel}>Total</Text>
          </View>
        </View>
      </View>

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
          title={orders.length === 0 ? 'No assigned orders' : `No ${filter} orders`}
          subtitle={
            orders.length === 0
              ? 'Your assigned deliveries will appear here once dispatch begins.'
              : 'Try another filter to review the rest of your route.'
          }
        />
      ) : (
        filteredOrders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            onPress={() => navigation.navigate(order.status === 'delivered' ? 'Delivery' : 'MapNavigation', { order })}
            actionLabel={
              order.status === 'out_for_delivery'
                ? 'Complete'
                : order.status === 'delivered'
                  ? 'Review'
                  : 'Update'
            }
            onActionPress={() => navigation.navigate('Delivery', { order })}
          />
        ))
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
      letterSpacing: 0.7,
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

export default AssignedOrdersScreen;
