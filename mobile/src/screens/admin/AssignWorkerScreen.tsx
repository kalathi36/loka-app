import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { OrderCard } from '../../components/OrderCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import api from '../../services/api';
import { ApiEnvelope, Order, User } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, getEntityName } from '../../utils/formatters';

const AssignWorkerScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const styles = useThemedStyles(createStyles);
  const initialOrderId = route.params?.order?._id || '';
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setError('');
      const [ordersResponse, workersResponse] = await Promise.all([
        api.get<ApiEnvelope<Order[]>>('/orders'),
        api.get<ApiEnvelope<User[]>>('/workers'),
      ]);

      setOrders(ordersResponse.data.data.filter((order) => order.status !== 'delivered'));
      setWorkers(workersResponse.data.data);
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order._id === selectedOrderId),
    [orders, selectedOrderId],
  );

  const selectedWorker = useMemo(
    () => workers.find((worker) => worker._id === selectedWorkerId),
    [workers, selectedWorkerId],
  );

  const assignWorker = async () => {
    if (!selectedOrderId || !selectedWorkerId) {
      setError('Select both an order and a worker.');
      return;
    }

    setSubmitting(true);

    try {
      setError('');
      await api.put(`/orders/${selectedOrderId}/assign`, {
        workerId: selectedWorkerId,
      });

      await loadData();
      setSelectedWorkerId('');
    } catch (assignError) {
      setError(extractErrorMessage(assignError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout title="Assign Worker" subtitle="Match active orders to available delivery staff.">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.selectionSummary}>
        <Text style={styles.summaryLine}>Order: {selectedOrder ? selectedOrder._id.slice(-6).toUpperCase() : 'None selected'}</Text>
        <Text style={styles.summaryLine}>Worker: {selectedWorker ? selectedWorker.name : 'None selected'}</Text>
      </View>
      <Text style={styles.sectionTitle}>Available Workers</Text>
      <View style={styles.workerList}>
        {workers.map((worker) => {
          const active = worker._id === selectedWorkerId;
          return (
            <Pressable
              key={worker._id}
              onPress={() => setSelectedWorkerId(worker._id)}
              style={[styles.workerCard, active ? styles.workerCardActive : null]}
            >
              <Text style={styles.workerName}>{worker.name}</Text>
              <Text style={styles.workerMeta}>{worker.phone}</Text>
            </Pressable>
          );
        })}
      </View>
      <PrimaryButton label="Confirm Assignment" onPress={assignWorker} loading={submitting} />
      <Text style={styles.sectionTitle}>Orders Pending Assignment</Text>
      {orders.length === 0 ? (
        <EmptyState title="Nothing to assign" subtitle="All open orders already have an owner." />
      ) : (
        orders.map((order) => (
          <Pressable key={order._id} onPress={() => setSelectedOrderId(order._id)}>
            <View style={order._id === selectedOrderId ? styles.orderSelected : null}>
              <OrderCard
                order={order}
                actionLabel="Select"
                onActionPress={() => setSelectedOrderId(order._id)}
              />
              <Text style={styles.orderMeta}>Customer: {getEntityName(order.customerId, 'Customer')}</Text>
            </View>
          </Pressable>
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
    selectionSummary: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 8,
      padding: theme.spacing.md,
    },
    summaryLine: {
      color: theme.colors.textMuted,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
    },
    workerList: {
      gap: 10,
    },
    workerCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      padding: theme.spacing.md,
    },
    workerCardActive: {
      borderColor: theme.colors.accentSecondary,
      backgroundColor: theme.colors.surfaceMuted,
    },
    workerName: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    workerMeta: {
      color: theme.colors.textMuted,
      marginTop: 4,
    },
    orderSelected: {
      borderColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      padding: 4,
    },
    orderMeta: {
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
  });

export default AssignWorkerScreen;
