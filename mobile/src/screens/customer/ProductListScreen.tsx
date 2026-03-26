import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ScreenLayout } from '../../components/ScreenLayout';
import api from '../../services/api';
import { useCart } from '../../store/CartContext';
import { ApiEnvelope, Product } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency } from '../../utils/formatters';

const ProductListScreen = () => {
  const styles = useThemedStyles(createStyles);
  const { addToCart, items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    try {
      setError('');
      const response = await api.get<ApiEnvelope<Product[]>>('/products');
      setProducts(response.data.data);
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const featuredItems = products.slice(0, 2);
  const remainingItems = products.slice(2);

  return (
    <ScreenLayout
      flushTop
      title="Storefront"
      subtitle="Featured stock on top, full catalog below, and instant cart updates with live logistics visibility."
    >
      <Card style={styles.heroCard}>
        <Text style={styles.heroTitle}>Ready to order</Text>
        <Text style={styles.heroMeta}>
          Browse fast-moving stock, add items with one tap, and use the Manage tab for checkout and tracking.
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStatChip}>
            <Text style={styles.heroStatValue}>{products.length}</Text>
            <Text style={styles.heroStatLabel}>Products</Text>
          </View>
          <View style={styles.heroStatChip}>
            <Text style={styles.heroStatValue}>{items.length}</Text>
            <Text style={styles.heroStatLabel}>In Cart</Text>
          </View>
        </View>
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {products.length === 0 ? (
        <EmptyState title="No products available" subtitle="Admins can publish products from the management console." />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Featured Items</Text>
          {featuredItems.map((product) => (
            <Card key={product._id} style={styles.featuredCard}>
              <View style={styles.productTopRow}>
                <Text style={styles.categoryPill}>{product.category}</Text>
                <Text style={styles.stockPill}>Stock {product.stock}</Text>
              </View>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productMeta}>Best mover for fast dispatch and repeat orders.</Text>
              <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
              <Pressable onPress={() => addToCart(product)} style={styles.addButton}>
                <Text style={styles.addButtonText}>Add to Cart</Text>
              </Pressable>
            </Card>
          ))}
          <Text style={styles.sectionTitle}>Catalog</Text>
          <View style={styles.gridWrap}>
            {(remainingItems.length ? remainingItems : featuredItems).map((item) => (
              <Card key={item._id} style={styles.gridCard}>
                <Text style={styles.categoryPill}>{item.category}</Text>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                <Text style={styles.productMeta}>Stock {item.stock}</Text>
                <Pressable onPress={() => addToCart(item)} style={styles.addInlineButton}>
                  <Text style={styles.addInlineText}>Add</Text>
                </Pressable>
              </Card>
            ))}
          </View>
        </>
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    heroCard: {
      gap: 10,
      backgroundColor: theme.colors.surfaceRaised,
    },
    heroTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 24,
      fontWeight: '700',
    },
    heroMeta: {
      color: theme.colors.textMuted,
      lineHeight: 22,
    },
    heroStats: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    heroStatChip: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flex: 1,
      gap: 4,
      padding: theme.spacing.md,
    },
    heroStatValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 20,
      fontWeight: '700',
    },
    heroStatLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    error: {
      color: theme.colors.danger,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    featuredCard: {
      gap: 10,
      backgroundColor: theme.colors.surfaceRaised,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: theme.isDark ? 0.18 : 0.08,
      shadowRadius: 18,
    },
    gridWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    gridCard: {
      gap: 8,
      backgroundColor: theme.colors.surfaceRaised,
      minWidth: '47%',
      width: '47%',
    },
    productTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    categoryPill: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      color: theme.colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.5,
      overflow: 'hidden',
      paddingHorizontal: 10,
      paddingVertical: 6,
      textTransform: 'uppercase',
    },
    stockPill: {
      color: theme.colors.accentSecondary,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    productName: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 20,
      fontWeight: '700',
    },
    productMeta: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    productPrice: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    addButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.sm,
      justifyContent: 'center',
      marginTop: 4,
      minHeight: 42,
      paddingHorizontal: theme.spacing.md,
    },
    addButtonText: {
      color: theme.colors.textOnAccent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    addInlineButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.accentMuted,
      borderRadius: theme.radius.sm,
      justifyContent: 'center',
      marginTop: 2,
      minHeight: 36,
      paddingHorizontal: 12,
    },
    addInlineText: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
  });

export default ProductListScreen;
