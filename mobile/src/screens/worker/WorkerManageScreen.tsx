import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ActionTile } from '../../components/ActionTile';
import { Card } from '../../components/Card';
import { ScreenLayout } from '../../components/ScreenLayout';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';

const WorkerManageScreen = ({ navigation }: { navigation: any }) => {
  const styles = useThemedStyles(createStyles);

  return (
    <ScreenLayout title="Manage Shift" subtitle="Open your active orders, attendance tools, and earnings summary.">
      <Card style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Field tools</Text>
        <Text style={styles.heroTitle}>Everything for today’s delivery run.</Text>
        <Text style={styles.heroMeta}>Attendance first, orders second, earnings always visible.</Text>
      </Card>
      <ActionTile
        title="Assigned Orders"
        subtitle="Review deliveries assigned to you right now."
        iconName="trail-sign-outline"
        onPress={() => navigation.navigate('AssignedOrders')}
      />
      <ActionTile
        title="Attendance"
        subtitle="Check in or check out your shift and confirm your GPS pin."
        iconName="time-outline"
        accentColor="#C88A00"
        onPress={() => navigation.navigate('Attendance')}
      />
      <ActionTile
        title="Earnings"
        subtitle="See daily wages, total days worked, and outstanding pay."
        iconName="wallet-outline"
        accentColor="#19A463"
        onPress={() => navigation.navigate('Earnings')}
      />
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    heroCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 8,
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
    heroMeta: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
  });

export default WorkerManageScreen;
