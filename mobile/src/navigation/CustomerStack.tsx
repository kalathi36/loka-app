import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CartScreen from '../screens/customer/CartScreen';
import ChatScreen from '../screens/customer/ChatScreen';
import CustomerManageScreen from '../screens/customer/CustomerManageScreen';
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
const HomeStack = createStackNavigator();
const ManageStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const CustomerHomeStack = () => {
  const { theme } = useAppTheme();

  return (
    <HomeStack.Navigator screenOptions={buildStackScreenOptions(theme)}>
      <HomeStack.Screen name="Products" component={ProductListScreen} options={{ title: 'Loka Shop' }} />
    </HomeStack.Navigator>
  );
};

const CustomerManageStack = () => {
  const { theme } = useAppTheme();

  return (
    <ManageStack.Navigator screenOptions={buildStackScreenOptions(theme)}>
      <ManageStack.Screen name="CustomerManage" component={CustomerManageScreen} options={{ title: 'Manage' }} />
      <ManageStack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      <ManageStack.Screen name="CustomerOrders" component={CustomerOrdersScreen} options={{ title: 'Orders' }} />
      <ManageStack.Screen name="Order" component={OrderScreen} options={{ title: 'Checkout' }} />
      <ManageStack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ title: 'Track Orders' }}
      />
      <ManageStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Support Chat' }} />
    </ManageStack.Navigator>
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
        name="CustomerHomeTab"
        component={CustomerHomeStack}
        options={{
          title: 'Home',
          ...renderTabGlyph('storefront-outline'),
        }}
      />
      <Tab.Screen
        name="CustomerManageTab"
        component={CustomerManageStack}
        options={{
          title: 'Manage',
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
