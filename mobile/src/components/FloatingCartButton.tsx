import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AppIcon } from './AppIcon';
import { useAppTheme } from '../theme/ThemeProvider';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';

interface FloatingCartButtonProps {
  count: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const FloatingCartButton = ({ count, onPress, style }: FloatingCartButtonProps) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!count) {
      scale.stopAnimation();
      scale.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [count, scale]);

  return (
    <Animated.View style={[styles.shell, style, { transform: [{ scale }] }]}>
      <Pressable onPress={onPress} style={styles.button}>
        <View style={styles.iconWrap}>
          <AppIcon color={theme.colors.textOnAccent} name="bag-handle-outline" size={20} />
          {count ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.label}>Cart</Text>
      </Pressable>
    </Animated.View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    shell: {
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: theme.isDark ? 0.3 : 0.16,
      shadowRadius: 18,
    },
    button: {
      alignItems: 'center',
      backgroundColor: theme.colors.accent,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 10,
      minHeight: 56,
      paddingHorizontal: 18,
    },
    iconWrap: {
      position: 'relative',
    },
    badge: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 999,
      height: 18,
      justifyContent: 'center',
      minWidth: 18,
      paddingHorizontal: 4,
      position: 'absolute',
      right: -10,
      top: -8,
    },
    badgeText: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 10,
      fontWeight: '700',
    },
    label: {
      color: theme.colors.textOnAccent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
  });
