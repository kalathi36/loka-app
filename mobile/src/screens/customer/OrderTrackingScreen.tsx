import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { EmptyState } from '../../components/EmptyState';
import { OrderCard } from '../../components/OrderCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { ApiEnvelope, Order, WorkerLocation } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { upsertById } from '../../utils/collections';
import { extractErrorMessage, getEntityId } from '../../utils/formatters';

const fallbackRegion = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const OrderTrackingScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const highlightedOrderId = route.params?.orderId || '';
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState(highlightedOrderId);
  const [workerLocation, setWorkerLocation] = useState<WorkerLocation | null>(null);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      setError('');
      const response = await api.get<ApiEnvelope<Order[]>>('/orders');
      const nextOrders = response.data.data;
      setOrders(nextOrders);

      if (!selectedOrderId && nextOrders[0]) {
        setSelectedOrderId(nextOrders[0]._id);
      }
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    }
  }, [selectedOrderId]);

  useEffect(() => {
    loadOrders();
    const unsubscribe = navigation.addListener('focus', () => {
      loadOrders();
    });

    return unsubscribe;
  }, [navigation, loadOrders]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order._id === selectedOrderId) || orders[0],
    [orders, selectedOrderId],
  );

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      return;
    }

    const onOrderUpdated = (incomingOrder: Order) => {
      setOrders((currentOrders) => upsertById(currentOrders, incomingOrder));
    };

    const onGpsUpdated = (payload: WorkerLocation) => {
      if (payload.workerId === getEntityId(selectedOrder?.assignedWorker)) {
        setWorkerLocation(payload);
      }
    };

    socket.on('order:updated', onOrderUpdated);
    socket.on('gps:updated', onGpsUpdated);

    return () => {
      socket.off('order:updated', onOrderUpdated);
      socket.off('gps:updated', onGpsUpdated);
    };
  }, [selectedOrder?.assignedWorker]);

  const initialRegion =
    workerLocation || selectedOrder?.deliveryLocation
      ? {
          latitude:
            workerLocation?.latitude || selectedOrder?.deliveryLocation?.latitude || fallbackRegion.latitude,
          longitude:
            workerLocation?.longitude ||
            selectedOrder?.deliveryLocation?.longitude ||
            fallbackRegion.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }
      : fallbackRegion;

  return (
    <ScreenLayout title="Track Orders" subtitle="Status changes and worker movement update automatically.">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {selectedOrder ? (
        <>
          <View style={styles.mapShell}>
            <MapView
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              style={styles.map}
              initialRegion={initialRegion}
            >
              {selectedOrder.deliveryLocation ? (
                <Marker coordinate={selectedOrder.deliveryLocation} title="Delivery Point" pinColor={theme.colors.accent} />
              ) : null}
              {workerLocation ? (
                <Marker
                  coordinate={{
                    latitude: workerLocation.latitude,
                    longitude: workerLocation.longitude,
                  }}
                  title={workerLocation.workerName}
                  pinColor={theme.colors.accentSecondary}
                />
              ) : null}
            </MapView>
          </View>
          <View style={styles.quickActions}>
            <PrimaryButton label="Order Support" variant="ghost" onPress={() => navigation.navigate('Chat')} />
            <PrimaryButton label="Shop More" variant="outline" onPress={() => navigation.navigate('Products')} />
          </View>
        </>
      ) : (
        <EmptyState title="No orders yet" subtitle="Placed orders will appear here with live logistics updates." />
      )}
      {orders.map((order) => (
        <View key={order._id} style={order._id === selectedOrder?._id ? styles.selectedOrder : null}>
          <OrderCard
            order={order}
            actionLabel="Select"
            onActionPress={() => setSelectedOrderId(order._id)}
          />
        </View>
      ))}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    error: {
      color: theme.colors.danger,
    },
    mapShell: {
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      overflow: 'hidden',
    },
    map: {
      height: 300,
      width: '100%',
    },
    quickActions: {
      gap: 10,
    },
    selectedOrder: {
      borderColor: theme.colors.accentSecondary,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      padding: 4,
    },
  });

export default OrderTrackingScreen;
