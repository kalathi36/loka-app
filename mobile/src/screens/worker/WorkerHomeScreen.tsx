import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { StatCard } from '../../components/StatCard';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { ApiEnvelope, Order } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage } from '../../utils/formatters';

const WorkerHomeScreen = ({ navigation }: { navigation: any }) => {
  const { user, logout } = useAuth();
  const { theme } = useAppTheme();
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
    const unsubscribe = navigation.addListener('focus', () => {
      loadOrders();
    });

    return unsubscribe;
  }, [navigation]);

  const activeOrders = orders.filter((order) => order.status !== 'delivered').length;
  const deliveredToday = orders.filter((order) => order.status === 'delivered').length;

  return (
    <ScreenLayout
      title={`Shift Ready, ${user?.name?.split(' ')[0] || 'Worker'}`}
      subtitle={`Attendance, dispatch, delivery proof, and navigation for ${user?.organization?.name || 'your workspace'}.`}
      rightAction={<PrimaryButton label="Logout" variant="ghost" onPress={logout} />}
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.grid}>
        <StatCard label="Assigned" value={orders.length} />
        <StatCard label="Active" value={activeOrders} accent={theme.colors.accentSecondary} />
      </View>
      <View style={styles.grid}>
        <StatCard label="Delivered" value={deliveredToday} />
        <StatCard label="GPS Sync" value="15s" accent={theme.colors.warning} />
      </View>
      <View style={styles.actions}>
        <PrimaryButton label="Mark Attendance" onPress={() => navigation.navigate('Attendance')} />
        <PrimaryButton label="Assigned Orders" variant="ghost" onPress={() => navigation.navigate('AssignedOrders')} />
        <PrimaryButton label="Map Navigation" variant="outline" onPress={() => navigation.navigate('MapNavigation')} />
      </View>
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
    actions: {
      gap: 10,
    },
  });

export default WorkerHomeScreen;
