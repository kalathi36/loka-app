import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { EmptyState } from '../../components/EmptyState';
import { ScreenLayout } from '../../components/ScreenLayout';
import { getCurrentLocation, requestLocationPermission } from '../../services/location';
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
  const [error, setError] = useState('');

  const loadCurrentLocation = async () => {
    try {
      setError('');
      const granted = await requestLocationPermission();

      if (!granted) {
        setError('Location permission is required for map navigation.');
        return;
      }

      const nextLocation = await getCurrentLocation();
      setCurrentLocation(nextLocation);
    } catch (locationError) {
      setError(extractErrorMessage(locationError));
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
        setCurrentLocation({
          latitude: payload.latitude,
          longitude: payload.longitude,
        });
      }
    };

    socket.on('gps:updated', onGpsUpdated);

    return () => {
      socket.off('gps:updated', onGpsUpdated);
    };
  }, [user?._id]);

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

  return (
    <ScreenLayout title="Navigation Map" subtitle="Follow your current GPS pin and the customer drop point in one map view.">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.mapShell}>
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={styles.map}
          initialRegion={initialRegion}
        >
          {currentLocation ? (
            <Marker coordinate={currentLocation} title="Your Location" pinColor={theme.colors.accentSecondary} />
          ) : null}
          {order?.deliveryLocation ? (
            <Marker coordinate={order.deliveryLocation} title="Delivery Point" pinColor={theme.colors.accent} />
          ) : null}
        </MapView>
      </View>
      {order ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Destination</Text>
          <Text style={styles.infoMeta}>{order.deliveryAddress || 'Address not provided for this order.'}</Text>
        </View>
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
    mapShell: {
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      overflow: 'hidden',
    },
    map: {
      height: 340,
      width: '100%',
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 8,
      padding: theme.spacing.md,
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
  });

export default MapNavigationScreen;
