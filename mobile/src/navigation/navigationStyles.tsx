import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StackNavigationOptions } from '@react-navigation/stack';
import { AppIcon } from '../components/AppIcon';
import { TabGlyph } from '../components/TabGlyph';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { AppTheme } from '../theme/theme';

export const createRoleTabNavigator = createBottomTabNavigator;

export const buildStackScreenOptions = (theme: AppTheme): StackNavigationOptions => ({
  cardStyle: { backgroundColor: theme.colors.background },
  headerBackTitleVisible: false,
  headerStyle: { backgroundColor: theme.colors.background },
  headerTintColor: theme.colors.text,
  headerLeft: ({ canGoBack, label, onPress, tintColor }) => {
    if (!canGoBack || !onPress) {
      return null;
    }

    return (
      <Pressable
        accessibilityRole="button"
        hitSlop={10}
        onPress={onPress}
        style={styles.backButton}
      >
        <AppIcon color={tintColor || theme.colors.text} name="chevron-back" size={20} />
        <Text numberOfLines={1} style={[styles.backLabel, { color: tintColor || theme.colors.text }]}>
          {label || 'Back'}
        </Text>
      </Pressable>
    );
  },
  headerLeftContainerStyle: { paddingLeft: 12 },
  headerTitleStyle: {
    color: theme.colors.text,
    fontFamily: theme.fontFamily.heading,
  },
  headerRight: () => <ThemeToggleButton compact />,
  headerRightContainerStyle: { paddingRight: 12 },
});

export const buildTabScreenOptions = (theme: AppTheme) => ({
  headerShown: false,
  sceneContainerStyle: {
    backgroundColor: theme.colors.background,
  },
  tabBarStyle: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    height: 78,
    paddingBottom: 12,
    paddingTop: 10,
  },
  tabBarHideOnKeyboard: true,
  tabBarActiveTintColor: theme.colors.accent,
  tabBarInactiveTintColor: theme.colors.textMuted,
  tabBarLabelStyle: {
    fontFamily: theme.fontFamily.heading,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
});

export const renderTabGlyph = (name: string) => ({
  tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
    <TabGlyph name={name} focused={focused} color={color} />
  ),
});

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    maxWidth: 120,
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
