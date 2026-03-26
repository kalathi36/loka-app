import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StackNavigationOptions } from '@react-navigation/stack';
import { TabGlyph } from '../components/TabGlyph';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { AppTheme } from '../theme/theme';

export const createRoleTabNavigator = createBottomTabNavigator;

export const buildStackScreenOptions = (theme: AppTheme): StackNavigationOptions => ({
  cardStyle: { backgroundColor: theme.colors.background },
  headerStyle: { backgroundColor: theme.colors.background },
  headerTintColor: theme.colors.text,
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
