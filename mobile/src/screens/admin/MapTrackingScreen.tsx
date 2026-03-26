import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { EmptyState } from '../../components/EmptyState';
import { ScreenLayout } from '../../components/ScreenLayout';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { ApiEnvelope, WorkerLocation } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatDateTime } from '../../utils/formatters';

const fallbackRegion = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

const MapTrackingScreen = () => {
  const styles = useThemedStyles(createStyles);
  const [locations, setLocations] = useState<WorkerLocation[]>([]);
  const [error, setError] = useState('');

  const loadLocations = async () => {
    try {
      setError('');
      const response = await api.get<ApiEnvelope<WorkerLocation[]>>('/admin/worker-locations');
      setLocations(response.data.data);
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      return;
    }

    const onGpsUpdated = (payload: WorkerLocation) => {
      setLocations((currentLocations) => {
        const nextLocations = [...currentLocations];
        const index = nextLocations.findIndex((location) => location.workerId === payload.workerId);

        if (index === -1) {
          nextLocations.push(payload);
          return nextLocations;
        }

        nextLocations[index] = { ...nextLocations[index], ...payload };
        return nextLocations;
      });
    };

    socket.on('gps:updated', onGpsUpdated);

    return () => {
      socket.off('gps:updated', onGpsUpdated);
    };
  }, []);

  const initialRegion = locations.length
    ? {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }
    : fallbackRegion;

  return (
    <ScreenLayout title="Live Worker Map" subtitle="Every worker heartbeat appears here in real time.">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.mapShell}>
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={styles.map}
          initialRegion={initialRegion}
        >
          {locations.map((location) => (
            <Marker
              key={location.workerId}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={location.workerName}
              description={`Updated ${formatDateTime(location.timestamp)}`}
            />
          ))}
        </MapView>
      </View>
      {locations.length === 0 ? (
        <EmptyState title="No live workers yet" subtitle="Worker GPS heartbeats will appear once staff start their shift." />
      ) : (
        locations.map((location) => (
          <View key={location.workerId} style={styles.locationCard}>
            <Text style={styles.workerName}>{location.workerName}</Text>
            <Text style={styles.locationMeta}>
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </Text>
            <Text style={styles.locationMeta}>Updated {formatDateTime(location.timestamp)}</Text>
          </View>
        ))
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    error: {
      color: theme.colors.danger,
    },
    mapShell: {
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      overflow: 'hidden',
    },
    map: {
      height: 320,
      width: '100%',
    },
    locationCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 6,
      padding: theme.spacing.md,
    },
    workerName: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    locationMeta: {
      color: theme.colors.textMuted,
    },
  });

export default MapTrackingScreen;
