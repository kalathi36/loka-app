import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { MapPanel } from '../../components/MapPanel';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import {
  getCurrentLocation,
  getLocationDetails,
  LocationDetails,
  openInExternalMap,
  requestLocationPermission,
} from '../../services/location';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../store/AuthContext';
import { LocationPoint, Order } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage } from '../../utils/formatters';

const fallbackRegion = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const MapNavigationScreen = ({ route }: { route: any }) => {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const order: Order | undefined = route.params?.order;
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [currentLocationDetails, setCurrentLocationDetails] = useState<LocationDetails | null>(null);
  const [destinationDetails, setDestinationDetails] = useState<LocationDetails | null>(null);
  const [error, setError] = useState('');
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

  const loadCurrentLocation = async () => {
    setIsRefreshingLocation(true);

    try {
      setError('');
      const granted = await requestLocationPermission();

      if (!granted) {
        setError('Location permission is required for map navigation.');
        return;
      }

      const nextLocation = await getCurrentLocation();
      setCurrentLocation(nextLocation);
      const details = await getLocationDetails(nextLocation, 'Your live route');
      setCurrentLocationDetails(details);
    } catch (locationError) {
      setError(extractErrorMessage(locationError));
    } finally {
      setIsRefreshingLocation(false);
    }
  };

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      return;
    }

    const onGpsUpdated = (payload: any) => {
      if (payload.workerId === user?._id) {
        const nextLocation = {
          latitude: payload.latitude,
          longitude: payload.longitude,
        };
        setCurrentLocation(nextLocation);
        getLocationDetails(nextLocation, 'Your live route')
          .then(setCurrentLocationDetails)
          .catch(() => null);
      }
    };

    socket.on('gps:updated', onGpsUpdated);

    return () => {
      socket.off('gps:updated', onGpsUpdated);
    };
  }, [user?._id]);

  useEffect(() => {
    if (!order?.deliveryLocation) {
      setDestinationDetails(null);
      return;
    }

    getLocationDetails(order.deliveryLocation, 'Delivery point')
      .then(setDestinationDetails)
      .catch(() => null);
  }, [order?.deliveryLocation]);

  const initialRegion =
    currentLocation || order?.deliveryLocation
      ? {
          latitude: currentLocation?.latitude || order?.deliveryLocation?.latitude || fallbackRegion.latitude,
          longitude:
            currentLocation?.longitude || order?.deliveryLocation?.longitude || fallbackRegion.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }
      : fallbackRegion;
  const routePoints = [
    ...(currentLocation ? [currentLocation] : []),
    ...(order?.deliveryLocation ? [order.deliveryLocation] : []),
  ];

  return (
    <ScreenLayout title="Navigation Map" subtitle="Follow your current GPS pin and the customer drop point in one map view.">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <MapPanel
        fallbackActionLabel={order?.deliveryLocation ? 'Open destination' : undefined}
        fallbackDescription="You can still keep the delivery moving by opening the destination in your phone maps."
        fallbackTitle="Route map is loading slowly."
        initialRegion={initialRegion}
        onFallbackAction={
          order?.deliveryLocation
            ? () =>
                openInExternalMap(
                  order.deliveryLocation as LocationPoint,
                  order.deliveryAddress || destinationDetails?.title || 'Delivery point',
                )
            : undefined
        }
        points={routePoints}
        statusLabel={currentLocation ? 'GPS live' : 'GPS pending'}
        statusTone={currentLocation ? 'accent' : 'warning'}
        subtitle={
          currentLocation
            ? 'Your live GPS route and the customer stop stay centered as the trip updates.'
            : 'Grant location access to start live navigation and keep delivery updates accurate.'
        }
        title="Live delivery route"
      >
          {currentLocation ? (
            <Marker coordinate={currentLocation} title="Your Location" pinColor={theme.colors.accentSecondary} />
          ) : null}
          {order?.deliveryLocation ? (
            <Marker coordinate={order.deliveryLocation} title="Delivery Point" pinColor={theme.colors.accent} />
          ) : null}
      </MapPanel>
      {order ? (
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Destination</Text>
          <Text style={styles.infoMeta}>
            {order.deliveryAddress || destinationDetails?.title || 'Address not provided for this order.'}
          </Text>
          {destinationDetails?.subtitle ? (
            <Text style={styles.infoMeta}>{destinationDetails.subtitle}</Text>
          ) : null}
          {currentLocationDetails ? (
            <View style={styles.routeSummary}>
              <Text style={styles.routeTitle}>Live worker location</Text>
              <Text style={styles.infoMeta}>{currentLocationDetails.title}</Text>
              <Text style={styles.infoMeta}>{currentLocationDetails.subtitle}</Text>
              <Text style={styles.infoMeta}>{currentLocationDetails.coordinates}</Text>
            </View>
          ) : null}
          {order.deliveryLocation ? (
            <PrimaryButton
              label="Open in Maps"
              variant="outline"
              onPress={() =>
                openInExternalMap(
                  order.deliveryLocation as LocationPoint,
                  order.deliveryAddress || destinationDetails?.title || 'Delivery point',
                )
              }
            />
          ) : null}
          <PrimaryButton
            label="Refresh GPS"
            loading={isRefreshingLocation}
            onPress={() => {
              loadCurrentLocation().catch(() => null);
            }}
            variant="ghost"
          />
        </Card>
      ) : (
        <EmptyState
          title="No order selected"
          subtitle="Open this screen from an assigned order card to show delivery-specific navigation."
        />
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    error: {
      color: theme.colors.danger,
    },
    infoCard: {
      gap: 8,
    },
    infoTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    infoMeta: {
      color: theme.colors.textMuted,
    },
    routeSummary: {
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      gap: 4,
      marginTop: theme.spacing.xs,
      paddingTop: theme.spacing.sm,
    },
    routeTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 14,
      fontWeight: '700',
    },
  });

export default MapNavigationScreen;
