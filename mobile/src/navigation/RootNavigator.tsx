import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AdminStack from './AdminStack';
import WorkerStack from './WorkerStack';
import CustomerStack from './CustomerStack';
import LoginScreen from '../screens/common/LoginScreen';
import RegisterOrganizationScreen from '../screens/common/RegisterOrganizationScreen';
import SignupScreen from '../screens/common/SignupScreen';
import SplashScreen from '../screens/common/SplashScreen';
import ForgotPasswordScreen from '../screens/common/ForgotPasswordScreen';
import { useAuth } from '../store/AuthContext';
import { useAppTheme } from '../theme/ThemeProvider';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { user, initializing } = useAuth();
  const { theme } = useAppTheme();

  const navigationTheme = {
    dark: theme.isDark,
    colors: {
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.accentSecondary,
    },
  };

  if (initializing) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {!user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="RegisterOrganization" component={RegisterOrganizationScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
      ) : user.role === 'admin' ? (
        <AdminStack />
      ) : user.role === 'worker' ? (
        <WorkerStack />
      ) : (
        <CustomerStack />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;
