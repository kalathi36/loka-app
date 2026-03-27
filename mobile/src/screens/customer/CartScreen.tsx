import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ProductThumbnail } from '../../components/ProductThumbnail';
import { QuantityStepper } from '../../components/QuantityStepper';
import { ScreenLayout } from '../../components/ScreenLayout';
import { useCart } from '../../store/CartContext';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { formatCurrency } from '../../utils/formatters';

const CartScreen = ({ navigation }: { navigation: any }) => {
  const styles = useThemedStyles(createStyles);
  const { clearCart, itemCount, items, totalAmount, updateQuantity, removeFromCart } = useCart();
  const distinctItems = items.length;

  return (
    <ScreenLayout>
      <Card style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Cart summary</Text>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>
              {distinctItems ? `${itemCount} unit${itemCount === 1 ? '' : 's'} ready` : 'Your cart is waiting'}
            </Text>
            <Text style={styles.heroMeta}>
              {distinctItems
                ? `${distinctItems} product${distinctItems === 1 ? '' : 's'} staged for checkout.`
                : 'Add products from the storefront to start an order.'}
            </Text>
          </View>
          <Text style={styles.heroValue}>{formatCurrency(totalAmount)}</Text>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{distinctItems}</Text>
            <Text style={styles.heroStatLabel}>Products</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{itemCount}</Text>
            <Text style={styles.heroStatLabel}>Units</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>30m</Text>
            <Text style={styles.heroStatLabel}>Dispatch</Text>
          </View>
        </View>
      </Card>

      {items.length === 0 ? (
        <>
          <EmptyState title="Cart is empty" subtitle="Add products from the storefront to place an order." />
          <PrimaryButton
            label="Browse Products"
            onPress={() => navigation.getParent()?.navigate('CustomerShopTab')}
          />
        </>
      ) : (
        <>
          {items.map((item) => (
            <Card key={item._id} style={styles.card}>
              <View style={styles.itemHeader}>
                <ProductThumbnail
                  category={item.category}
                  height={80}
                  imageUrl={item.imageUrl}
                  name={item.name}
                  style={styles.thumbnail}
                />
                <View style={styles.itemCopy}>
                  <View style={styles.itemTopRow}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Pressable onPress={() => removeFromCart(item._id)} style={styles.removeChip}>
                      <Text style={styles.removeText}>Remove</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.meta}>{item.category}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.unitPrice}>{formatCurrency(item.price)} each</Text>
                    <Text style={styles.itemTotal}>{formatCurrency(item.price * item.quantity)}</Text>
                  </View>
                  <View style={styles.controlsRow}>
                    <QuantityStepper
                      compact
                      disableDecrement={item.quantity <= 1}
                      disableIncrement={item.quantity >= item.stock}
                      onDecrement={() => updateQuantity(item._id, item.quantity - 1)}
                      onIncrement={() => updateQuantity(item._id, item.quantity + 1)}
                      value={item.quantity}
                    />
                    <Text style={styles.stockMeta}>
                      {item.stock <= 5 ? `Only ${item.stock} left in stock.` : `${item.stock} units available.`}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          ))}

          <Card style={styles.summary}>
            <Text style={styles.summaryEyebrow}>Order summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Products</Text>
              <Text style={styles.summaryValue}>{distinctItems}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Units</Text>
              <Text style={styles.summaryValue}>{itemCount}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryValue}>Calculated at dispatch</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
            </View>
            <Text style={styles.summaryHint}>
              Final route and delivery confirmation happen on the next screen.
            </Text>
            <PrimaryButton label="Proceed to Order" onPress={() => navigation.navigate('Order')} />
            <View style={styles.footerActions}>
              <Pressable
                onPress={() => navigation.getParent()?.navigate('CustomerShopTab')}
                style={styles.secondaryAction}
              >
                <Text style={styles.secondaryActionText}>Continue shopping</Text>
              </Pressable>
              <Pressable onPress={clearCart} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>Clear cart</Text>
              </Pressable>
            </View>
          </Card>
        </>
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 8,
    },
    controlsRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 8,
    },
    footerActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    heroCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 10,
    },
    heroCopy: {
      flex: 1,
      gap: 4,
      paddingRight: theme.spacing.sm,
    },
    heroEyebrow: {
      color: theme.colors.textMuted,
      fontSize: 12,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    heroMeta: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    heroStat: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flexGrow: 1,
      gap: 4,
      minWidth: 92,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    heroStatLabel: {
      color: theme.colors.textMuted,
      fontSize: 10,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    heroStats: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    heroStatValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    heroTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 28,
    },
    heroTopRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    heroValue: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 22,
      fontWeight: '700',
      marginTop: 2,
    },
    itemCopy: {
      flex: 1,
      gap: 2,
    },
    itemHeader: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    itemTopRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.sm,
      justifyContent: 'space-between',
    },
    itemTotal: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
    },
    meta: {
      color: theme.colors.textMuted,
    },
    name: {
      color: theme.colors.text,
      flex: 1,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
      paddingRight: 4,
    },
    priceRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    removeChip: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    removeText: {
      color: theme.colors.textMuted,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    secondaryAction: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      minHeight: 46,
      paddingHorizontal: 12,
    },
    secondaryActionText: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    stockMeta: {
      color: theme.colors.textMuted,
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      minWidth: 120,
    },
    summary: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 10,
    },
    summaryEyebrow: {
      color: theme.colors.textMuted,
      fontSize: 12,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    summaryHint: {
      color: theme.colors.textMuted,
      lineHeight: 18,
      marginBottom: 4,
    },
    summaryLabel: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    summaryRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    summaryRowTotal: {
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      marginTop: 2,
      paddingTop: 12,
    },
    summaryValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontWeight: '700',
    },
    thumbnail: {
      width: 80,
    },
    totalLabel: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    totalValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 28,
      fontWeight: '700',
    },
    unitPrice: {
      color: theme.colors.textMuted,
    },
  });

export default CartScreen;
