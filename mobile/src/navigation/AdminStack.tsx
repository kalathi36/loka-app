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
const HomeStack = createStackNavigator();
const ManageStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const AdminHomeStack = () => {
  const { theme } = useAppTheme();

  return (
    <HomeStack.Navigator screenOptions={buildStackScreenOptions(theme)}>
      <HomeStack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Loka Admin' }} />
    </HomeStack.Navigator>
  );
};

const AdminManageStack = () => {
  const { theme } = useAppTheme();

  return (
    <ManageStack.Navigator screenOptions={buildStackScreenOptions(theme)}>
      <ManageStack.Screen name="AdminManage" component={AdminManageScreen} options={{ title: 'Manage' }} />
      <ManageStack.Screen name="Orders" component={OrdersScreen} options={{ title: 'All Orders' }} />
      <ManageStack.Screen name="AssignWorker" component={AssignWorkerScreen} options={{ title: 'Assign Worker' }} />
      <ManageStack.Screen
        name="ProductManagement"
        component={ProductManagementScreen}
        options={{ title: 'Products' }}
      />
      <ManageStack.Screen
        name="WorkerManagement"
        component={WorkerManagementScreen}
        options={{ title: 'Workers' }}
      />
      <ManageStack.Screen
        name="AttendanceManagement"
        component={AttendanceManagementScreen}
        options={{ title: 'Attendance' }}
      />
      <ManageStack.Screen name="Payments" component={PaymentsScreen} options={{ title: 'Payments' }} />
      <ManageStack.Screen name="CustomerList" component={CustomerListScreen} options={{ title: 'Customers' }} />
      <ManageStack.Screen name="MapTracking" component={MapTrackingScreen} options={{ title: 'Live Tracking' }} />
      <ManageStack.Screen name="AdminChat" component={AdminChatScreen} options={{ title: 'Support Chat' }} />
    </ManageStack.Navigator>
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
        name="AdminHomeTab"
        component={AdminHomeStack}
        options={{
          title: 'Home',
          ...renderTabGlyph('stats-chart-outline'),
        }}
      />
      <Tab.Screen
        name="AdminManageTab"
        component={AdminManageStack}
        options={{
          title: 'Manage',
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
