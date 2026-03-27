import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { DateRangeFilterCard } from '../../components/DateRangeFilterCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { TextField } from '../../components/TextField';
import api from '../../services/api';
import { showToast } from '../../services/toast';
import { ApiEnvelope, AttendanceRecord } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency, formatDate, formatTime, getEntityName } from '../../utils/formatters';

interface AttendanceResponse {
  records: AttendanceRecord[];
  totalCost: number;
}

const AttendanceManagementScreen = () => {
  const styles = useThemedStyles(createStyles);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [draftWage, setDraftWage] = useState('');
  const [fromDateInput, setFromDateInput] = useState('');
  const [toDateInput, setToDateInput] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedRecord = useMemo(
    () => records.find((record) => record._id === selectedId) || null,
    [records, selectedId],
  );

  const loadAttendance = useCallback(async () => {
    try {
      setError('');
      const response = await api.get<ApiEnvelope<AttendanceResponse>>('/attendance', {
        params: {
          from: appliedFromDate || undefined,
          to: appliedToDate || undefined,
        },
      });
      setRecords(response.data.data.records);
      setTotalCost(response.data.data.totalCost);

      setSelectedId((currentSelectedId) => {
        if (
          currentSelectedId &&
          response.data.data.records.some((record) => record._id === currentSelectedId)
        ) {
          return currentSelectedId;
        }

        return response.data.data.records[0]?._id || '';
      });
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [appliedFromDate, appliedToDate]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    if (selectedRecord) {
      setDraftWage(String(selectedRecord.dailyWage || 0));
    }
  }, [selectedRecord]);

  const saveWage = async () => {
    if (!selectedRecord) {
      return;
    }

    const parsedWage = Number(draftWage);

    if (!Number.isFinite(parsedWage) || parsedWage < 0) {
      showToast({
        type: 'error',
        title: 'Invalid wage',
        message: 'Enter a valid wage amount greater than or equal to zero.',
      });
      return;
    }

    setSaving(true);

    try {
      await api.put<ApiEnvelope<AttendanceRecord>>(`/attendance/${selectedRecord._id}`, {
        dailyWage: parsedWage,
      });
      showToast({
        type: 'success',
        title: 'Attendance updated',
        message: 'Daily wage saved successfully.',
      });
      await loadAttendance();
    } catch (saveError) {
      setError(extractErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const applyDateFilter = () => {
    setSelectedId('');
    setAppliedFromDate(fromDateInput.trim());
    setAppliedToDate(toDateInput.trim());
  };

  const clearDateFilter = () => {
    setSelectedId('');
    setFromDateInput('');
    setToDateInput('');
    setAppliedFromDate('');
    setAppliedToDate('');
  };

  if (loading) {
    return <LoadingOverlay label="Loading attendance" />;
  }

  return (
    <ScreenLayout title="Attendance" subtitle="Review attendance records and set daily wages for payroll tracking.">
      <DateRangeFilterCard
        fromDate={fromDateInput}
        loading={loading}
        onApply={applyDateFilter}
        onChangeFromDate={setFromDateInput}
        onChangeToDate={setToDateInput}
        onClear={clearDateFilter}
        toDate={toDateInput}
      />

      <Card style={styles.summary}>
        <Text style={styles.summaryLabel}>Filtered worker cost</Text>
        <Text style={styles.summaryValue}>{formatCurrency(totalCost)}</Text>
        <Text style={styles.summaryHint}>
          {records.length} shift {records.length === 1 ? 'record' : 'records'} in the selected range
        </Text>
      </Card>

      {selectedRecord ? (
        <Card style={styles.editorCard}>
          <Text style={styles.editorTitle}>Payroll Editor</Text>
          <Text style={styles.editorMeta}>
            {getEntityName(selectedRecord.workerId)} • {formatDate(selectedRecord.date)}
          </Text>
          <Text style={styles.editorHint}>
            This updates wage only for the selected shift. Check-in/out timing stays unchanged.
          </Text>
          <View style={styles.editorSnapshot}>
            <View style={styles.editorMetric}>
              <Text style={styles.editorMetricLabel}>Shift Hours</Text>
              <Text style={styles.editorMetricValue}>
                In {formatTime(selectedRecord.checkInTime)} • Out {formatTime(selectedRecord.checkOutTime)}
              </Text>
            </View>
            <View style={styles.editorMetric}>
              <Text style={styles.editorMetricLabel}>Current Wage</Text>
              <Text style={styles.editorMetricValue}>
                {formatCurrency(selectedRecord.dailyWage || 0)}
              </Text>
            </View>
          </View>
          <TextField
            hint="Enter the amount earned for this one shift."
            label="Wage For Selected Shift"
            value={draftWage}
            keyboardType="numeric"
            onChangeText={setDraftWage}
            placeholder="Enter wage amount"
          />
          <PrimaryButton
            label={`Save Wage For ${getEntityName(selectedRecord.workerId).split(' ')[0]}`}
            onPress={saveWage}
            loading={saving}
          />
        </Card>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {records.length === 0 ? (
        <EmptyState title="No attendance records" subtitle="Worker check-ins and check-outs will appear here." />
      ) : (
        records.map((record) => (
          <Pressable key={record._id} onPress={() => setSelectedId(record._id)}>
            <Card style={[styles.recordCard, record._id === selectedId ? styles.recordCardActive : null]}>
              <View style={styles.row}>
                <View style={styles.copy}>
                  <Text style={styles.name}>{getEntityName(record.workerId)}</Text>
                  <Text style={styles.meta}>{formatDate(record.date)}</Text>
                  <Text style={styles.meta}>
                    In {formatTime(record.checkInTime)} • Out {formatTime(record.checkOutTime)}
                  </Text>
                </View>
                <PrimaryButton
                  label={record._id === selectedId ? 'Editing' : 'Edit Wage'}
                  variant={record._id === selectedId ? 'solid' : 'outline'}
                  onPress={() => setSelectedId(record._id)}
                />
              </View>
              <Text style={styles.wage}>Daily wage: {formatCurrency(record.dailyWage || 0)}</Text>
            </Card>
          </Pressable>
        ))
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    summary: {
      gap: 6,
    },
    summaryLabel: {
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    summaryValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 28,
      fontWeight: '700',
    },
    summaryHint: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    editorCard: {
      gap: theme.spacing.sm,
    },
    editorHint: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    editorSnapshot: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.sm,
      gap: theme.spacing.sm,
      padding: theme.spacing.sm,
    },
    editorMetric: {
      gap: 4,
    },
    editorMetricLabel: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    editorMetricValue: {
      color: theme.colors.text,
      fontWeight: '600',
    },
    editorTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    editorMeta: {
      color: theme.colors.textMuted,
    },
    error: {
      color: theme.colors.danger,
    },
    recordCard: {
      gap: 8,
    },
    recordCardActive: {
      borderColor: theme.colors.accent,
      borderWidth: 2,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.md,
      justifyContent: 'space-between',
    },
    copy: {
      flex: 1,
      gap: 4,
    },
    name: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    meta: {
      color: theme.colors.textMuted,
    },
    wage: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 14,
      fontWeight: '700',
    },
  });

export default AttendanceManagementScreen;
