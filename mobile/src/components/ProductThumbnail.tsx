import React, { useMemo, useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { AppIcon } from './AppIcon';
import { AppTheme } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';

interface ProductThumbnailProps {
  name: string;
  category?: string;
  imageUrl?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

type Preset = {
  iconName: string;
  accent: string;
  tint: string;
};

const getPreset = (category = ''): Preset => {
  const normalized = category.toLowerCase();

  if (normalized.includes('cement') || normalized.includes('concrete')) {
    return {
      iconName: 'cube-outline',
      accent: '#B57A46',
      tint: 'rgba(181, 122, 70, 0.12)',
    };
  }

  if (normalized.includes('steel') || normalized.includes('rod') || normalized.includes('metal')) {
    return {
      iconName: 'construct-outline',
      accent: '#4C789A',
      tint: 'rgba(76, 120, 154, 0.12)',
    };
  }

  if (normalized.includes('paint') || normalized.includes('coating')) {
    return {
      iconName: 'color-fill-outline',
      accent: '#6F67D8',
      tint: 'rgba(111, 103, 216, 0.12)',
    };
  }

  if (normalized.includes('brick') || normalized.includes('block') || normalized.includes('tile')) {
    return {
      iconName: 'grid-outline',
      accent: '#C36E4E',
      tint: 'rgba(195, 110, 78, 0.12)',
    };
  }

  if (normalized.includes('electrical') || normalized.includes('wire') || normalized.includes('cable')) {
    return {
      iconName: 'flash-outline',
      accent: '#E3A20A',
      tint: 'rgba(227, 162, 10, 0.12)',
    };
  }

  if (normalized.includes('plumbing') || normalized.includes('pipe') || normalized.includes('water')) {
    return {
      iconName: 'water-outline',
      accent: '#0D8F96',
      tint: 'rgba(13, 143, 150, 0.12)',
    };
  }

  if (normalized.includes('tool') || normalized.includes('hardware') || normalized.includes('supply')) {
    return {
      iconName: 'hammer-outline',
      accent: '#168CFF',
      tint: 'rgba(22, 140, 255, 0.12)',
    };
  }

  return {
    iconName: 'cube-outline',
    accent: '#168CFF',
    tint: 'rgba(22, 140, 255, 0.12)',
  };
};

export const ProductThumbnail = ({
  name,
  category,
  imageUrl,
  height = 140,
  style,
}: ProductThumbnailProps) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [failed, setFailed] = useState(false);
  const preset = useMemo(() => getPreset(category), [category]);
  const iconShellSize = Math.max(44, Math.min(74, Math.round(height * 0.42)));
  const iconSize = Math.max(24, Math.min(38, Math.round(height * 0.26)));
  const showAccentStrip = height >= 96;

  if (imageUrl && !failed) {
    return (
      <Image
        onError={() => setFailed(true)}
        resizeMode="cover"
        source={{ uri: imageUrl }}
        style={[styles.image, { height }, style as StyleProp<ImageStyle>]}
      />
    );
  }

  return (
    <View
      accessibilityLabel={`${name} thumbnail`}
      style={[
        styles.shell,
        {
          backgroundColor: theme.isDark ? theme.colors.surfaceRaised : theme.colors.surfaceRaised,
          borderColor: theme.colors.border,
          height,
        },
        style,
      ]}
    >
      <View style={[styles.inner, { backgroundColor: theme.colors.surface }]}>
        <View
          style={[
            styles.iconShell,
            {
              backgroundColor: preset.tint,
              borderColor: `${preset.accent}24`,
              height: iconShellSize,
              width: iconShellSize,
            },
          ]}
        >
          <AppIcon color={preset.accent} name={preset.iconName} size={iconSize} />
        </View>
      </View>
      {showAccentStrip ? <View style={[styles.accentStrip, { backgroundColor: preset.accent }]} /> : null}
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    image: {
      borderRadius: theme.radius.md,
      width: '100%',
    },
    inner: {
      alignItems: 'center',
      borderRadius: theme.radius.md,
      flex: 1,
      justifyContent: 'center',
      margin: theme.spacing.sm,
    },
    iconShell: {
      alignItems: 'center',
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: 'center',
    },
    shell: {
      borderRadius: theme.radius.md,
      borderWidth: 1,
      overflow: 'hidden',
      width: '100%',
    },
    accentStrip: {
      borderRadius: 999,
      bottom: theme.spacing.sm,
      height: 4,
      left: theme.spacing.sm,
      position: 'absolute',
      width: 34,
    },
  });
