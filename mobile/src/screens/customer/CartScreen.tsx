import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { useCart } from '../../store/CartContext';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { formatCurrency } from '../../utils/formatters';

const CartScreen = ({ navigation }: { navigation: any }) => {
  const styles = useThemedStyles(createStyles);
  const { items, totalAmount, updateQuantity, removeFromCart } = useCart();

  return (
    <ScreenLayout title="Your Cart" subtitle="Review quantities before sending the order to dispatch.">
      <Card style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Checkout queue</Text>
        <Text style={styles.heroTitle}>
          {items.length ? `${items.length} products ready for dispatch.` : 'Your cart is waiting.'}
        </Text>
        <Text style={styles.heroMeta}>Keep the cart lean, then move straight into order placement.</Text>
      </Card>
      {items.length === 0 ? (
        <EmptyState title="Cart is empty" subtitle="Add products from the storefront to place an order." />
      ) : (
        items.map((item) => (
          <Card key={item._id} style={styles.card}>
            <View style={styles.itemHeader}>
              <View style={styles.itemCopy}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {formatCurrency(item.price)} each • Qty {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
            <View style={styles.actions}>
              <PrimaryButton
                label="-"
                variant="outline"
                onPress={() => updateQuantity(item._id, item.quantity - 1)}
              />
              <PrimaryButton
                label="+"
                variant="ghost"
                onPress={() => updateQuantity(item._id, item.quantity + 1)}
              />
              <PrimaryButton label="Remove" variant="outline" onPress={() => removeFromCart(item._id)} />
            </View>
          </Card>
        ))
      )}
      <Card style={styles.summary}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
        <PrimaryButton label="Proceed to Order" onPress={() => navigation.navigate('Order')} disabled={items.length === 0} />
      </Card>
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
    card: {
      gap: 8,
      backgroundColor: theme.colors.surfaceRaised,
    },
    itemHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.sm,
      justifyContent: 'space-between',
    },
    itemCopy: {
      flex: 1,
      gap: 4,
    },
    name: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    meta: {
      color: theme.colors.textMuted,
    },
    itemTotal: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
      marginTop: 2,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
    },
    summary: {
      gap: 10,
      backgroundColor: theme.colors.surfaceRaised,
    },
    totalLabel: {
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    totalValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 28,
      fontWeight: '700',
    },
  });

export default CartScreen;
