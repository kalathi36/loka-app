import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import api from '../../services/api';
import { getLocationDetails, LocationDetails, openInExternalMap } from '../../services/location';
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
  const [locationDetails, setLocationDetails] = useState<Record<string, LocationDetails>>({});
  const [error, setError] = useState('');

  const hydrateLocationDetails = useCallback(async (entries: WorkerLocation[]) => {
    const resolvedEntries = await Promise.all(
      entries.map(async (entry) => [
        entry.workerId,
        await getLocationDetails(entry, entry.workerName || 'Worker location'),
      ] as const),
    );

    setLocationDetails((current) => {
      const next = { ...current };

      resolvedEntries.forEach(([workerId, details]) => {
        next[workerId] = details;
      });

      return next;
    });
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      setError('');
      const response = await api.get<ApiEnvelope<WorkerLocation[]>>('/admin/worker-locations');
      setLocations(response.data.data);
      hydrateLocationDetails(response.data.data).catch(() => null);
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    }
  }, [hydrateLocationDetails]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

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

      getLocationDetails(payload, payload.workerName || 'Worker location')
        .then((details) => {
          setLocationDetails((current) => ({
            ...current,
            [payload.workerId]: details,
          }));
        })
        .catch(() => null);
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
      {Platform.OS === 'android' && __DEV__ ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Android map tiles</Text>
          <Text style={styles.noticeText}>
            If the live map is blank, rebuild Android with a valid `MAPS_API_KEY`. Worker pins
            can still be opened externally from the list below.
          </Text>
        </View>
      ) : null}
      <View style={styles.mapShell}>
        <MapView
          liteMode={Platform.OS === 'android'}
          loadingEnabled
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
            <Text style={styles.locationTitle}>
              {locationDetails[location.workerId]?.title || 'Resolving worker location...'}
            </Text>
            <Text style={styles.locationMeta}>
              {locationDetails[location.workerId]?.subtitle || 'Live route update received.'}
            </Text>
            <Text style={styles.locationMeta}>
              {locationDetails[location.workerId]?.coordinates || ''}
            </Text>
            <Text style={styles.locationMeta}>Updated {formatDateTime(location.timestamp)}</Text>
            <PrimaryButton
              label="Open in Maps"
              variant="outline"
              onPress={() => openInExternalMap(location, location.workerName)}
            />
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
    noticeCard: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 6,
      padding: theme.spacing.md,
    },
    noticeTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 15,
      fontWeight: '700',
    },
    noticeText: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    workerName: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    locationTitle: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    locationMeta: {
      color: theme.colors.textMuted,
    },
  });

export default MapTrackingScreen;
