import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { LocationPoint } from '../types';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';

type StatusTone = 'accent' | 'muted' | 'warning';

interface MapPanelProps {
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone?: StatusTone;
  initialRegion: Region;
  points?: LocationPoint[];
  height?: number;
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackActionLabel?: string;
  onFallbackAction?: () => void;
  children: React.ReactNode;
}

const MAP_LOAD_GRACE_MS = 4500;

export const MapPanel = ({
  title,
  subtitle,
  statusLabel,
  statusTone = 'accent',
  initialRegion,
  points = [],
  height = 320,
  fallbackTitle = 'Map tiles are taking longer than usual.',
  fallbackDescription = 'You can keep using the app and open the location directly in your maps app.',
  fallbackActionLabel,
  onFallbackAction,
  children,
}: MapPanelProps) => {
  const styles = useThemedStyles(createStyles);
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(Platform.OS !== 'android');
  const [showFallback, setShowFallback] = useState(false);
  const normalizedPoints = points.filter(
    (point): point is LocationPoint =>
      Number.isFinite(point.latitude) && Number.isFinite(point.longitude),
  );
  const fitKey = normalizedPoints.map((point) => `${point.latitude}:${point.longitude}`).join('|');

  useEffect(() => {
    if (!mapReady || tilesLoaded) {
      setShowFallback(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowFallback(true);
    }, MAP_LOAD_GRACE_MS);

    return () => clearTimeout(timer);
  }, [mapReady, tilesLoaded]);

  useEffect(() => {
    if (!mapReady || normalizedPoints.length === 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      if (!mapRef.current) {
        return;
      }

      if (normalizedPoints.length === 1) {
        mapRef.current.animateToRegion(
          {
            latitude: normalizedPoints[0].latitude,
            longitude: normalizedPoints[0].longitude,
            latitudeDelta: initialRegion.latitudeDelta,
            longitudeDelta: initialRegion.longitudeDelta,
          },
          260,
        );
        return;
      }

      mapRef.current.fitToCoordinates(normalizedPoints, {
        animated: true,
        edgePadding: {
          top: 64,
          right: 40,
          bottom: 64,
          left: 40,
        },
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [
    fitKey,
    initialRegion.latitudeDelta,
    initialRegion.longitudeDelta,
    mapReady,
    normalizedPoints,
  ]);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            statusTone === 'muted' ? styles.statusMuted : null,
            statusTone === 'warning' ? styles.statusWarning : null,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              statusTone === 'muted' ? styles.statusTextMuted : null,
              statusTone === 'warning' ? styles.statusTextWarning : null,
            ]}
          >
            {showFallback ? 'Map delayed' : statusLabel}
          </Text>
        </View>
      </View>
      <View style={[styles.mapShell, { height }]}>
        <MapView
          ref={mapRef}
          initialRegion={initialRegion}
          loadingEnabled
          mapType="standard"
          moveOnMarkerPress={false}
          onMapLoaded={() => {
            setTilesLoaded(true);
            setShowFallback(false);
          }}
          onMapReady={() => {
            setMapReady(true);
          }}
          pitchEnabled={false}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          rotateEnabled={false}
          showsCompass
          style={styles.map}
          toolbarEnabled
        >
          {children}
        </MapView>
        {showFallback ? (
          <View style={styles.fallback}>
            <Text style={styles.fallbackTitle}>{fallbackTitle}</Text>
            <Text style={styles.fallbackDescription}>{fallbackDescription}</Text>
            {fallbackActionLabel && onFallbackAction ? (
              <PrimaryButton
                label={fallbackActionLabel}
                onPress={onFallbackAction}
                style={styles.fallbackButton}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </Card>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.sm,
      justifyContent: 'space-between',
    },
    headerCopy: {
      flex: 1,
      gap: 4,
    },
    title: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    subtitle: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    statusBadge: {
      alignItems: 'center',
      backgroundColor: theme.colors.accentMuted,
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 34,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    statusMuted: {
      backgroundColor: theme.colors.surfaceMuted,
    },
    statusWarning: {
      backgroundColor: `${theme.colors.warning}22`,
    },
    statusText: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    statusTextMuted: {
      color: theme.colors.textMuted,
    },
    statusTextWarning: {
      color: theme.colors.warning,
    },
    mapShell: {
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      overflow: 'hidden',
      position: 'relative',
    },
    map: {
      height: '100%',
      width: '100%',
    },
    fallback: {
      backgroundColor: `${theme.colors.background}E8`,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      bottom: theme.spacing.md,
      gap: theme.spacing.xs,
      left: theme.spacing.md,
      padding: theme.spacing.md,
      position: 'absolute',
      right: theme.spacing.md,
    },
    fallbackTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 15,
      fontWeight: '700',
    },
    fallbackDescription: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    fallbackButton: {
      marginTop: theme.spacing.xs,
    },
  });
