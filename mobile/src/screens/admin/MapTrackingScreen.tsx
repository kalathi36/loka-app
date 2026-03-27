import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { MapPanel } from '../../components/MapPanel';
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  const latestHeartbeat = locations.reduce((latest, location) => {
    if (!latest) {
      return location.timestamp;
    }

    return new Date(location.timestamp).getTime() > new Date(latest).getTime()
      ? location.timestamp
      : latest;
  }, '');

  return (
    <ScreenLayout title="Live Worker Map" subtitle="Every worker heartbeat appears here in real time.">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Operations snapshot</Text>
        <Text style={styles.summaryMeta}>Active workers in field: {locations.length}</Text>
        <Text style={styles.summaryMeta}>
          Latest heartbeat: {latestHeartbeat ? formatDateTime(latestHeartbeat) : 'Awaiting GPS activity'}
        </Text>
        <PrimaryButton
          label="Refresh live feed"
          loading={isRefreshing}
          onPress={async () => {
            setIsRefreshing(true);
            await loadLocations();
            setIsRefreshing(false);
          }}
          variant="ghost"
        />
      </Card>
      <MapPanel
        fallbackDescription="Open any worker card below to launch the exact position in your device maps."
        fallbackTitle="Live tiles are temporarily unavailable."
        initialRegion={initialRegion}
        points={locations.map((location) => ({
          latitude: location.latitude,
          longitude: location.longitude,
        }))}
        statusLabel={locations.length ? `${locations.length} live` : 'Awaiting GPS'}
        statusTone={locations.length ? 'accent' : 'muted'}
        subtitle={
          locations.length
            ? 'Worker pins auto-fit on the map as fresh GPS heartbeats arrive.'
            : 'Workers will appear here as soon as the field team starts sharing location.'
        }
        title="Field activity"
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
      </MapPanel>
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
    summaryCard: {
      gap: 8,
    },
    summaryTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    summaryMeta: {
      color: theme.colors.textMuted,
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
