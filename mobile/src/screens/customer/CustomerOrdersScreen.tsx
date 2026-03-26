import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { extractErrorMessage } from '../../utils/formatters';

const CustomerOrdersScreen = ({ navigation }: { navigation: any }) => {
  const styles = useThemedStyles(createStyles);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

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

  const activeOrders = useMemo(
    () => orders.filter((order) => order.status !== 'delivered').length,
    [orders],
  );
  const deliveredOrders = useMemo(
    () => orders.filter((order) => order.status === 'delivered').length,
    [orders],
  );

  return (
    <ScreenLayout title="Orders" subtitle="A clean list of every order you have placed with live updates.">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.grid}>
        <StatCard label="Active" value={activeOrders} iconName="flash-outline" helper="Still moving" />
        <StatCard
          label="Delivered"
          value={deliveredOrders}
          iconName="checkmark-done-outline"
          helper="Completed orders"
          accent="#19A463"
        />
      </View>
      {orders.length === 0 ? (
        <EmptyState title="No orders placed" subtitle="Orders will appear here after checkout." />
      ) : (
        orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            actionLabel="Track"
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
    grid: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
  });

export default CustomerOrdersScreen;
