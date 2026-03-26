import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionTile } from '../../components/ActionTile';
import { Card } from '../../components/Card';
import { ScreenLayout } from '../../components/ScreenLayout';
import { StatCard } from '../../components/StatCard';
import api, { getApiErrorStatus } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { ApiEnvelope, Order, WorkerEarnings } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency, formatDate, formatTime } from '../../utils/formatters';

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

  const activeOrders = orders.filter((order) => order.status !== 'delivered').length;
  const todayEarnings = todayAttendance?.dailyWage || 0;
  const attendanceStatus = todayAttendance?.checkOutTime
    ? `Checked out at ${formatTime(todayAttendance.checkOutTime)}`
    : todayAttendance?.checkInTime
      ? `Checked in at ${formatTime(todayAttendance.checkInTime)}`
      : 'Not checked in';

  return (
    <ScreenLayout
      title={`Shift Ready, ${user?.name?.split(' ')[0] || 'Worker'}`}
      subtitle={`Today summary for ${user?.organization?.name || 'your workspace'} with attendance, earnings, and active dispatch work.`}
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Card style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Today status</Text>
        <Text style={styles.heroTitle}>{attendanceStatus}</Text>
        <Text style={styles.heroMeta}>
          Outstanding wages: {formatCurrency(earnings?.outstandingBalance || 0)}
        </Text>
      </Card>
      <View style={styles.grid}>
        <StatCard
          label="Attendance"
          value={todayAttendance?.checkInTime ? 'Done' : 'Open'}
          iconName="time-outline"
          helper={todayAttendance?.checkInTime ? 'Shift opened' : 'Awaiting check-in'}
        />
        <StatCard
          label="Today Pay"
          value={formatCurrency(todayEarnings)}
          accent={theme.colors.accentSecondary}
          iconName="wallet-outline"
          helper="Today wage snapshot"
        />
      </View>
      <View style={styles.grid}>
        <StatCard
          label="Assigned Orders"
          value={orders.length}
          iconName="file-tray-full-outline"
          helper="Jobs assigned to you"
        />
        <StatCard
          label="Active Orders"
          value={activeOrders}
          accent={theme.colors.warning}
          iconName="flash-outline"
          helper="Still in motion"
        />
      </View>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today Status</Text>
        <Text style={styles.summaryLine}>{attendanceStatus}</Text>
        <Text style={styles.summaryLine}>Outstanding wages: {formatCurrency(earnings?.outstandingBalance || 0)}</Text>
      </Card>
      <ActionTile
        title="Open Attendance"
        subtitle="Check in, check out, and confirm your live field location."
        iconName="time-outline"
        badge={todayAttendance?.checkOutTime ? 'Closed' : todayAttendance?.checkInTime ? 'Live' : 'Pending'}
        accentColor={theme.colors.warning}
        onPress={() => navigation.getParent()?.navigate('WorkerManageTab', { screen: 'Attendance' })}
      />
      <ActionTile
        title="View Assigned Orders"
        subtitle="Jump straight into today’s deliveries and navigation."
        iconName="trail-sign-outline"
        badge={`${orders.length} jobs`}
        onPress={() => navigation.getParent()?.navigate('WorkerManageTab', { screen: 'AssignedOrders' })}
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
    heroTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 30,
    },
    heroMeta: {
      color: theme.colors.accentSecondary,
      fontFamily: theme.fontFamily.heading,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    summaryCard: {
      gap: 8,
    },
    summaryTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    summaryLine: {
      color: theme.colors.textMuted,
    },
  });

export default WorkerHomeScreen;
