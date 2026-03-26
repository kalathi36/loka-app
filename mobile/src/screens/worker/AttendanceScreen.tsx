import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import api from '../../services/api';
import { getCurrentLocation, requestLocationPermission } from '../../services/location';
import { LocationPoint } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage } from '../../utils/formatters';

const AttendanceScreen = () => {
  const styles = useThemedStyles(createStyles);
  const [location, setLocation] = useState<LocationPoint | null>(null);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadLocation = async () => {
    try {
      setError('');
      const granted = await requestLocationPermission();

      if (!granted) {
        setError('Location permission is required to mark attendance.');
        return;
      }

      const nextLocation = await getCurrentLocation();
      setLocation(nextLocation);
    } catch (locationError) {
      setError(extractErrorMessage(locationError));
    }
  };

  useEffect(() => {
    loadLocation();
  }, []);

  const markAttendance = async () => {
    if (!location) {
      setError('Fetch your location before checking in.');
      return;
    }

    setSubmitting(true);

    try {
      setError('');
      await api.post('/workers/attendance', location);
      setStatusText('Attendance captured successfully.');
    } catch (attendanceError) {
      setError(extractErrorMessage(attendanceError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout title="Attendance" subtitle="Check in from the field with a verified GPS pin.">
      {location ? (
        <View style={styles.locationCard}>
          <Text style={styles.label}>Current Coordinates</Text>
          <Text style={styles.value}>
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </Text>
        </View>
      ) : (
        <EmptyState title="Location not ready" subtitle="Use refresh to request location access and fetch your coordinates." />
      )}
      {statusText ? <Text style={styles.success}>{statusText}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Refresh Location" variant="outline" onPress={loadLocation} />
      <PrimaryButton label="Mark Attendance" onPress={markAttendance} loading={submitting} />
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
    success: {
      color: theme.colors.success,
    },
    error: {
      color: theme.colors.danger,
    },
  });

export default AttendanceScreen;
