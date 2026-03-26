import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
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
  const [saving, setSaving] = useState(false);

  const selectedRecord = useMemo(
    () => records.find((record) => record._id === selectedId) || null,
    [records, selectedId],
  );

  const loadAttendance = useCallback(async () => {
    try {
      setError('');
      const response = await api.get<ApiEnvelope<AttendanceResponse>>('/attendance');
      setRecords(response.data.data.records);
      setTotalCost(response.data.data.totalCost);

      if (!selectedId && response.data.data.records[0]) {
        setSelectedId(response.data.data.records[0]._id);
        setDraftWage(String(response.data.data.records[0].dailyWage || 0));
      }
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

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

    setSaving(true);

    try {
      await api.put<ApiEnvelope<AttendanceRecord>>(`/attendance/${selectedRecord._id}`, {
        dailyWage: Number(draftWage),
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

  if (loading) {
    return <LoadingOverlay label="Loading attendance" />;
  }

  return (
    <ScreenLayout title="Attendance" subtitle="Review attendance records and set daily wages for payroll tracking.">
      <Card style={styles.summary}>
        <Text style={styles.summaryLabel}>Total worker cost</Text>
        <Text style={styles.summaryValue}>{formatCurrency(totalCost)}</Text>
      </Card>

      {selectedRecord ? (
        <Card style={styles.editorCard}>
          <Text style={styles.editorTitle}>Edit Daily Wage</Text>
          <Text style={styles.editorMeta}>
            {getEntityName(selectedRecord.workerId)} • {formatDate(selectedRecord.date)}
          </Text>
          <TextField
            label="Daily Wage"
            value={draftWage}
            keyboardType="numeric"
            onChangeText={setDraftWage}
            placeholder="Enter wage amount"
          />
          <PrimaryButton label="Save Wage" onPress={saveWage} loading={saving} />
        </Card>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {records.length === 0 ? (
        <EmptyState title="No attendance records" subtitle="Worker check-ins and check-outs will appear here." />
      ) : (
        records.map((record) => (
          <Card key={record._id} style={styles.recordCard}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text style={styles.name}>{getEntityName(record.workerId)}</Text>
                <Text style={styles.meta}>{formatDate(record.date)}</Text>
                <Text style={styles.meta}>
                  In {formatTime(record.checkInTime)} • Out {formatTime(record.checkOutTime)}
                </Text>
              </View>
              <PrimaryButton
                label="Edit"
                variant={record._id === selectedId ? 'solid' : 'outline'}
                onPress={() => setSelectedId(record._id)}
              />
            </View>
            <Text style={styles.wage}>Daily wage: {formatCurrency(record.dailyWage || 0)}</Text>
          </Card>
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
    editorCard: {
      gap: theme.spacing.sm,
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
