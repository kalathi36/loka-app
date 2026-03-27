import Clipboard from '@react-native-clipboard/clipboard';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../../components/AppIcon';
import api, { getApiErrorStatus } from '../../services/api';
import { showToast } from '../../services/toast';
import { useAuth } from '../../store/AuthContext';
import { AdminDashboard, Analytics, ApiEnvelope } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency } from '../../utils/formatters';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { OrderCard } from '../../components/OrderCard';
import { ScreenLayout } from '../../components/ScreenLayout';
import { StatCard } from '../../components/StatCard';

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

  if (loading && !dashboard) {
    return <LoadingOverlay label="Loading dashboard" />;
  }

  return (
    <ScreenLayout
      flushTop
      title="Operations Overview"
      subtitle="Key commercial metrics for customers, workers, orders, and payroll across your organization."
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.orgCard}>
        <Text style={styles.orgLabel}>Organization pulse</Text>
        <Text style={styles.orgName}>{user?.organization?.name || 'Workspace'}</Text>
        <Text style={styles.orgDescription}>
          Live demand, labor cost, and payroll movement for your dispatch network.
        </Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroChip}>
            <Text style={styles.heroChipLabel}>Share code</Text>
            <Text style={styles.heroChipValue}>{user?.organization?.code || 'Pending'}</Text>
          </View>
          <View style={styles.heroChip}>
            <Text style={styles.heroChipLabel}>Salary paid</Text>
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
          label="Customers"
          value={dashboard?.totalCustomers || 0}
          iconName="storefront-outline"
          helper="Active buyer accounts"
        />
        <StatCard
          label="Workers"
          value={dashboard?.totalWorkers || 0}
          accent={theme.colors.accentSecondary}
          iconName="people-outline"
          helper="Field team accounts"
        />
      </View>
      <View style={styles.grid}>
        <StatCard
          label="Orders"
          value={dashboard?.totalOrders || 0}
          iconName="receipt-outline"
          helper="Total orders in the org"
        />
        <StatCard
          label="Worker Cost"
          value={formatCurrency(dashboard?.totalWorkerCost || 0)}
          accent={theme.colors.warning}
          iconName="cash-outline"
          helper="Accrued wages to date"
        />
      </View>
      <View style={styles.breakdownCard}>
        <Text style={styles.sectionTitle}>Order Breakdown</Text>
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownChip}>
            <Text style={styles.breakdownChipLabel}>Pending</Text>
            <Text style={styles.breakdownChipValue}>{dashboard?.ordersByStatus.pending || 0}</Text>
          </View>
          <View style={styles.breakdownChip}>
            <Text style={styles.breakdownChipLabel}>Approved</Text>
            <Text style={styles.breakdownChipValue}>{dashboard?.ordersByStatus.approved || 0}</Text>
          </View>
          <View style={styles.breakdownChip}>
            <Text style={styles.breakdownChipLabel}>Out for delivery</Text>
            <Text style={styles.breakdownChipValue}>{dashboard?.ordersByStatus.out_for_delivery || 0}</Text>
          </View>
          <View style={styles.breakdownChip}>
            <Text style={styles.breakdownChipLabel}>Delivered</Text>
            <Text style={styles.breakdownChipValue}>{dashboard?.ordersByStatus.delivered || 0}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Recent Orders</Text>
      {dashboard?.recentOrders?.map((order) => (
        <OrderCard
          key={order._id}
          order={order}
          actionLabel="View"
          onActionPress={() => navigation.getParent()?.navigate('AdminManageTab')}
        />
      ))}
      {!loading && dashboard?.recentOrders?.length === 0 ? (
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownLine}>No orders have been placed yet.</Text>
        </View>
      ) : null}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    error: {
      color: theme.colors.danger,
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
    orgDescription: {
      color: theme.colors.textMuted,
      lineHeight: 21,
    },
    heroMetaRow: {
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
    heroActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
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
    grid: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    breakdownCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 8,
      padding: theme.spacing.md,
    },
    breakdownGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
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
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    breakdownChipValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 20,
      fontWeight: '700',
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    breakdownLine: {
      color: theme.colors.textMuted,
    },
  });

export default AdminDashboardScreen;
