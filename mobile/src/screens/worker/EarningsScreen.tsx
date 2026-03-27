import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { ScreenLayout } from '../../components/ScreenLayout';
import { StatCard } from '../../components/StatCard';
import api, { getApiErrorStatus } from '../../services/api';
import { ApiEnvelope, WorkerEarnings } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency, formatDate, formatTime } from '../../utils/formatters';

const EarningsScreen = () => {
  const styles = useThemedStyles(createStyles);
  const [earnings, setEarnings] = useState<WorkerEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEarnings = useCallback(async () => {
    try {
      setError('');
      const response = await api.get<ApiEnvelope<WorkerEarnings>>('/workers/earnings');
      setEarnings(response.data.data);
    } catch (loadError) {
      if (getApiErrorStatus(loadError) === 404) {
        setEarnings({
          totalDaysWorked: 0,
          totalEarnings: 0,
          totalPaid: 0,
          outstandingBalance: 0,
          dailyEarnings: [],
        });
        setError('The earnings endpoint is not available on the current backend build. Redeploy the backend to unlock it.');
      } else {
        setError(extractErrorMessage(loadError));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  if (loading) {
    return <LoadingOverlay label="Loading earnings" />;
  }

  return (
    <ScreenLayout>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.sectionTitle}>Summary</Text>
      <Card style={styles.statsCard}>
        <StatCard
          label="Days Worked"
          value={earnings?.totalDaysWorked || 0}
          iconName="calendar-outline"
          helper="Shift days logged"
        />
        <StatCard
          label="Total"
          value={formatCurrency(earnings?.totalEarnings || 0)}
          iconName="cash-outline"
          helper="Gross wages earned"
        />
        <StatCard
          label="Paid"
          value={formatCurrency(earnings?.totalPaid || 0)}
          iconName="checkmark-circle-outline"
          helper="Payments already settled"
          accent="#19A463"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(earnings?.outstandingBalance || 0)}
          iconName="alert-circle-outline"
          helper="Still to be paid"
          accent="#C88A00"
        />
      </Card>

      <Text style={styles.sectionTitle}>Daily Earnings</Text>
      {earnings?.dailyEarnings.length ? (
        earnings.dailyEarnings.map((entry) => (
          <Card key={entry._id} style={styles.entryCard}>
            <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
            <Text style={styles.entryMeta}>
              In {formatTime(entry.checkInTime)} • Out {formatTime(entry.checkOutTime)}
            </Text>
            <Text style={styles.entryAmount}>{formatCurrency(entry.dailyWage || 0)}</Text>
          </Card>
        ))
      ) : (
        <EmptyState title="No earnings yet" subtitle="Check-ins with saved daily wages will appear here." />
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    error: {
      color: theme.colors.danger,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    statsCard: {
      gap: theme.spacing.md,
    },
    entryCard: {
      gap: 6,
    },
    entryDate: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    entryMeta: {
      color: theme.colors.textMuted,
    },
    entryAmount: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
    },
  });

export default EarningsScreen;
