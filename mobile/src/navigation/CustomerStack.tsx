import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CartScreen from '../screens/customer/CartScreen';
import ChatScreen from '../screens/customer/ChatScreen';
import OrderScreen from '../screens/customer/OrderScreen';
import OrderTrackingScreen from '../screens/customer/OrderTrackingScreen';
import ProductListScreen from '../screens/customer/ProductListScreen';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { useAppTheme } from '../theme/ThemeProvider';

const Stack = createStackNavigator();
const renderThemeToggle = () => <ThemeToggleButton compact />;

const CustomerStack = () => {
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
      <Stack.Screen name="Products" component={ProductListScreen} options={{ title: 'Loka Shop' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      <Stack.Screen name="Order" component={OrderScreen} options={{ title: 'Checkout' }} />
      <Stack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ title: 'Track Orders' }}
      />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Support Chat' }} />
    </Stack.Navigator>
  );
};

export default CustomerStack;
