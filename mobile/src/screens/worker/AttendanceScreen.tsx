import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DateRangeFilterCard } from '../../components/DateRangeFilterCard';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import api, { getApiErrorStatus } from '../../services/api';
import {
  getCurrentLocation,
  getLocationDetails,
  LocationDetails,
  requestLocationPermission,
} from '../../services/location';
import { showToast } from '../../services/toast';
import { useAuth } from '../../store/AuthContext';
import { ApiEnvelope, LocationPoint } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import {
  extractErrorMessage,
  formatDate,
  formatTime,
  toDateInputValue,
} from '../../utils/formatters';

interface AttendanceWorkerResponse {
  records: Array<{
    _id: string;
    date: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    dailyWage: number;
  }>;
}

const AttendanceScreen = () => {
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);
  const [location, setLocation] = useState<LocationPoint | null>(null);
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceWorkerResponse['records'][number] | null>(null);
  const [history, setHistory] = useState<AttendanceWorkerResponse['records']>([]);
  const [error, setError] = useState('');
  const [fromDateInput, setFromDateInput] = useState('');
  const [toDateInput, setToDateInput] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadLocation = useCallback(async () => {
    try {
      setError('');
      const granted = await requestLocationPermission();

      if (!granted) {
        setError('Location permission is required to mark attendance.');
        return;
      }

      const nextLocation = await getCurrentLocation();
      setLocation(nextLocation);
      const details = await getLocationDetails(nextLocation, 'Current site');
      setLocationDetails(details);
    } catch (locationError) {
      setError(extractErrorMessage(locationError));
    }
  }, []);

  const loadTodayRecord = useCallback(async () => {
    try {
      const response = await api.get<ApiEnvelope<AttendanceWorkerResponse>>(
        `/attendance/worker/${user?._id}`,
        {
          params: {
            from: toDateInputValue(new Date()),
            to: toDateInputValue(new Date()),
          },
        },
      );
      setTodayRecord(response.data.data.records[0] || null);
    } catch (attendanceError) {
      if (getApiErrorStatus(attendanceError) === 404) {
        setTodayRecord(null);
        setError('Attendance history is unavailable until the latest backend is deployed.');
        return;
      }

      setError(extractErrorMessage(attendanceError));
    }
  }, [user?._id]);

  const loadAttendanceHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setError('');
      const response = await api.get<ApiEnvelope<AttendanceWorkerResponse>>(
        `/attendance/worker/${user?._id}`,
        {
          params: {
            from: appliedFromDate || undefined,
            to: appliedToDate || undefined,
          },
        },
      );
      setHistory(response.data.data.records);
    } catch (attendanceError) {
      if (getApiErrorStatus(attendanceError) === 404) {
        setHistory([]);
        setError('Attendance history is unavailable until the latest backend is deployed.');
        return;
      }

      setError(extractErrorMessage(attendanceError));
    } finally {
      setLoadingHistory(false);
    }
  }, [appliedFromDate, appliedToDate, user?._id]);

  useEffect(() => {
    loadLocation();
    loadTodayRecord();
    loadAttendanceHistory();
  }, [loadAttendanceHistory, loadLocation, loadTodayRecord]);

  const handleAttendance = async (type: 'checkin' | 'checkout') => {
    if (!location) {
      setError('Fetch your location before checking in.');
      return;
    }

    setSubmitting(true);

    try {
      setError('');
      await api.post(`/attendance/${type}`, location);
      showToast({
        type: 'success',
        title: type === 'checkin' ? 'Checked in' : 'Checked out',
        message: 'Attendance was recorded successfully.',
      });
      await Promise.all([loadTodayRecord(), loadAttendanceHistory()]);
    } catch (attendanceError) {
      if (type === 'checkin' && getApiErrorStatus(attendanceError) === 404) {
        await api.post('/workers/attendance', location);
        showToast({
          type: 'success',
          title: 'Checked in',
          message: 'Attendance was recorded using the legacy worker endpoint.',
        });
        await Promise.all([loadTodayRecord(), loadAttendanceHistory()]);
        return;
      }

      setError(extractErrorMessage(attendanceError));
    } finally {
      setSubmitting(false);
    }
  };

  const applyDateFilter = () => {
    setAppliedFromDate(fromDateInput.trim());
    setAppliedToDate(toDateInput.trim());
  };

  const clearDateFilter = () => {
    setFromDateInput('');
    setToDateInput('');
    setAppliedFromDate('');
    setAppliedToDate('');
  };

  return (
    <ScreenLayout>
      {todayRecord ? (
        <View style={styles.statusCard}>
          <Text style={styles.label}>Today</Text>
          <Text style={styles.value}>{formatDate(todayRecord.date)}</Text>
          <Text style={styles.statusText}>
            In {formatTime(todayRecord.checkInTime)} • Out {formatTime(todayRecord.checkOutTime)}
          </Text>
        </View>
      ) : null}
      {location ? (
        <View style={styles.locationCard}>
          <Text style={styles.label}>Current location</Text>
          <Text style={styles.value}>{locationDetails?.title || 'Fetching place details...'}</Text>
          <Text style={styles.statusText}>
            {locationDetails?.subtitle || 'Live coordinates captured for attendance.'}
          </Text>
          <Text style={styles.locationMeta}>{locationDetails?.coordinates || ''}</Text>
        </View>
      ) : (
        <EmptyState title="Location not ready" subtitle="Use refresh to request location access and fetch your live site." />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Refresh Location" variant="outline" onPress={loadLocation} />
      <PrimaryButton
        label={todayRecord?.checkInTime ? 'Already Checked In' : 'Check In'}
        onPress={() => handleAttendance('checkin')}
        loading={submitting}
        disabled={Boolean(todayRecord?.checkInTime)}
      />
      <PrimaryButton
        label={todayRecord?.checkOutTime ? 'Already Checked Out' : 'Check Out'}
        variant="ghost"
        onPress={() => handleAttendance('checkout')}
        loading={submitting}
        disabled={!todayRecord?.checkInTime || Boolean(todayRecord?.checkOutTime)}
      />

      <DateRangeFilterCard
        fromDate={fromDateInput}
        loading={loadingHistory}
        onApply={applyDateFilter}
        onChangeFromDate={setFromDateInput}
        onChangeToDate={setToDateInput}
        onClear={clearDateFilter}
        toDate={toDateInput}
      />

      <View style={styles.historyHeader}>
        <Text style={styles.historySectionTitle}>Attendance History</Text>
        <Text style={styles.historySummary}>
          {history.length} shift {history.length === 1 ? 'record' : 'records'} in range
        </Text>
      </View>
      {history.length ? (
        history.map((record) => (
          <View key={record._id} style={styles.historyCard}>
            <Text style={styles.historyTitle}>{formatDate(record.date)}</Text>
            <Text style={styles.historyMeta}>
              In {formatTime(record.checkInTime)} • Out {formatTime(record.checkOutTime)}
            </Text>
          </View>
        ))
      ) : (
        <EmptyState
          title="No history for this range"
          subtitle="Try a wider date range to see more attendance records."
        />
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    statusCard: {
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 8,
      padding: theme.spacing.md,
    },
    locationCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 8,
      padding: theme.spacing.md,
    },
    label: {
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    value: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 20,
      fontWeight: '700',
    },
    statusText: {
      color: theme.colors.textMuted,
    },
    locationMeta: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    error: {
      color: theme.colors.danger,
    },
    historyCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 4,
      padding: theme.spacing.md,
    },
    historyTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontWeight: '700',
    },
    historyMeta: {
      color: theme.colors.textMuted,
    },
    historyHeader: {
      gap: 4,
    },
    historySectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    historySummary: {
      color: theme.colors.textMuted,
    },
  });

export default AttendanceScreen;
