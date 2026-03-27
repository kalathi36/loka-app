import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionTile } from '../../components/ActionTile';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { StatCard } from '../../components/StatCard';
import api, { getApiErrorStatus } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { ApiEnvelope, Order, WorkerEarnings } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency, formatDate, formatTime, humanizeStatus } from '../../utils/formatters';

interface AttendanceWorkerResponse {
  records: Array<{
    _id: string;
    date: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    dailyWage: number;
  }>;
}

const WorkerHomeScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [orders, setOrders] = useState<Order[]>([]);
  const [earnings, setEarnings] = useState<WorkerEarnings | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceWorkerResponse['records'][number] | null>(null);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    try {
      setError('');
      const [ordersResult, earningsResult, attendanceResult] = await Promise.allSettled([
        api.get<ApiEnvelope<Order[]>>('/orders'),
        api.get<ApiEnvelope<WorkerEarnings>>('/workers/earnings'),
        api.get<ApiEnvelope<AttendanceWorkerResponse>>(`/attendance/worker/${user?._id}`),
      ]);

      if (ordersResult.status === 'fulfilled') {
        setOrders(ordersResult.value.data.data);
      }

      if (earningsResult.status === 'fulfilled') {
        setEarnings(earningsResult.value.data.data);
      } else if (getApiErrorStatus(earningsResult.reason) === 404) {
        setEarnings({
          totalDaysWorked: 0,
          totalEarnings: 0,
          totalPaid: 0,
          outstandingBalance: 0,
          dailyEarnings: [],
        });
        setError('Using a limited worker summary. Redeploy the backend to enable the earnings API.');
      }

      if (attendanceResult.status === 'fulfilled') {
        const today = formatDate(new Date());
        setTodayAttendance(
          attendanceResult.value.data.data.records.find((record) => formatDate(record.date) === today) || null,
        );
      } else if (getApiErrorStatus(attendanceResult.reason) === 404) {
        setTodayAttendance(null);
      }

      if (
        ordersResult.status === 'rejected' &&
        earningsResult.status === 'rejected' &&
        attendanceResult.status === 'rejected'
      ) {
        throw ordersResult.reason;
      }
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    }
  }, [user?._id]);

  useEffect(() => {
    loadSummary();
    const unsubscribe = navigation.addListener('focus', () => {
      loadSummary();
    });

    return unsubscribe;
  }, [loadSummary, navigation]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort((left, right) => {
        const leftDelivered = left.status === 'delivered' ? 1 : 0;
        const rightDelivered = right.status === 'delivered' ? 1 : 0;

        if (leftDelivered !== rightDelivered) {
          return leftDelivered - rightDelivered;
        }

        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      }),
    [orders],
  );
  const activeOrders = sortedOrders.filter((order) => order.status !== 'delivered').length;
  const completedOrders = sortedOrders.filter((order) => order.status === 'delivered').length;
  const nextOrder = sortedOrders.find((order) => order.status !== 'delivered') || null;
  const todayEarnings = todayAttendance?.dailyWage || 0;
  const attendanceStatus = todayAttendance?.checkOutTime
    ? `Checked out at ${formatTime(todayAttendance.checkOutTime)}`
    : todayAttendance?.checkInTime
      ? `Checked in at ${formatTime(todayAttendance.checkInTime)}`
      : 'Not checked in';

  return (
    <ScreenLayout>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Card style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Today</Text>
        <Text style={styles.heroTitle}>{user?.name?.split(' ')[0] || 'Worker'}</Text>
        <Text style={styles.heroMeta}>
          {todayAttendance?.checkInTime
            ? `${activeOrders} active job${activeOrders === 1 ? '' : 's'} on your route.`
            : 'Start attendance first to begin your route with a verified location pin.'}
        </Text>
        <Text style={styles.heroStatus}>{attendanceStatus}</Text>
      </Card>

      <View style={styles.grid}>
        <StatCard
          label="Today Pay"
          value={formatCurrency(todayEarnings)}
          accent={theme.colors.accentSecondary}
          iconName="wallet-outline"
          helper="Current daily wage"
        />
        <StatCard
          label="Active Jobs"
          value={activeOrders}
          accent={theme.colors.warning}
          iconName="trail-sign-outline"
          helper="Still on your route"
        />
      </View>
      <View style={styles.grid}>
        <StatCard
          label="Completed"
          value={completedOrders}
          iconName="checkmark-done-outline"
          helper="Finished deliveries"
          accent={theme.colors.accent}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(earnings?.outstandingBalance || 0)}
          iconName="cash-outline"
          helper="Still to be paid"
          accent={theme.colors.accentSecondary}
        />
      </View>

      {nextOrder ? (
        <Card style={styles.nextJobCard}>
          <Text style={styles.nextJobEyebrow}>Next stop</Text>
          <Text style={styles.nextJobTitle}>Order #{nextOrder._id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.nextJobMeta}>{humanizeStatus(nextOrder.status)}</Text>
          <Text numberOfLines={2} style={styles.nextJobAddress}>
            {nextOrder.deliveryAddress || 'Customer will confirm exact delivery point on call.'}
          </Text>
          <View style={styles.nextJobActions}>
            <PrimaryButton
              label="Open Route"
              onPress={() => navigation.getParent()?.navigate('WorkerOrdersTab', { screen: 'AssignedOrders' })}
              style={styles.nextJobButton}
            />
            <PrimaryButton
              label="Update Status"
              variant="outline"
              onPress={() => navigation.getParent()?.navigate('WorkerOrdersTab', { screen: 'Delivery', params: { order: nextOrder } })}
              style={styles.nextJobButton}
            />
          </View>
        </Card>
      ) : null}

      <ActionTile
        title="Attendance"
        subtitle="Check in, check out, and confirm your live field location."
        iconName="time-outline"
        badge={todayAttendance?.checkOutTime ? 'Closed' : todayAttendance?.checkInTime ? 'Live' : 'Pending'}
        accentColor={theme.colors.warning}
        onPress={() => navigation.getParent()?.navigate('WorkerTodayTab', { screen: 'Attendance' })}
      />
      <ActionTile
        title="Orders"
        subtitle="See the current route, navigation, and delivery updates."
        iconName="trail-sign-outline"
        badge={`${activeOrders} live`}
        onPress={() => navigation.getParent()?.navigate('WorkerOrdersTab', { screen: 'AssignedOrders' })}
      />
      <ActionTile
        title="Pay"
        subtitle="Review total wages, payouts, and any outstanding amount."
        iconName="wallet-outline"
        badge={formatCurrency(earnings?.outstandingBalance || 0)}
        accentColor={theme.colors.accentSecondary}
        onPress={() => navigation.getParent()?.navigate('WorkerPayTab')}
      />
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
    heroCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: theme.isDark ? 0.18 : 0.08,
      shadowRadius: 18,
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
    heroStatus: {
      color: theme.colors.accentSecondary,
      fontFamily: theme.fontFamily.heading,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    heroTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 30,
    },
    nextJobActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    nextJobAddress: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    nextJobButton: {
      flex: 1,
    },
    nextJobCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 8,
    },
    nextJobEyebrow: {
      color: theme.colors.textMuted,
      fontSize: 12,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    nextJobMeta: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    nextJobTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 20,
      fontWeight: '700',
    },
  });

export default WorkerHomeScreen;
