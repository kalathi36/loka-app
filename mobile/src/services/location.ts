import Geolocation from '@react-native-community/geolocation';
import { Linking, PermissionsAndroid, Platform } from 'react-native';
import { LocationPoint } from '../types';

export interface LocationDetails {
  title: string;
  subtitle: string;
  coordinates: string;
  fullLabel: string;
}

interface ReverseGeocodeResponse {
  display_name?: string;
  address?: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state_district?: string;
    state?: string;
    postcode?: string;
  };
}

const geocodeCache = new Map<string, Promise<LocationDetails>>();

export const formatCoordinates = (point?: LocationPoint | null) => {
  if (!point) {
    return 'Location unavailable';
  }

  return `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
};

const buildFallbackLocationDetails = (
  point: LocationPoint,
  fallbackTitle: string,
): LocationDetails => ({
  title: fallbackTitle,
  subtitle: 'Live coordinates captured for this stop.',
  coordinates: formatCoordinates(point),
  fullLabel: `${fallbackTitle} • ${formatCoordinates(point)}`,
});

const getCacheKey = (point: LocationPoint) =>
  `${point.latitude.toFixed(4)}:${point.longitude.toFixed(4)}`;

const buildLocationDetails = (
  point: LocationPoint,
  payload: ReverseGeocodeResponse,
  fallbackTitle: string,
): LocationDetails => {
  const address = payload.address || {};
  const locality =
    address.city || address.town || address.village || address.county || address.state_district || '';
  const microArea =
    address.road || address.suburb || address.neighbourhood || address.city_district || '';
  const title = [microArea, locality].filter(Boolean).slice(0, 2).join(', ') || locality || fallbackTitle;
  const subtitle =
    [address.state, address.postcode].filter(Boolean).join(' • ') ||
    payload.display_name?.split(',').slice(1, 4).join(', ').trim() ||
    'Live location available';
  const fullLabel = payload.display_name || [title, subtitle].filter(Boolean).join(', ');

  return {
    title,
    subtitle,
    coordinates: formatCoordinates(point),
    fullLabel,
  };
};

export const getLocationDetails = async (
  point: LocationPoint,
  fallbackTitle = 'Pinned location',
) => {
  const cacheKey = getCacheKey(point);
  const cachedPromise = geocodeCache.get(cacheKey);

  if (cachedPromise) {
    return cachedPromise;
  }

  const request = (async () => {
    try {
      const query = new URLSearchParams({
        format: 'jsonv2',
        lat: String(point.latitude),
        lon: String(point.longitude),
        zoom: '18',
        addressdetails: '1',
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query.toString()}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Loka Logistics App/1.0',
        },
      });

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const payload = (await response.json()) as ReverseGeocodeResponse;
      return buildLocationDetails(point, payload, fallbackTitle);
    } catch {
      return buildFallbackLocationDetails(point, fallbackTitle);
    }
  })();

  geocodeCache.set(cacheKey, request);
  return request;
};

export const openInExternalMap = async (point: LocationPoint, label = 'Pinned location') => {
  const encodedLabel = encodeURIComponent(label);
  const latitude = point.latitude;
  const longitude = point.longitude;
  const primaryUrl =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedLabel}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`;

  if (await Linking.canOpenURL(primaryUrl)) {
    return Linking.openURL(primaryUrl);
  }

  return Linking.openURL(
    `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  );
};

export const requestLocationPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Access',
      message: 'Loka uses your location for attendance, navigation, and live tracking.',
      buttonPositive: 'Allow',
    },
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

export const getCurrentLocation = () =>
  new Promise<LocationPoint>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    );
  });
