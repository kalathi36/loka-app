import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeToToast, ToastPayload } from '../services/toast';
import { useAppTheme } from '../theme/ThemeProvider';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';

const getToastTone = (theme: AppTheme, type: ToastPayload['type']) => {
  if (type === 'success') {
    return {
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.success,
      titleColor: theme.colors.text,
      messageColor: theme.colors.textMuted,
    };
  }

  if (type === 'error') {
    return {
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.danger,
      titleColor: theme.colors.text,
      messageColor: theme.colors.textMuted,
    };
  }

  return {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.accent,
    titleColor: theme.colors.text,
    messageColor: theme.colors.textMuted,
  };
};

export const ToastViewport = () => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [activeToast, setActiveToast] = useState<ToastPayload | null>(null);
  const translateY = useRef(new Animated.Value(-18)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tone = useMemo(
    () => getToastTone(theme, activeToast?.type || 'info'),
    [activeToast?.type, theme],
  );

  useEffect(() => {
    const unsubscribe = subscribeToToast((toast) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setActiveToast(toast);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!activeToast) {
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        bounciness: 5,
        speed: 20,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -18,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => setActiveToast(null));
    }, activeToast.duration || 2800);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [activeToast, opacity, translateY]);

  if (!activeToast) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.portal}>
      <Animated.View
        style={[
          styles.toastShadow,
          {
            marginTop: insets.top + 8,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Pressable
          onPress={() => setActiveToast(null)}
          style={[
            styles.toast,
            {
              backgroundColor: tone.backgroundColor,
              borderColor: tone.borderColor,
            },
          ]}
        >
          <Text style={[styles.title, { color: tone.titleColor }]}>{activeToast.title}</Text>
          {activeToast.message ? (
            <Text style={[styles.message, { color: tone.messageColor }]}>
              {activeToast.message}
            </Text>
          ) : null}
        </Pressable>
      </Animated.View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    portal: {
      left: 0,
      pointerEvents: 'box-none',
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 200,
    },
    toastShadow: {
      paddingHorizontal: theme.spacing.md,
    },
    toast: {
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 6,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: theme.isDark ? 0.26 : 0.12,
      shadowRadius: 24,
    },
    title: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 15,
      fontWeight: '700',
    },
    message: {
      lineHeight: 18,
    },
  });
