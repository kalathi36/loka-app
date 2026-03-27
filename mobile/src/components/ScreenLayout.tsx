import React, { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeProvider';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';

interface ScreenLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
  rightAction?: React.ReactNode;
  floatingAction?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  flushTop?: boolean;
}

export const ScreenLayout = ({
  title,
  subtitle,
  children,
  scroll = true,
  rightAction,
  floatingAction,
  contentStyle,
  flushTop = true,
}: ScreenLayoutProps) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: 18,
        bounciness: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const content = (
    <Animated.View
      style={[
        styles.content,
        contentStyle,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {title || rightAction ? (
        <View style={[styles.header, flushTop ? styles.headerFlushTop : null]}>
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {rightAction}
        </View>
      ) : null}
      {children}
    </Animated.View>
  );

  return (
    <SafeAreaView edges={flushTop ? [] : ['top']} style={styles.safeArea}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <View style={styles.glowA} />
      <View style={styles.glowB} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
        style={styles.flex}
      >
        {scroll ? (
          <ScrollView
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
      {floatingAction ? <View style={styles.floatingActionSlot}>{floatingAction}</View> : null}
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.md,
    },
    glowA: {
      backgroundColor: theme.colors.glowPrimary,
      borderRadius: 180,
      height: 220,
      position: 'absolute',
      right: -60,
      top: -40,
      width: 220,
    },
    glowB: {
      backgroundColor: theme.colors.glowSecondary,
      borderRadius: 180,
      bottom: 40,
      height: 180,
      left: -90,
      position: 'absolute',
      width: 180,
    },
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.xs,
    },
    headerFlushTop: {
      marginTop: 0,
    },
    headerText: {
      flex: 1,
      gap: 8,
      paddingRight: theme.spacing.md,
    },
    floatingActionSlot: {
      bottom: 92,
      position: 'absolute',
      right: theme.spacing.md,
    },
    title: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: 0.8,
    },
    subtitle: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
  });
