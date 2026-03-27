import React, { useEffect, useRef } from 'react';
import {
  Animated,
  DimensionValue,
  Easing,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';

interface SkeletonBlockProps {
  height: number;
  width?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonBlock = ({
  height,
  width = '100%',
  radius = 14,
  style,
}: SkeletonBlockProps) => {
  const styles = useThemedStyles(createStyles);
  const shimmer = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.35,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [shimmer]);

  return (
    <View style={[styles.base, { height, width, borderRadius: radius }, style]}>
      <Animated.View style={[styles.shimmer, { opacity: shimmer }]} />
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    base: {
      backgroundColor: theme.colors.surfaceRaised,
      overflow: 'hidden',
    },
    shimmer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.surfaceMuted,
    },
  });
