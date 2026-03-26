import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { TextField } from '../../components/TextField';
import api from '../../services/api';
import { showToast } from '../../services/toast';
import { ApiEnvelope, PaymentDashboard } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency, formatDate, getEntityId } from '../../utils/formatters';

const PaymentsScreen = () => {
  const styles = useThemedStyles(createStyles);
  const [dashboard, setDashboard] = useState<PaymentDashboard | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedSummary = useMemo(
    () =>
      dashboard?.workerSummaries.find(
        (item) => getEntityId(item.worker) === selectedWorkerId,
      ) || null,
    [dashboard?.workerSummaries, selectedWorkerId],
  );

  const loadPayments = useCallback(async () => {
    try {
      setError('');
      const response = await api.get<ApiEnvelope<PaymentDashboard>>('/admin/payments');
      setDashboard(response.data.data);

      if (!selectedWorkerId && response.data.data.workerSummaries[0]) {
        setSelectedWorkerId(getEntityId(response.data.data.workerSummaries[0].worker));
      }
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [selectedWorkerId]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const submitPayment = async () => {
    if (!selectedWorkerId || !amountPaid) {
      setError('Select a worker and enter an amount.');
      return;
    }

    setSaving(true);

    try {
      setError('');
      await api.post('/admin/payments', {
        workerId: selectedWorkerId,
        amountPaid: Number(amountPaid),
        notes,
      });
      showToast({
        type: 'success',
        title: 'Payment recorded',
        message: 'Worker payout added successfully.',
      });
      setAmountPaid('');
      setNotes('');
      await loadPayments();
    } catch (saveError) {
      setError(extractErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingOverlay label="Loading payments" />;
  }

  return (
    <ScreenLayout title="Payments" subtitle="Track wages earned, amounts paid, and outstanding worker balances.">
      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total salary paid</Text>
        <Text style={styles.totalValue}>{formatCurrency(dashboard?.totals.totalPaid || 0)}</Text>
        <Text style={styles.totalMeta}>
          Outstanding: {formatCurrency(dashboard?.totals.outstandingBalance || 0)}
        </Text>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.workerRow}>
          {dashboard?.workerSummaries.map((summary) => (
            <PrimaryButton
              key={getEntityId(summary.worker)}
              label={summary.worker.name}
              variant={getEntityId(summary.worker) === selectedWorkerId ? 'solid' : 'outline'}
              onPress={() => setSelectedWorkerId(getEntityId(summary.worker))}
            />
          ))}
        </View>
      </ScrollView>

      {selectedSummary ? (
        <Card style={styles.formCard}>
          <Text style={styles.workerName}>{selectedSummary.worker.name}</Text>
          <Text style={styles.workerMeta}>
            Due: {formatCurrency(selectedSummary.outstandingBalance)} • Paid: {formatCurrency(selectedSummary.totalPaid)}
          </Text>
          <TextField
            label="Amount Paid"
            value={amountPaid}
            keyboardType="numeric"
            onChangeText={setAmountPaid}
            placeholder="Enter amount"
          />
          <TextField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
          />
          <PrimaryButton label="Record Payment" onPress={submitPayment} loading={saving} />
        </Card>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {dashboard?.workerSummaries.length ? (
        dashboard.workerSummaries.map((summary) => (
          <Card key={getEntityId(summary.worker)} style={styles.summaryCard}>
            <Text style={styles.workerName}>{summary.worker.name}</Text>
            <Text style={styles.workerMeta}>
              Days worked: {summary.totalDaysWorked} • Wages: {formatCurrency(summary.totalWages)}
            </Text>
            <Text style={styles.workerMeta}>
              Paid: {formatCurrency(summary.totalPaid)} • Outstanding: {formatCurrency(summary.outstandingBalance)}
            </Text>
          </Card>
        ))
      ) : (
        <EmptyState title="No payment records" subtitle="Worker payroll entries will appear here." />
      )}

      {dashboard?.paymentHistory.length ? (
        dashboard.paymentHistory.map((payment) => (
          <Card key={payment._id} style={styles.historyCard}>
            <Text style={styles.workerName}>
              {typeof payment.workerId === 'string' ? payment.workerId : payment.workerId.name}
            </Text>
            <Text style={styles.workerMeta}>{formatDate(payment.date)}</Text>
            <Text style={styles.amount}>{formatCurrency(payment.amountPaid)}</Text>
            {payment.notes ? <Text style={styles.workerMeta}>{payment.notes}</Text> : null}
          </Card>
        ))
      ) : null}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    totalCard: {
      gap: 6,
    },
    totalLabel: {
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    totalValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 28,
      fontWeight: '700',
    },
    totalMeta: {
      color: theme.colors.textMuted,
    },
    workerRow: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 2,
    },
    formCard: {
      gap: theme.spacing.sm,
    },
    summaryCard: {
      gap: 6,
    },
    historyCard: {
      gap: 4,
    },
    workerName: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    workerMeta: {
      color: theme.colors.textMuted,
    },
    amount: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
    },
    error: {
      color: theme.colors.danger,
    },
  });

export default PaymentsScreen;
