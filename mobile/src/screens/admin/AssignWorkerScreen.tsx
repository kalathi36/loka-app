import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../../components/AppIcon';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import api from '../../services/api';
import { showToast } from '../../services/toast';
import { ApiEnvelope, Order, User } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import {
  extractErrorMessage,
  formatCurrency,
  formatDateTime,
  getEntityId,
  getEntityName,
  humanizeStatus,
} from '../../utils/formatters';

interface AssignmentFlash {
  orderCode: string;
  workerName: string;
  nextOrderCode?: string;
}

const getOrderCode = (order?: Order | null) => order?._id.slice(-6).toUpperCase() || '------';

const AssignWorkerScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const styles = useThemedStyles(createStyles);
  const initialOrderId = route.params?.order?._id || '';
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [assignmentFlash, setAssignmentFlash] = useState<AssignmentFlash | null>(null);

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [loadData, navigation]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order._id === selectedOrderId),
    [orders, selectedOrderId],
  );

  const selectedWorker = useMemo(
    () => workers.find((worker) => worker._id === selectedWorkerId),
    [workers, selectedWorkerId],
  );

  const workerLoad = useMemo(
    () =>
      orders.reduce<Record<string, number>>((carry, order) => {
        const workerId = getEntityId(order.assignedWorker);

        if (workerId) {
          carry[workerId] = (carry[workerId] || 0) + 1;
        }

        return carry;
      }, {}),
    [orders],
  );

  const selectedAssignedWorkerId = getEntityId(selectedOrder?.assignedWorker);
  const queueOrders = useMemo(
    () => orders.filter((order) => !getEntityId(order.assignedWorker) || order._id === selectedOrderId),
    [orders, selectedOrderId],
  );
  const unassignedOrders = useMemo(
    () => orders.filter((order) => !getEntityId(order.assignedWorker)),
    [orders],
  );

  useEffect(() => {
    if (!orders.length) {
      if (selectedOrderId) {
        setSelectedOrderId('');
      }

      return;
    }

    if (selectedOrderId && orders.some((order) => order._id === selectedOrderId)) {
      return;
    }

    const preferredOrder =
      (initialOrderId && orders.find((order) => order._id === initialOrderId)) ||
      orders.find((order) => !getEntityId(order.assignedWorker)) ||
      orders[0];

    if (preferredOrder && preferredOrder._id !== selectedOrderId) {
      setSelectedOrderId(preferredOrder._id);
    }
  }, [initialOrderId, orders, selectedOrderId]);

  useEffect(() => {
    if (!workers.length) {
      if (selectedWorkerId) {
        setSelectedWorkerId('');
      }

      return;
    }

    if (
      selectedAssignedWorkerId &&
      workers.some((worker) => worker._id === selectedAssignedWorkerId) &&
      selectedAssignedWorkerId !== selectedWorkerId
    ) {
      setSelectedWorkerId(selectedAssignedWorkerId);
      return;
    }

    if (!selectedWorkerId || !workers.some((worker) => worker._id === selectedWorkerId)) {
      setSelectedWorkerId(workers[0]._id);
    }
  }, [selectedAssignedWorkerId, selectedWorkerId, workers]);

  const handleOrderSelect = (order: Order) => {
    setAssignmentFlash(null);
    setSelectedOrderId(order._id);

    const assignedWorkerId = getEntityId(order.assignedWorker);

    if (assignedWorkerId) {
      setSelectedWorkerId(assignedWorkerId);
    }
  };

  const assignWorker = async () => {
    if (!selectedOrderId || !selectedWorkerId) {
      setError('Select both an order and a worker.');
      showToast({
        type: 'error',
        title: 'Selection missing',
        message: 'Choose an order and a worker before confirming.',
      });
      return;
    }

    if (selectedAssignedWorkerId === selectedWorkerId) {
      showToast({
        type: 'info',
        title: 'Already assigned',
        message: `${selectedWorker?.name || 'This worker'} is already assigned to this order.`,
      });
      return;
    }

    setSubmitting(true);

    try {
      setError('');
      await api.put(`/orders/${selectedOrderId}/assign`, {
        workerId: selectedWorkerId,
      });

      const worker = workers.find((entry) => entry._id === selectedWorkerId);
      const updatedOrders = orders.map((order) =>
        order._id === selectedOrderId
          ? {
              ...order,
              assignedWorker: worker || selectedWorkerId,
            }
          : order,
      );

      const nextOrder = updatedOrders.find(
        (order) => order._id !== selectedOrderId && !getEntityId(order.assignedWorker),
      );

      setOrders(updatedOrders);
      setAssignmentFlash({
        orderCode: getOrderCode(selectedOrder),
        workerName: worker?.name || 'Worker',
        nextOrderCode: nextOrder ? getOrderCode(nextOrder) : undefined,
      });

      if (nextOrder) {
        setSelectedOrderId(nextOrder._id);
      }

      showToast({
        type: 'success',
        title: 'Assignment saved',
        message: `${worker?.name || 'Worker'} is now handling order #${getOrderCode(selectedOrder)}.`,
      });

      await loadData();
    } catch (assignError) {
      setError(extractErrorMessage(assignError));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmLabel = useMemo(() => {
    if (!workers.length) {
      return 'No workers available';
    }

    if (!selectedOrder) {
      return 'Select an order first';
    }

    if (!selectedWorker) {
      return 'Select a worker';
    }

    if (selectedAssignedWorkerId === selectedWorkerId) {
      return 'Already assigned to selected worker';
    }

    if (selectedAssignedWorkerId) {
      return `Reassign to ${selectedWorker.name}`;
    }

    return `Assign to ${selectedWorker.name}`;
  }, [selectedAssignedWorkerId, selectedOrder, selectedWorker, selectedWorkerId, workers.length]);

  return (
    <ScreenLayout title="Assign Worker" subtitle="Pick an order, choose a worker, and move through the queue without losing context.">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {assignmentFlash ? (
        <Card style={styles.flashCard}>
          <View style={styles.flashRow}>
            <View style={styles.flashIconShell}>
              <AppIcon color={styles.flashIcon.color} name="checkmark-circle" size={22} />
            </View>
            <View style={styles.flashCopy}>
              <Text style={styles.flashTitle}>
                Assigned {assignmentFlash.workerName} to #{assignmentFlash.orderCode}
              </Text>
              <Text style={styles.flashSubtitle}>
                {assignmentFlash.nextOrderCode
                  ? `Next up: order #${assignmentFlash.nextOrderCode} is ready for assignment.`
                  : 'That assignment is complete. You can keep the same worker selected for the next dispatch.'}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      <Card style={styles.selectionCard}>
        <View style={styles.selectionHeader}>
          <View>
            <Text style={styles.selectionEyebrow}>Current assignment</Text>
            <Text style={styles.selectionTitle}>Ready to dispatch</Text>
          </View>
          <View style={styles.queueBadge}>
            <Text style={styles.queueBadgeLabel}>{unassignedOrders.length} waiting</Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryBlock}>
            <View style={styles.summaryLabelRow}>
              <AppIcon color={styles.summaryIcon.color} name="receipt-outline" size={16} />
              <Text style={styles.summaryLabel}>Order</Text>
            </View>
            <Text style={styles.summaryPrimary}>
              {selectedOrder ? `#${getOrderCode(selectedOrder)}` : 'Choose an order'}
            </Text>
            <Text style={styles.summarySecondary}>
              {selectedOrder ? humanizeStatus(selectedOrder.status) : 'Tap a dispatch card below to begin.'}
            </Text>
            {selectedOrder?.deliveryAddress ? (
              <Text style={styles.summaryMeta}>Drop: {selectedOrder.deliveryAddress}</Text>
            ) : null}
            {selectedOrder ? (
              <Text style={styles.summaryMeta}>Value: {formatCurrency(selectedOrder.totalAmount)}</Text>
            ) : null}
          </View>

          <View style={styles.summaryBlock}>
            <View style={styles.summaryLabelRow}>
              <AppIcon color={styles.summaryIcon.color} name="person-outline" size={16} />
              <Text style={styles.summaryLabel}>Worker</Text>
            </View>
            <Text style={styles.summaryPrimary}>
              {selectedWorker ? selectedWorker.name : workers.length ? 'Choose a worker' : 'No workers'}
            </Text>
            <Text style={styles.summarySecondary}>
              {selectedWorker
                ? `${workerLoad[selectedWorker._id] || 0} active orders`
                : 'Select from the crew list to continue.'}
            </Text>
            {selectedWorker ? <Text style={styles.summaryMeta}>{selectedWorker.phone}</Text> : null}
          </View>
        </View>

        {selectedOrder ? (
          <View style={styles.assignmentState}>
            <AppIcon
              color={selectedAssignedWorkerId ? styles.assignmentStateAssignedIcon.color : styles.assignmentStatePendingIcon.color}
              name={selectedAssignedWorkerId ? 'swap-horizontal-outline' : 'flash-outline'}
              size={18}
            />
            <Text style={styles.assignmentStateText}>
              {selectedAssignedWorkerId
                ? selectedAssignedWorkerId === selectedWorkerId
                  ? `${selectedWorker?.name || 'This worker'} is already handling this order.`
                  : `${getEntityName(selectedOrder.assignedWorker, 'Worker')} is currently assigned. Select another worker to reassign.`
                : 'This order still needs a worker. Confirm below when ready.'}
            </Text>
          </View>
        ) : null}
      </Card>

      <Text style={styles.sectionTitle}>1. Orders waiting for a worker</Text>
      {queueOrders.length === 0 ? (
        <EmptyState
          title="Everything is covered"
          subtitle="All active orders already have a worker assigned."
        />
      ) : (
        queueOrders.map((order) => {
          const active = order._id === selectedOrderId;
          const assignedWorkerId = getEntityId(order.assignedWorker);

          return (
            <Pressable key={order._id} onPress={() => handleOrderSelect(order)}>
              <Card style={[styles.orderCard, active ? styles.orderCardActive : null]}>
                <View style={styles.orderTopRow}>
                  <View style={styles.orderHeading}>
                    <Text style={styles.orderCode}>Order #{getOrderCode(order)}</Text>
                    <Text style={styles.orderDate}>{formatDateTime(order.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusChip, active ? styles.statusChipActive : null]}>
                    <Text style={[styles.statusChipLabel, active ? styles.statusChipLabelActive : null]}>
                      {humanizeStatus(order.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderMetrics}>
                  <View style={styles.orderMetricBox}>
                    <Text style={styles.orderMetricLabel}>Items</Text>
                    <Text style={styles.orderMetricValue}>{order.items.length}</Text>
                  </View>
                  <View style={styles.orderMetricBox}>
                    <Text style={styles.orderMetricLabel}>Value</Text>
                    <Text style={styles.orderMetricValue}>{formatCurrency(order.totalAmount)}</Text>
                  </View>
                </View>

                <Text style={styles.orderMeta}>
                  Customer: {getEntityName(order.customerId, 'Customer')}
                </Text>
                {order.deliveryAddress ? (
                  <Text style={styles.orderMeta}>Address: {order.deliveryAddress}</Text>
                ) : null}

                <View style={styles.orderFooter}>
                  <Text style={styles.orderFooterText}>
                    {assignedWorkerId
                      ? `Assigned: ${getEntityName(order.assignedWorker, 'Worker')}`
                      : 'Needs worker'}
                  </Text>
                  {active ? (
                    <View style={styles.orderSelectedBadge}>
                      <AppIcon color={styles.orderSelectedBadgeIcon.color} name="checkmark" size={14} />
                      <Text style={styles.orderSelectedBadgeLabel}>Selected</Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          );
        })
      )}

      <Text style={styles.sectionTitle}>2. Choose a worker</Text>
      {workers.length === 0 ? (
        <EmptyState
          title="No workers added yet"
          subtitle="Create a worker account first, then return here to start dispatching."
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.workerRail}
        >
          {workers.map((worker) => {
            const active = worker._id === selectedWorkerId;
            const currentForOrder = worker._id === selectedAssignedWorkerId;

            return (
              <Pressable
                key={worker._id}
                onPress={() => {
                  setAssignmentFlash(null);
                  setSelectedWorkerId(worker._id);
                }}
                style={[styles.workerCard, active ? styles.workerCardActive : null]}
              >
                <View style={styles.workerAvatar}>
                  <Text style={styles.workerAvatarLabel}>{worker.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.workerName}>{worker.name}</Text>
                <Text style={styles.workerMeta}>{worker.phone}</Text>
                <Text style={styles.workerLoad}>
                  {workerLoad[worker._id] || 0} active {workerLoad[worker._id] === 1 ? 'order' : 'orders'}
                </Text>
                {currentForOrder ? (
                  <View style={styles.workerTag}>
                    <Text style={styles.workerTagLabel}>Current</Text>
                  </View>
                ) : null}
                {active ? (
                  <View style={styles.workerSelectedBadge}>
                    <AppIcon color={styles.workerSelectedBadgeIcon.color} name="checkmark-circle" size={16} />
                    <Text style={styles.workerSelectedBadgeLabel}>Selected</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <PrimaryButton
        label={confirmLabel}
        onPress={assignWorker}
        loading={submitting}
        disabled={!selectedOrder || !selectedWorker || selectedAssignedWorkerId === selectedWorkerId || !workers.length}
      />
      <Text style={styles.helperText}>
        {unassignedOrders.length
          ? `${unassignedOrders.length} order${unassignedOrders.length === 1 ? '' : 's'} still waiting for assignment.`
          : 'No unassigned orders left. You can still reopen this screen later to reassign if needed.'}
      </Text>
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    error: {
      color: theme.colors.danger,
    },
    flashCard: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.success,
      gap: 0,
    },
    flashRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    flashIconShell: {
      alignItems: 'center',
      backgroundColor: theme.colors.glowSecondary,
      borderRadius: theme.radius.sm,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    flashIcon: {
      color: theme.colors.success,
    },
    flashCopy: {
      flex: 1,
      gap: 4,
    },
    flashTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
    },
    flashSubtitle: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    selectionCard: {
      gap: theme.spacing.md,
    },
    selectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    selectionEyebrow: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
    },
    selectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 22,
      fontWeight: '700',
      marginTop: 4,
    },
    queueBadge: {
      backgroundColor: theme.colors.accentMuted,
      borderRadius: 999,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 8,
    },
    queueBadgeLabel: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    summaryGrid: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    summaryBlock: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.sm,
      flex: 1,
      gap: 6,
      padding: theme.spacing.md,
    },
    summaryLabelRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    summaryIcon: {
      color: theme.colors.accent,
    },
    summaryLabel: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    summaryPrimary: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    summarySecondary: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    summaryMeta: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    assignmentState: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.sm,
      flexDirection: 'row',
      gap: theme.spacing.sm,
      padding: theme.spacing.sm,
    },
    assignmentStatePendingIcon: {
      color: theme.colors.warning,
    },
    assignmentStateAssignedIcon: {
      color: theme.colors.accentSecondary,
    },
    assignmentStateText: {
      color: theme.colors.textMuted,
      flex: 1,
      lineHeight: 20,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
    },
    orderCard: {
      gap: theme.spacing.sm,
    },
    orderCardActive: {
      borderColor: theme.colors.accent,
      borderWidth: 2,
      shadowColor: theme.colors.accent,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: theme.isDark ? 0.18 : 0.12,
      shadowRadius: 18,
    },
    orderTopRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    orderHeading: {
      flex: 1,
      gap: 4,
      paddingRight: theme.spacing.sm,
    },
    orderCode: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 20,
      fontWeight: '700',
    },
    orderDate: {
      color: theme.colors.textMuted,
      fontSize: 13,
    },
    statusChip: {
      backgroundColor: theme.colors.accentMuted,
      borderRadius: 999,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 8,
    },
    statusChipActive: {
      backgroundColor: theme.colors.accent,
    },
    statusChipLabel: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    statusChipLabelActive: {
      color: theme.colors.textOnAccent,
    },
    orderMetrics: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    orderMetricBox: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.sm,
      flex: 1,
      gap: 6,
      padding: theme.spacing.sm,
    },
    orderMetricLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    orderMetricValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    orderMeta: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    orderFooter: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    orderFooterText: {
      color: theme.colors.text,
      flex: 1,
      fontWeight: '600',
      paddingRight: theme.spacing.sm,
    },
    orderSelectedBadge: {
      alignItems: 'center',
      backgroundColor: theme.colors.accentMuted,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
    },
    orderSelectedBadgeIcon: {
      color: theme.colors.accent,
    },
    orderSelectedBadgeLabel: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    workerRail: {
      gap: theme.spacing.sm,
      paddingRight: theme.spacing.md,
    },
    workerCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      minWidth: 170,
      padding: theme.spacing.md,
      position: 'relative',
    },
    workerCardActive: {
      borderColor: theme.colors.accent,
      borderWidth: 2,
      backgroundColor: theme.colors.surfaceMuted,
    },
    workerAvatar: {
      alignItems: 'center',
      backgroundColor: theme.colors.accentMuted,
      borderRadius: 999,
      height: 52,
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
      width: 52,
    },
    workerAvatarLabel: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 24,
      fontWeight: '700',
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
    workerLoad: {
      color: theme.colors.textMuted,
      marginTop: theme.spacing.sm,
    },
    workerTag: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.glowSecondary,
      borderRadius: 999,
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
    },
    workerTagLabel: {
      color: theme.colors.success,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    workerSelectedBadge: {
      alignItems: 'center',
      backgroundColor: theme.colors.accentMuted,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 4,
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
    },
    workerSelectedBadgeIcon: {
      color: theme.colors.accent,
    },
    workerSelectedBadgeLabel: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    helperText: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
  });

export default AssignWorkerScreen;
