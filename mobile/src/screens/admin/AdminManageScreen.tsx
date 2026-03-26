import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionTile } from '../../components/ActionTile';
import { Card } from '../../components/Card';
import { ScreenLayout } from '../../components/ScreenLayout';
import { useAuth } from '../../store/AuthContext';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';

const AdminManageScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);

  return (
    <ScreenLayout
      title="Manage Operations"
      subtitle="Dispatch, people, attendance, payroll, and customer communication all live here."
    >
      <Card style={styles.hero}>
        <Text style={styles.heroEyebrow}>Operations deck</Text>
        <Text style={styles.heroTitle}>{user?.organization?.name || 'Loka Workspace'}</Text>
        <Text style={styles.heroDescription}>
          Choose a workstream below to keep orders, staff, customers, and support moving from one place.
        </Text>
        <Text style={styles.heroMeta}>Org code: {user?.organization?.code || 'Pending'}</Text>
      </Card>

      <View style={styles.grid}>
        <ActionTile
          title="Orders"
          subtitle="Review, assign, and track all organization orders."
          iconName="receipt-outline"
          onPress={() => navigation.navigate('Orders')}
        />
        <ActionTile
          title="Workers"
          subtitle="View workers and monitor staffing across the org."
          iconName="people-outline"
          accentColor="#19A463"
          onPress={() => navigation.navigate('WorkerManagement')}
        />
        <ActionTile
          title="Attendance"
          subtitle="Audit check-ins, check-outs, and update daily wages."
          iconName="time-outline"
          accentColor="#C88A00"
          onPress={() => navigation.navigate('AttendanceManagement')}
        />
        <ActionTile
          title="Payments"
          subtitle="Record salary payouts and review payroll totals."
          iconName="cash-outline"
          accentColor="#7CFF6B"
          onPress={() => navigation.navigate('Payments')}
        />
        <ActionTile
          title="Customers"
          subtitle="See all customers linked to this organization."
          iconName="people-circle-outline"
          onPress={() => navigation.navigate('CustomerList')}
        />
        <ActionTile
          title="Support Chat"
          subtitle="Handle incoming customer questions in one place."
          iconName="chatbubbles-outline"
          onPress={() => navigation.navigate('AdminChat')}
        />
        <ActionTile
          title="Products"
          subtitle="Manage storefront stock and categories."
          iconName="cube-outline"
          onPress={() => navigation.navigate('ProductManagement')}
        />
        <ActionTile
          title="Live Tracking"
          subtitle="Monitor the latest GPS updates from workers."
          iconName="navigate-outline"
          onPress={() => navigation.navigate('MapTracking')}
        />
      </View>
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    hero: {
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
    },
    heroDescription: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    heroMeta: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    grid: {
      gap: theme.spacing.sm,
    },
  });

export default AdminManageScreen;
