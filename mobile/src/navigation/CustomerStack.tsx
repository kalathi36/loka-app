import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CartScreen from '../screens/customer/CartScreen';
import ChatScreen from '../screens/customer/ChatScreen';
import CustomerOrdersScreen from '../screens/customer/CustomerOrdersScreen';
import OrderScreen from '../screens/customer/OrderScreen';
import OrderTrackingScreen from '../screens/customer/OrderTrackingScreen';
import ProductListScreen from '../screens/customer/ProductListScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';
import ForgotPasswordScreen from '../screens/common/ForgotPasswordScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import {
  buildStackScreenOptions,
  buildTabScreenOptions,
  createRoleTabNavigator,
  renderTabGlyph,
} from './navigationStyles';
import { useCart } from '../store/CartContext';
import { useAppTheme } from '../theme/ThemeProvider';

const Tab = createRoleTabNavigator();
const ShopStack = createStackNavigator();
const OrdersStack = createStackNavigator();
const CartStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const CustomerShopStack = () => {
  const { theme } = useAppTheme();

  return (
    <ShopStack.Navigator screenOptions={buildStackScreenOptions(theme)}>
      <ShopStack.Screen name="Products" component={ProductListScreen} options={{ title: 'Shop' }} />
    </ShopStack.Navigator>
  );
};

const CustomerOrdersStack = () => {
  const { theme } = useAppTheme();

  return (
    <OrdersStack.Navigator screenOptions={buildStackScreenOptions(theme)}>
      <OrdersStack.Screen name="CustomerOrders" component={CustomerOrdersScreen} options={{ title: 'Orders' }} />
      <OrdersStack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ title: 'Track Order' }}
      />
      <OrdersStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Support' }} />
    </OrdersStack.Navigator>
  );
};

const CustomerCartStack = () => {
  const { theme } = useAppTheme();

  return (
    <CartStack.Navigator screenOptions={buildStackScreenOptions(theme)}>
      <CartStack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      <CartStack.Screen name="Order" component={OrderScreen} options={{ title: 'Checkout' }} />
      <CartStack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ title: 'Track Order' }}
      />
      <CartStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Support' }} />
    </CartStack.Navigator>
  );
};

const CustomerProfileStack = () => {
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

const CustomerStack = () => {
  const { theme } = useAppTheme();
  const { itemCount } = useCart();

  return (
    <Tab.Navigator screenOptions={buildTabScreenOptions(theme)}>
      <Tab.Screen
        name="CustomerShopTab"
        component={CustomerShopStack}
        options={{
          title: 'Shop',
          ...renderTabGlyph('storefront-outline'),
        }}
      />
      <Tab.Screen
        name="CustomerOrdersTab"
        component={CustomerOrdersStack}
        options={{
          title: 'Orders',
          ...renderTabGlyph('receipt-outline'),
        }}
      />
      <Tab.Screen
        name="CustomerCartTab"
        component={CustomerCartStack}
        options={{
          title: 'Cart',
          tabBarBadge: itemCount ? (itemCount > 99 ? '99+' : itemCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.accent,
          },
          ...renderTabGlyph('bag-handle-outline'),
        }}
      />
      <Tab.Screen
        name="CustomerProfileTab"
        component={CustomerProfileStack}
        options={{
          title: 'Profile',
          ...renderTabGlyph('person-circle-outline'),
        }}
      />
    </Tab.Navigator>
  );
};

export default CustomerStack;
