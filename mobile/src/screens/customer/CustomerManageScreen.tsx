import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ActionTile } from '../../components/ActionTile';
import { Card } from '../../components/Card';
import { ScreenLayout } from '../../components/ScreenLayout';
import { useCart } from '../../store/CartContext';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';

const CustomerManageScreen = ({ navigation }: { navigation: any }) => {
  const { items } = useCart();
  const styles = useThemedStyles(createStyles);

  return (
    <ScreenLayout title="Manage Orders" subtitle="Everything after browsing: cart, orders, live tracking, and support.">
      <Card style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Order desk</Text>
        <Text style={styles.heroTitle}>
          {items.length ? `${items.length} items waiting for checkout.` : 'Your order flow starts here.'}
        </Text>
        <Text style={styles.heroMeta}>
          Review the cart, place the order, track live movement, and message support without leaving the app.
        </Text>
      </Card>
      <ActionTile
        title="Cart"
        subtitle="Review quantities and move to checkout."
        badge={`${items.length} items`}
        iconName="cart-outline"
        onPress={() => navigation.navigate('Cart')}
      />
      <ActionTile
        title="Orders"
        subtitle="View all orders placed by your account."
        iconName="receipt-outline"
        onPress={() => navigation.navigate('CustomerOrders')}
      />
      <ActionTile
        title="Order Tracking"
        subtitle="Monitor live status and worker movement."
        iconName="locate-outline"
        badge="Live"
        accentColor="#19A463"
        onPress={() => navigation.navigate('OrderTracking')}
      />
      <ActionTile
        title="Support Chat"
        subtitle="Contact the admin team directly."
        iconName="chatbubble-ellipses-outline"
        onPress={() => navigation.navigate('Chat')}
      />
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    heroCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 8,
    },
    heroEyebrow: {
      color: theme.colors.textMuted,
      fontSize: 12,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    heroTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 30,
    },
    heroMeta: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
  });

export default CustomerManageScreen;
