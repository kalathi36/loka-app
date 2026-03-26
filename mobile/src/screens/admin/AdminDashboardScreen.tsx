import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { Analytics, ApiEnvelope } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency } from '../../utils/formatters';
import { OrderCard } from '../../components/OrderCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { StatCard } from '../../components/StatCard';

const AdminDashboardScreen = ({ navigation }: { navigation: any }) => {
  const { user, logout } = useAuth();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    try {
      setError('');
      const response = await api.get<ApiEnvelope<Analytics>>('/admin/analytics');
      setAnalytics(response.data.data);
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    const unsubscribe = navigation.addListener('focus', () => {
      loadAnalytics();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <ScreenLayout
      title="Operations Overview"
      subtitle="Monitor revenue, dispatch performance, and fulfillment from one live dashboard."
      rightAction={<PrimaryButton label="Logout" variant="ghost" onPress={logout} />}
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.orgCard}>
        <Text style={styles.orgLabel}>Organization</Text>
        <Text style={styles.orgName}>{user?.organization?.name || 'Workspace'}</Text>
        <Text style={styles.orgMeta}>Share code: {user?.organization?.code || 'Pending'}</Text>
      </View>
      <View style={styles.grid}>
        <StatCard label="Orders" value={analytics?.totalOrders || 0} />
        <StatCard label="Products" value={analytics?.totalProducts || 0} accent={theme.colors.accentSecondary} />
      </View>
      <View style={styles.grid}>
        <StatCard label="Revenue" value={formatCurrency(analytics?.deliveredRevenue || 0)} />
        <StatCard label="Outstanding" value={formatCurrency(analytics?.outstandingPayments || 0)} accent={theme.colors.warning} />
      </View>
      <View style={styles.actions}>
        <PrimaryButton label="Orders" onPress={() => navigation.navigate('Orders')} />
        <PrimaryButton label="Assign Worker" variant="ghost" onPress={() => navigation.navigate('AssignWorker')} />
        <PrimaryButton label="Products" variant="outline" onPress={() => navigation.navigate('ProductManagement')} />
        <PrimaryButton label="Live Map" variant="outline" onPress={() => navigation.navigate('MapTracking')} />
        <PrimaryButton label="Support Chat" variant="ghost" onPress={() => navigation.navigate('AdminChat')} />
      </View>
      <View style={styles.breakdownCard}>
        <Text style={styles.sectionTitle}>Status Breakdown</Text>
        <Text style={styles.breakdownLine}>Pending: {analytics?.ordersByStatus.pending || 0}</Text>
        <Text style={styles.breakdownLine}>Approved: {analytics?.ordersByStatus.approved || 0}</Text>
        <Text style={styles.breakdownLine}>
          Out for delivery: {analytics?.ordersByStatus.out_for_delivery || 0}
        </Text>
        <Text style={styles.breakdownLine}>Delivered: {analytics?.ordersByStatus.delivered || 0}</Text>
      </View>
      <Text style={styles.sectionTitle}>Recent Orders</Text>
      {analytics?.recentOrders?.map((order) => (
        <OrderCard
          key={order._id}
          order={order}
          actionLabel="View"
          onActionPress={() => navigation.navigate('Orders')}
        />
      ))}
      {!loading && analytics?.recentOrders?.length === 0 ? (
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
      gap: 6,
      padding: theme.spacing.md,
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
      fontSize: 22,
      fontWeight: '700',
    },
    orgMeta: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    grid: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    actions: {
      gap: 10,
    },
    breakdownCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 8,
      padding: theme.spacing.md,
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
