import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminChatScreen from '../screens/admin/AdminChatScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AssignWorkerScreen from '../screens/admin/AssignWorkerScreen';
import MapTrackingScreen from '../screens/admin/MapTrackingScreen';
import OrdersScreen from '../screens/admin/OrdersScreen';
import ProductManagementScreen from '../screens/admin/ProductManagementScreen';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { useAppTheme } from '../theme/ThemeProvider';

const Stack = createStackNavigator();
const renderThemeToggle = () => <ThemeToggleButton compact />;

const AdminStack = () => {
  const { theme } = useAppTheme();

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
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Loka Admin' }} />
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'All Orders' }} />
      <Stack.Screen name="AssignWorker" component={AssignWorkerScreen} options={{ title: 'Assign Worker' }} />
      <Stack.Screen
        name="ProductManagement"
        component={ProductManagementScreen}
        options={{ title: 'Products' }}
      />
      <Stack.Screen name="MapTracking" component={MapTrackingScreen} options={{ title: 'Live Tracking' }} />
      <Stack.Screen name="AdminChat" component={AdminChatScreen} options={{ title: 'Support Chat' }} />
    </Stack.Navigator>
  );
};

export default AdminStack;
