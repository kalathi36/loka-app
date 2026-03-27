import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { OrderCard } from '../../components/OrderCard';
import { ScreenLayout } from '../../components/ScreenLayout';
import { StatCard } from '../../components/StatCard';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { ApiEnvelope, Order } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { upsertById } from '../../utils/collections';
import { extractErrorMessage, formatCurrency, formatDateTime } from '../../utils/formatters';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
] as const;

type OrderFilter = (typeof FILTERS)[number]['key'];

const CustomerOrdersScreen = ({ navigation }: { navigation: any }) => {
  const styles = useThemedStyles(createStyles);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<OrderFilter>('all');

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
    const unsubscribe = navigation.addListener('focus', loadOrders);
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
      [...orders].sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      ),
    [orders],
  );
  const activeOrders = useMemo(
    () => sortedOrders.filter((order) => order.status !== 'delivered').length,
    [sortedOrders],
  );
  const deliveredOrders = useMemo(
    () => sortedOrders.filter((order) => order.status === 'delivered').length,
    [sortedOrders],
  );
  const totalSpend = useMemo(
    () => sortedOrders.reduce((sum, order) => sum + order.totalAmount, 0),
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
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Order history</Text>
        <Text style={styles.heroTitle}>{orders.length ? `${orders.length} total orders` : 'No orders yet'}</Text>
        <Text style={styles.heroMeta}>
          {orders.length
            ? `Latest change ${formatDateTime(sortedOrders[0]?.updatedAt)}`
            : 'Checkout activity will start showing here once you place an order.'}
        </Text>
        <Text style={styles.heroValue}>{formatCurrency(totalSpend)}</Text>
        <Text style={styles.heroValueLabel}>Total order value</Text>
      </Card>

      <View style={styles.grid}>
        <StatCard label="Active" value={activeOrders} iconName="flash-outline" helper="Still moving" />
        <StatCard
          accent="#19A463"
          helper="Completed orders"
          iconName="checkmark-done-outline"
          label="Delivered"
          value={deliveredOrders}
        />
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
          title={orders.length === 0 ? 'No orders placed' : `No ${filter} orders`}
          subtitle={
            orders.length === 0
              ? 'Orders will appear here after checkout.'
              : 'Try a different filter to see the rest of your order history.'
          }
        />
      ) : (
        filteredOrders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            actionLabel={order.status === 'delivered' ? 'View' : 'Track'}
            onActionPress={() => navigation.navigate('OrderTracking', { orderId: order._id })}
          />
        ))
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
    grid: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    heroCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 6,
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
    heroTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 30,
    },
    heroValue: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 28,
      fontWeight: '700',
      marginTop: 6,
    },
    heroValueLabel: {
      color: theme.colors.textMuted,
      fontSize: 12,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
  });

export default CustomerOrdersScreen;
