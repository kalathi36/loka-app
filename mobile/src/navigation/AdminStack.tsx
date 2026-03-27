import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminChatScreen from '../screens/admin/AdminChatScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminManageScreen from '../screens/admin/AdminManageScreen';
import AssignWorkerScreen from '../screens/admin/AssignWorkerScreen';
import AttendanceManagementScreen from '../screens/admin/AttendanceManagementScreen';
import CustomerListScreen from '../screens/admin/CustomerListScreen';
import MapTrackingScreen from '../screens/admin/MapTrackingScreen';
import OrdersScreen from '../screens/admin/OrdersScreen';
import PaymentsScreen from '../screens/admin/PaymentsScreen';
import ProductInsightsScreen from '../screens/admin/ProductInsightsScreen';
import ProductManagementScreen from '../screens/admin/ProductManagementScreen';
import WorkerManagementScreen from '../screens/admin/WorkerManagementScreen';
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
const OverviewStack = createStackNavigator();
const OrdersStack = createStackNavigator();
const OpsStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const AdminOverviewStack = () => {
  const { theme } = useAppTheme();

  return (
    <OverviewStack.Navigator screenOptions={buildStackScreenOptions(theme)}>
      <OverviewStack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Overview' }} />
    </OverviewStack.Navigator>
  );
};

const AdminOrdersStack = () => {
  const { theme } = useAppTheme();

  return (
    <OrdersStack.Navigator screenOptions={buildStackScreenOptions(theme)}>
      <OrdersStack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
      <OrdersStack.Screen name="AssignWorker" component={AssignWorkerScreen} options={{ title: 'Assign Worker' }} />
      <OrdersStack.Screen
        name="MapTracking"
        component={MapTrackingScreen}
        options={{ title: 'Live Tracking' }}
      />
      <OrdersStack.Screen name="AdminChat" component={AdminChatScreen} options={{ title: 'Support' }} />
    </OrdersStack.Navigator>
  );
};

const AdminOpsStack = () => {
  const { theme } = useAppTheme();

  return (
    <OpsStack.Navigator screenOptions={buildStackScreenOptions(theme)}>
      <OpsStack.Screen name="AdminManage" component={AdminManageScreen} options={{ title: 'Operations' }} />
      <OpsStack.Screen
        name="ProductManagement"
        component={ProductManagementScreen}
        options={{ title: 'Products' }}
      />
      <OpsStack.Screen
        name="WorkerManagement"
        component={WorkerManagementScreen}
        options={{ title: 'Workers' }}
      />
      <OpsStack.Screen
        name="AttendanceManagement"
        component={AttendanceManagementScreen}
        options={{ title: 'Attendance' }}
      />
      <OpsStack.Screen name="Payments" component={PaymentsScreen} options={{ title: 'Payments' }} />
      <OpsStack.Screen name="CustomerList" component={CustomerListScreen} options={{ title: 'Customers' }} />
      <OpsStack.Screen name="MapTracking" component={MapTrackingScreen} options={{ title: 'Live Tracking' }} />
      <OpsStack.Screen name="AdminChat" component={AdminChatScreen} options={{ title: 'Support' }} />
      <OpsStack.Screen
        name="ProductInsights"
        component={ProductInsightsScreen}
        options={{ title: 'Insights' }}
      />
    </OpsStack.Navigator>
  );
};

const AdminProfileStack = () => {
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

const AdminStack = () => {
  const { theme } = useAppTheme();

  return (
    <Tab.Navigator screenOptions={buildTabScreenOptions(theme)}>
      <Tab.Screen
        name="AdminOverviewTab"
        component={AdminOverviewStack}
        options={{
          title: 'Overview',
          ...renderTabGlyph('stats-chart-outline'),
        }}
      />
      <Tab.Screen
        name="AdminOrdersTab"
        component={AdminOrdersStack}
        options={{
          title: 'Orders',
          ...renderTabGlyph('receipt-outline'),
        }}
      />
      <Tab.Screen
        name="AdminOpsTab"
        component={AdminOpsStack}
        options={{
          title: 'Ops',
          ...renderTabGlyph('layers-outline'),
        }}
      />
      <Tab.Screen
        name="AdminProfileTab"
        component={AdminProfileStack}
        options={{
          title: 'Profile',
          ...renderTabGlyph('person-circle-outline'),
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminStack;
