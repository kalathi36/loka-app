import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import api from '../services/api';
import { getCurrentLocation, requestLocationPermission } from '../services/location';
import { useAuth } from '../store/AuthContext';
import DeliveryScreen from '../screens/worker/DeliveryScreen';
import AssignedOrdersScreen from '../screens/worker/AssignedOrdersScreen';
import AttendanceScreen from '../screens/worker/AttendanceScreen';
import EarningsScreen from '../screens/worker/EarningsScreen';
import MapNavigationScreen from '../screens/worker/MapNavigationScreen';
import WorkerHomeScreen from '../screens/worker/WorkerHomeScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';
import ForgotPasswordScreen from '../screens/common/ForgotPasswordScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import {
  buildStackScreenOptions,
  buildTabScreenOptions,
  createRoleTabNavigator,
  renderTabGlyph,
} from './navigationStyles';
import { useAppTheme } from '../theme/ThemeProvider';

const Tab = createRoleTabNavigator();
const TodayStack = createStackNavigator();
const OrdersStack = createStackNavigator();
const PayStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const WorkerTodayStack = () => {
  const { theme } = useAppTheme();

  return (
    <TodayStack.Navigator screenOptions={buildStackScreenOptions(theme)}>
      <TodayStack.Screen name="WorkerHome" component={WorkerHomeScreen} options={{ title: 'Today' }} />
      <TodayStack.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Attendance' }} />
    </TodayStack.Navigator>
  );
};

const WorkerOrdersStack = () => {
  const { theme } = useAppTheme();

  return (
    <OrdersStack.Navigator screenOptions={buildStackScreenOptions(theme)}>
      <OrdersStack.Screen
        name="AssignedOrders"
        component={AssignedOrdersScreen}
        options={{ title: 'Orders' }}
      />
      <OrdersStack.Screen name="Delivery" component={DeliveryScreen} options={{ title: 'Delivery Update' }} />
      <OrdersStack.Screen
        name="MapNavigation"
        component={MapNavigationScreen}
        options={{ title: 'Live Map' }}
      />
    </OrdersStack.Navigator>
  );
};

const WorkerPayStack = () => {
  const { theme } = useAppTheme();

  return (
    <PayStack.Navigator screenOptions={buildStackScreenOptions(theme)}>
      <PayStack.Screen name="Earnings" component={EarningsScreen} options={{ title: 'Pay' }} />
    </PayStack.Navigator>
  );
};

const WorkerProfileStack = () => {
  const { theme } = useAppTheme();

  return (
    <ProfileStack.Navigator screenOptions={buildStackScreenOptions(theme)}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <ProfileStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: 'Forgot Password' }}
      />
    </ProfileStack.Navigator>
  );
};

const WorkerStack = () => {
  const { user } = useAuth();
  const { theme } = useAppTheme();

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let isPosting = false;

    const heartbeat = async () => {
      if (user?.role !== 'worker' || isPosting) {
        return;
      }

      isPosting = true;

      try {
        const granted = await requestLocationPermission();

        if (!granted) {
          return;
        }

        const location = await getCurrentLocation();
        await api.post('/workers/gps', location);
      } catch {
      } finally {
        isPosting = false;
      }
    };

    heartbeat();
    intervalId = setInterval(heartbeat, 15000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user?.role]);

  return (
    <Tab.Navigator screenOptions={buildTabScreenOptions(theme)}>
      <Tab.Screen
        name="WorkerTodayTab"
        component={WorkerTodayStack}
        options={{
          title: 'Today',
          ...renderTabGlyph('speedometer-outline'),
        }}
      />
      <Tab.Screen
        name="WorkerOrdersTab"
        component={WorkerOrdersStack}
        options={{
          title: 'Orders',
          ...renderTabGlyph('trail-sign-outline'),
        }}
      />
      <Tab.Screen
        name="WorkerPayTab"
        component={WorkerPayStack}
        options={{
          title: 'Pay',
          ...renderTabGlyph('wallet-outline'),
        }}
      />
      <Tab.Screen
        name="WorkerProfileTab"
        component={WorkerProfileStack}
        options={{
          title: 'Profile',
          ...renderTabGlyph('person-circle-outline'),
        }}
      />
    </Tab.Navigator>
  );
};

export default WorkerStack;
