import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { OrderCard } from '../../components/OrderCard';
import { ScreenLayout } from '../../components/ScreenLayout';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { ApiEnvelope, Order } from '../../types';
import { useAppTheme } from '../../theme/ThemeProvider';
import { upsertById } from '../../utils/collections';
import { extractErrorMessage } from '../../utils/formatters';

const OrdersScreen = ({ navigation }: { navigation: any }) => {
  const { theme } = useAppTheme();
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

  return (
    <ScreenLayout title="All Orders" subtitle="Dispatch, reassign, or monitor every live order from one queue.">
      {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}
      {orders.length === 0 ? (
        <EmptyState title="No orders available" subtitle="Orders will appear here as customers place them." />
      ) : (
        orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            actionLabel={order.status === 'delivered' ? 'Track' : 'Assign'}
            onActionPress={() =>
              navigation.navigate(order.status === 'delivered' ? 'MapTracking' : 'AssignWorker', {
                order,
              })
            }
          />
        ))
      )}
    </ScreenLayout>
  );
};

export default OrdersScreen;
