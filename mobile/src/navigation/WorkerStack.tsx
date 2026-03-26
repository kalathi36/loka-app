import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import api from '../services/api';
import { getCurrentLocation, requestLocationPermission } from '../services/location';
import { useAuth } from '../store/AuthContext';
import DeliveryScreen from '../screens/worker/DeliveryScreen';
import AssignedOrdersScreen from '../screens/worker/AssignedOrdersScreen';
import AttendanceScreen from '../screens/worker/AttendanceScreen';
import MapNavigationScreen from '../screens/worker/MapNavigationScreen';
import WorkerHomeScreen from '../screens/worker/WorkerHomeScreen';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { useAppTheme } from '../theme/ThemeProvider';

const Stack = createStackNavigator();
const renderThemeToggle = () => <ThemeToggleButton compact />;

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
    <Stack.Navigator
      screenOptions={{
        cardStyle: { backgroundColor: theme.colors.background },
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          color: theme.colors.text,
          fontFamily: theme.fontFamily.heading,
        },
        headerRight: renderThemeToggle,
        headerRightContainerStyle: { paddingRight: 12 },
      }}
    >
      <Stack.Screen name="WorkerHome" component={WorkerHomeScreen} options={{ title: 'Worker Hub' }} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Attendance' }} />
      <Stack.Screen
        name="AssignedOrders"
        component={AssignedOrdersScreen}
        options={{ title: 'Assigned Orders' }}
      />
      <Stack.Screen name="Delivery" component={DeliveryScreen} options={{ title: 'Delivery Update' }} />
      <Stack.Screen
        name="MapNavigation"
        component={MapNavigationScreen}
        options={{ title: 'Navigation Map' }}
      />
    </Stack.Navigator>
  );
};

export default WorkerStack;
