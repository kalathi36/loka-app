import Clipboard from '@react-native-clipboard/clipboard';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../../components/AppIcon';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { OrderCard } from '../../components/OrderCard';
import { ScreenLayout } from '../../components/ScreenLayout';
import { StatCard } from '../../components/StatCard';
import api, { getApiErrorStatus } from '../../services/api';
import { showToast } from '../../services/toast';
import { useAuth } from '../../store/AuthContext';
import { AdminDashboard, Analytics, ApiEnvelope } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency } from '../../utils/formatters';

const createEmptyOrdersByStatus = () => ({
  pending: 0,
  approved: 0,
  out_for_delivery: 0,
  delivered: 0,
});

const normalizeDashboard = (payload?: Partial<AdminDashboard & Analytics>): AdminDashboard => ({
  totalCustomers: payload?.totalCustomers || 0,
  totalWorkers: payload?.totalWorkers || 0,
  totalOrders: payload?.totalOrders || 0,
  totalWorkerCost: payload?.totalWorkerCost || 0,
  totalPaidToWorkers: payload?.totalPaidToWorkers || 0,
  recentOrders: payload?.recentOrders || [],
  ordersByStatus: {
    ...createEmptyOrdersByStatus(),
    ...(payload?.ordersByStatus || {}),
  },
});

const AdminDashboardScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const orgCode = user?.organization?.code || '';

  const copyCode = useCallback(() => {
    if (!orgCode) {
      return;
    }

    Clipboard.setString(orgCode);
    showToast({
      type: 'success',
      title: 'Code copied',
      message: 'Organization code copied to clipboard.',
    });
  }, [orgCode]);

  const shareCode = useCallback(async () => {
    if (!orgCode) {
      return;
    }

    try {
      await Share.share({
        message: `Join ${user?.organization?.name || 'our organization'} on Loka with code: ${orgCode}`,
        title: 'Loka organization code',
      });
    } catch (shareError) {
      setError(extractErrorMessage(shareError));
    }
  }, [orgCode, user?.organization?.name]);

  const loadDashboard = useCallback(async () => {
    try {
      setError('');
      const response = await api.get<ApiEnvelope<AdminDashboard>>('/admin/dashboard');
      setDashboard(normalizeDashboard(response.data.data));
    } catch (loadError) {
      if (getApiErrorStatus(loadError) === 404) {
        try {
          const legacyResponse = await api.get<ApiEnvelope<Partial<Analytics>>>('/admin/analytics');
          setDashboard(normalizeDashboard(legacyResponse.data.data));
          setError('Using the legacy analytics endpoint. Redeploy the backend to enable the upgraded dashboard API.');
          return;
        } catch (legacyError) {
          setError(extractErrorMessage(legacyError));
          return;
        }
      }

      setError(extractErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboard();
    });

    return unsubscribe;
  }, [loadDashboard, navigation]);

  const pendingCount = dashboard?.ordersByStatus.pending || 0;
  const approvedCount = dashboard?.ordersByStatus.approved || 0;
  const liveCount = dashboard?.ordersByStatus.out_for_delivery || 0;
  const deliveredCount = dashboard?.ordersByStatus.delivered || 0;
  const attentionCount = pendingCount + approvedCount;
  const recentQueue = useMemo(
    () => dashboard?.recentOrders?.slice(0, 3) || [],
    [dashboard?.recentOrders],
  );

  if (loading && !dashboard) {
    return <LoadingOverlay label="Loading dashboard" />;
  }

  return (
    <ScreenLayout flushTop>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.orgCard}>
        <Text style={styles.orgLabel}>Operations command</Text>
        <Text style={styles.orgName}>{user?.organization?.name || 'Workspace'}</Text>
        <Text style={styles.orgDescription}>
          {attentionCount
            ? `${attentionCount} order${attentionCount === 1 ? '' : 's'} need assignment or approval right now.`
            : 'Orders, teams, and payouts are all moving without an immediate queue spike.'}
        </Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroChip}>
            <Text style={styles.heroChipLabel}>Org code</Text>
            <Text style={styles.heroChipValue}>{orgCode || 'Pending'}</Text>
          </View>
          <View style={styles.heroChip}>
            <Text style={styles.heroChipLabel}>Payroll paid</Text>
            <Text style={styles.heroChipValue}>{formatCurrency(dashboard?.totalPaidToWorkers || 0)}</Text>
          </View>
        </View>
        <View style={styles.heroActions}>
          <Pressable onPress={copyCode} style={styles.heroActionButton}>
            <AppIcon color={theme.colors.accent} name="copy-outline" size={18} />
            <Text style={styles.heroActionLabel}>Copy code</Text>
          </Pressable>
          <Pressable onPress={shareCode} style={styles.heroActionButton}>
            <AppIcon color={theme.colors.accent} name="share-social-outline" size={18} />
            <Text style={styles.heroActionLabel}>Share code</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        <StatCard
          label="Attention"
          value={attentionCount}
          iconName="alert-circle-outline"
          helper="Pending or approved"
          accent={theme.colors.warning}
        />
        <StatCard
          label="Live"
          value={liveCount}
          iconName="navigate-outline"
          helper="Out for delivery"
          accent={theme.colors.accentSecondary}
        />
      </View>
      <View style={styles.grid}>
        <StatCard
          label="Customers"
          value={dashboard?.totalCustomers || 0}
          iconName="storefront-outline"
          helper="Active buyer accounts"
        />
        <StatCard
          label="Workers"
          value={dashboard?.totalWorkers || 0}
          iconName="people-outline"
          helper="Field team accounts"
          accent={theme.colors.accentSecondary}
        />
      </View>
      <View style={styles.grid}>
        <StatCard
          label="Orders"
          value={dashboard?.totalOrders || 0}
          iconName="receipt-outline"
          helper={`Delivered ${deliveredCount}`}
        />
        <StatCard
          label="Worker Cost"
          value={formatCurrency(dashboard?.totalWorkerCost || 0)}
          accent={theme.colors.warning}
          iconName="cash-outline"
          helper="Accrued wages to date"
        />
      </View>

      <View style={styles.quickActionRow}>
        <Pressable
          onPress={() => navigation.getParent()?.navigate('AdminOrdersTab')}
          style={styles.quickAction}
        >
          <AppIcon color={theme.colors.accent} name="receipt-outline" size={18} />
          <Text style={styles.quickActionTitle}>Open queue</Text>
          <Text style={styles.quickActionMeta}>{attentionCount} need action</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.getParent()?.navigate('AdminOrdersTab', { screen: 'MapTracking' })}
          style={styles.quickAction}
        >
          <AppIcon color={theme.colors.accentSecondary} name="navigate-outline" size={18} />
          <Text style={styles.quickActionTitle}>Live map</Text>
          <Text style={styles.quickActionMeta}>{liveCount} on the road</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.getParent()?.navigate('AdminOpsTab')}
          style={styles.quickAction}
        >
          <AppIcon color={theme.colors.warning} name="layers-outline" size={18} />
          <Text style={styles.quickActionTitle}>Operations</Text>
          <Text style={styles.quickActionMeta}>Products, staff, pay</Text>
        </Pressable>
      </View>

      <View style={styles.breakdownCard}>
        <Text style={styles.sectionTitle}>Queue Breakdown</Text>
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownChip}>
            <Text style={styles.breakdownChipLabel}>Pending</Text>
            <Text style={styles.breakdownChipValue}>{pendingCount}</Text>
          </View>
          <View style={styles.breakdownChip}>
            <Text style={styles.breakdownChipLabel}>Approved</Text>
            <Text style={styles.breakdownChipValue}>{approvedCount}</Text>
          </View>
          <View style={styles.breakdownChip}>
            <Text style={styles.breakdownChipLabel}>Live</Text>
            <Text style={styles.breakdownChipValue}>{liveCount}</Text>
          </View>
          <View style={styles.breakdownChip}>
            <Text style={styles.breakdownChipLabel}>Delivered</Text>
            <Text style={styles.breakdownChipValue}>{deliveredCount}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Queue</Text>
      {recentQueue.length ? (
        recentQueue.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            actionLabel={order.status === 'pending' || order.status === 'approved' ? 'Assign' : 'Track'}
            onActionPress={() =>
              navigation.getParent()?.navigate('AdminOrdersTab', {
                screen: order.status === 'pending' || order.status === 'approved' ? 'Orders' : 'MapTracking',
              })
            }
          />
        ))
      ) : (
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownLine}>No orders have been placed yet.</Text>
        </View>
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    breakdownCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 8,
      padding: theme.spacing.md,
    },
    breakdownChip: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      gap: 4,
      minWidth: '47%',
      padding: theme.spacing.sm,
      width: '47%',
    },
    breakdownChipLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    breakdownChipValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    breakdownGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    breakdownLine: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    error: {
      color: theme.colors.danger,
    },
    grid: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    heroActionButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      minHeight: 42,
      paddingHorizontal: theme.spacing.md,
    },
    heroActionLabel: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    heroActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    heroChip: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flex: 1,
      gap: 4,
      padding: theme.spacing.md,
    },
    heroChipLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    heroChipValue: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 14,
      fontWeight: '700',
    },
    heroMetaRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    orgCard: {
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 10,
      padding: theme.spacing.lg,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: theme.isDark ? 0.18 : 0.08,
      shadowRadius: 18,
    },
    orgDescription: {
      color: theme.colors.textMuted,
      lineHeight: 21,
    },
    orgLabel: {
      color: theme.colors.textMuted,
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    orgName: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 24,
      fontWeight: '700',
    },
    quickAction: {
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flex: 1,
      gap: 6,
      minHeight: 96,
      padding: theme.spacing.md,
    },
    quickActionMeta: {
      color: theme.colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
    quickActionRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    quickActionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
  });

export default AdminDashboardScreen;
