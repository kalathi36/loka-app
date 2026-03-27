import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppIcon } from '../../components/AppIcon';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { FloatingCartButton } from '../../components/FloatingCartButton';
import { ProductThumbnail } from '../../components/ProductThumbnail';
import { ScreenLayout } from '../../components/ScreenLayout';
import { SkeletonBlock } from '../../components/SkeletonBlock';
import api from '../../services/api';
import { useCart } from '../../store/CartContext';
import { ApiEnvelope, Product } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency } from '../../utils/formatters';

const ProductListSkeleton = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.skeletonShell}>
      <SkeletonBlock height={148} radius={24} />
      <SkeletonBlock height={52} radius={18} />
      <View style={styles.skeletonGrid}>
        <SkeletonBlock height={248} radius={22} style={styles.skeletonFeatured} />
        <SkeletonBlock height={248} radius={22} style={styles.skeletonFeatured} />
      </View>
      <View style={styles.skeletonGrid}>
        <SkeletonBlock height={200} radius={22} style={styles.skeletonCatalog} />
        <SkeletonBlock height={200} radius={22} style={styles.skeletonCatalog} />
      </View>
    </View>
  );
};

const ProductListScreen = ({ navigation }: { navigation: any }) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { addToCart, itemCount, items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const openCart = () => {
    navigation.getParent()?.navigate('CustomerManageTab', {
      screen: 'Cart',
    });
  };

  const loadProducts = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await api.get<ApiEnvelope<Product[]>>('/products');
      setProducts(response.data.data);
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.category, product.description || '']
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [products, query]);

  const featuredItems = filteredProducts.slice(0, 2);
  const remainingItems = filteredProducts.slice(2);

  return (
    <ScreenLayout
      contentStyle={styles.content}
      flushTop
      floatingAction={<FloatingCartButton count={itemCount} onPress={openCart} />}
      title="Storefront"
      subtitle="Featured stock on top, full catalog below, and instant cart updates with live logistics visibility."
    >
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroHeaderText}>
            <Text style={styles.heroTitle}>Ready to ship</Text>
            <Text style={styles.heroMeta}>
              Browse verified stock, see images, and jump straight to the cart when you are ready.
            </Text>
          </View>
          <View style={styles.heroCartBadge}>
            <Text style={styles.heroCartValue}>{itemCount}</Text>
            <Text style={styles.heroCartLabel}>In Cart</Text>
          </View>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStatChip}>
            <Text style={styles.heroStatValue}>{products.length}</Text>
            <Text style={styles.heroStatLabel}>Products</Text>
          </View>
          <View style={styles.heroStatChip}>
            <Text style={styles.heroStatValue}>{items.length}</Text>
            <Text style={styles.heroStatLabel}>Lines</Text>
          </View>
        </View>
      </Card>

      <View style={styles.searchShell}>
        <AppIcon color={theme.colors.textMuted} name="search-outline" size={18} />
        <TextInput
          onChangeText={setQuery}
          placeholder="Search by product, category, or description"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.searchInput}
          value={query}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ProductListSkeleton />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title={products.length === 0 ? 'No products available' : 'No matching products'}
          subtitle={
            products.length === 0
              ? 'Admins can publish products from the management console.'
              : 'Try a different search term or clear the filter.'
          }
        />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Featured Items</Text>
          {featuredItems.map((product) => (
            <Card key={product._id} style={styles.featuredCard}>
              <ProductThumbnail
                category={product.category}
                height={140}
                imageUrl={product.imageUrl}
                name={product.name}
              />
              <View style={styles.productBody}>
                <View style={styles.productTopRow}>
                  <Text style={styles.categoryPill}>{product.category}</Text>
                  <Text style={styles.stockPill}>Stock {product.stock}</Text>
                </View>
                <Text style={styles.productName}>{product.name}</Text>
                <Text numberOfLines={3} style={styles.productMeta}>
                  {product.description || 'Field-ready stock for recurring delivery routes and fast-moving orders.'}
                </Text>
                <View style={styles.productFooter}>
                  <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
                  <Pressable onPress={() => addToCart(product)} style={styles.addButton}>
                    <Text style={styles.addButtonText}>Add to Cart</Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          ))}
          <Text style={styles.sectionTitle}>Catalog</Text>
          <View style={styles.gridWrap}>
            {(remainingItems.length ? remainingItems : featuredItems).map((item) => (
              <Card key={item._id} style={styles.gridCard}>
                <ProductThumbnail
                  category={item.category}
                  height={138}
                  imageUrl={item.imageUrl}
                  name={item.name}
                />
                <Text style={styles.categoryPill}>{item.category}</Text>
                <Text numberOfLines={2} style={styles.gridProductName}>
                  {item.name}
                </Text>
                <Text numberOfLines={2} style={styles.productMeta}>
                  {item.description || `In stock: ${item.stock}`}
                </Text>
                <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
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
    addButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.sm,
      justifyContent: 'center',
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
      marginTop: 'auto',
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
    error: {
      color: theme.colors.danger,
    },
    content: {
      paddingBottom: 128,
    },
    featuredCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 12,
      overflow: 'hidden',
      padding: 0,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: theme.isDark ? 0.18 : 0.08,
      shadowRadius: 18,
    },
    gridCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 10,
      minHeight: 286,
      minWidth: '47%',
      padding: theme.spacing.sm,
      width: '47%',
    },
    gridProductName: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    gridWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    heroCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 12,
    },
    heroCartBadge: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      minWidth: 88,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    heroCartLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    heroCartValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 2,
    },
    heroHeader: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    heroHeaderText: {
      flex: 1,
      gap: 8,
    },
    heroMeta: {
      color: theme.colors.textMuted,
      lineHeight: 22,
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
    heroStatLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    heroStats: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    heroStatValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 20,
      fontWeight: '700',
    },
    heroTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 24,
      fontWeight: '700',
    },
    productBody: {
      gap: 10,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    productFooter: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    productMeta: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    productName: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 22,
      fontWeight: '700',
    },
    productPrice: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    productTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    searchInput: {
      color: theme.colors.text,
      flex: 1,
      fontFamily: theme.fontFamily.body,
      minHeight: 44,
      padding: 0,
    },
    searchShell: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flexDirection: 'row',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    skeletonCatalog: {
      flex: 1,
    },
    skeletonFeatured: {
      flex: 1,
    },
    skeletonGrid: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    skeletonShell: {
      gap: theme.spacing.md,
    },
    stockPill: {
      color: theme.colors.accentSecondary,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
  });

export default ProductListScreen;
