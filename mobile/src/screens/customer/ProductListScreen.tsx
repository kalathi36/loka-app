import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { AppIcon } from '../../components/AppIcon';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ProductThumbnail } from '../../components/ProductThumbnail';
import { QuantityStepper } from '../../components/QuantityStepper';
import { ScreenLayout } from '../../components/ScreenLayout';
import { SkeletonBlock } from '../../components/SkeletonBlock';
import api from '../../services/api';
import { useCart } from '../../store/CartContext';
import { ApiEnvelope, Product } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency } from '../../utils/formatters';

const SORT_OPTIONS = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'priceLow', label: 'Price Low' },
  { key: 'priceHigh', label: 'Price High' },
  { key: 'stock', label: 'Best Stock' },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]['key'];

const ProductListSkeleton = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.skeletonShell}>
      <SkeletonBlock height={132} radius={22} />
      <SkeletonBlock height={52} radius={18} />
      <SkeletonBlock height={112} radius={20} />
      <SkeletonBlock height={236} radius={22} />
      <SkeletonBlock height={236} radius={22} />
    </View>
  );
};

const ProductListScreen = ({ navigation }: { navigation: any }) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const { addToCart, getItemQuantity, itemCount, items, updateQuantity } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('recommended');
  const singleColumnCatalog = width < 430;

  const openCart = () => {
    navigation.getParent()?.navigate('CustomerCartTab', {
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

  const categories = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(products.map((product) => product.category).filter(Boolean)),
      ).sort((left, right) => left.localeCompare(right)),
    ],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const visibleProducts = products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.category, product.description || '']
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;

      return matchesQuery && matchesCategory;
    });

    return [...visibleProducts].sort((left, right) => {
      if (sortKey === 'priceLow') {
        return left.price - right.price;
      }

      if (sortKey === 'priceHigh') {
        return right.price - left.price;
      }

      if (sortKey === 'stock') {
        return right.stock - left.stock || left.price - right.price;
      }

      const leftAvailability = left.stock > 0 ? 1 : 0;
      const rightAvailability = right.stock > 0 ? 1 : 0;

      if (leftAvailability !== rightAvailability) {
        return rightAvailability - leftAvailability;
      }

      return right.stock - left.stock || left.price - right.price;
    });
  }, [products, query, selectedCategory, sortKey]);

  const featuredItems = filteredProducts.slice(0, 2);
  const catalogItems = filteredProducts.slice(2);
  const totalUnitsInCart = items.reduce((sum, item) => sum + item.quantity, 0);
  const availableProducts = products.filter((product) => product.stock > 0).length;
  const lowStockProducts = products.filter((product) => product.stock > 0 && product.stock <= 5).length;
  const categoryCount = Math.max(categories.length - 1, 0);

  const renderProductAction = (product: Product, compact = false) => {
    const quantity = getItemQuantity(product._id);
    const soldOut = product.stock <= 0;

    if (quantity > 0) {
      return (
        <View style={styles.actionCluster}>
          <QuantityStepper
            compact
            disableDecrement={quantity <= 0}
            disableIncrement={quantity >= product.stock}
            onDecrement={() => updateQuantity(product._id, quantity - 1)}
            onIncrement={() => updateQuantity(product._id, quantity + 1)}
            value={quantity}
          />
          <Text style={styles.cartHint}>
            {quantity} in cart{quantity >= product.stock ? ' • max reached' : ''}
          </Text>
        </View>
      );
    }

    return (
      <Pressable
        disabled={soldOut}
        onPress={() => addToCart(product)}
        style={[
          compact ? styles.addInlineButton : styles.addButton,
          soldOut ? styles.buttonDisabled : null,
        ]}
      >
        <Text style={compact ? styles.addInlineText : styles.addButtonText}>
          {soldOut ? 'Sold out' : 'Add to cart'}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScreenLayout contentStyle={styles.content} flushTop>
      <Card style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Live inventory</Text>
            <Text style={styles.heroTitle}>Dispatch-ready stock</Text>
            <Text style={styles.heroMeta}>
              {availableProducts} ready across {categoryCount} categor{categoryCount === 1 ? 'y' : 'ies'}.
            </Text>
          </View>
          <Pressable onPress={openCart} style={styles.cartButton}>
            <AppIcon color={theme.colors.textOnAccent} name="bag-handle-outline" size={18} />
            <Text style={styles.cartButtonCount}>{itemCount}</Text>
            <Text style={styles.cartButtonLabel}>View cart</Text>
          </Pressable>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStatChip}>
            <Text style={styles.heroStatValue}>{availableProducts}</Text>
            <Text style={styles.heroStatLabel}>Available</Text>
          </View>
          <View style={styles.heroStatChip}>
            <Text style={styles.heroStatValue}>{categoryCount}</Text>
            <Text style={styles.heroStatLabel}>Categories</Text>
          </View>
          <View style={styles.heroStatChip}>
            <Text style={styles.heroStatValue}>{totalUnitsInCart}</Text>
            <Text style={styles.heroStatLabel}>Queued</Text>
          </View>
        </View>

        <View style={styles.heroStrip}>
          <Text style={styles.heroStripText}>
            {lowStockProducts
              ? `${lowStockProducts} low-stock item${lowStockProducts === 1 ? '' : 's'} need quick checkout.`
              : 'All visible products currently have healthy stock coverage.'}
          </Text>
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

      <Card style={styles.discoveryCard}>
        <View style={styles.discoveryHeader}>
          <Text style={styles.discoveryTitle}>Browse by category</Text>
          <Text style={styles.discoveryCount}>{filteredProducts.length} results</Text>
        </View>
        <View style={styles.filterWrap}>
          {categories.map((category) => {
            const active = category === selectedCategory;

            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
              >
                <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.discoveryTitle}>Sort results</Text>
        <View style={styles.filterWrap}>
          {SORT_OPTIONS.map((option) => {
            const active = option.key === sortKey;

            return (
              <Pressable
                key={option.key}
                onPress={() => setSortKey(option.key)}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
              >
                <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ProductListSkeleton />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title={products.length === 0 ? 'No products available' : 'No matching products'}
          subtitle={
            products.length === 0
              ? 'Admins can publish products from the management console.'
              : 'Try a different search, category, or sort combination.'
          }
        />
      ) : (
        <>
          {featuredItems.length ? <Text style={styles.sectionTitle}>Featured</Text> : null}
          {featuredItems.map((product) => {
            const soldOut = product.stock <= 0;
            const lowStock = product.stock > 0 && product.stock <= 5;

            return (
              <Card key={product._id} style={styles.featuredCard}>
                <ProductThumbnail
                  category={product.category}
                  height={136}
                  imageUrl={product.imageUrl}
                  name={product.name}
                />
                <View style={styles.productBody}>
                  <View style={styles.productTopRow}>
                    <Text style={styles.categoryPill}>{product.category}</Text>
                    <Text
                      style={[
                        styles.stockPill,
                        soldOut ? styles.stockPillSoldOut : null,
                        lowStock ? styles.stockPillLow : null,
                      ]}
                    >
                      {soldOut ? 'Sold out' : lowStock ? `Only ${product.stock} left` : `${product.stock} in stock`}
                    </Text>
                  </View>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text numberOfLines={2} style={styles.productMeta}>
                    {product.description || 'Live stock for recurring orders and fast local dispatch.'}
                  </Text>
                  <View style={styles.productFooter}>
                    <View style={styles.priceBlock}>
                      <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
                      <Text style={styles.priceMeta}>Route-ready packing included</Text>
                    </View>
                    {renderProductAction(product)}
                  </View>
                </View>
              </Card>
            );
          })}

          {catalogItems.length ? <Text style={styles.sectionTitle}>Catalog</Text> : null}
          {catalogItems.length ? (
            <View style={styles.gridWrap}>
              {catalogItems.map((item) => {
                const soldOut = item.stock <= 0;
                const lowStock = item.stock > 0 && item.stock <= 5;

                return (
                  <Card
                    key={item._id}
                    style={[
                      styles.gridCard,
                      singleColumnCatalog ? styles.gridCardFull : null,
                    ]}
                  >
                    <ProductThumbnail
                      category={item.category}
                      height={132}
                      imageUrl={item.imageUrl}
                      name={item.name}
                    />
                    <View style={styles.gridTagRow}>
                      <Text style={styles.categoryPill}>{item.category}</Text>
                      <Text
                        style={[
                          styles.gridStockText,
                          soldOut ? styles.gridStockTextSoldOut : null,
                          lowStock ? styles.gridStockTextLow : null,
                        ]}
                      >
                        {soldOut ? 'Sold out' : lowStock ? `${item.stock} left` : `${item.stock} ready`}
                      </Text>
                    </View>
                    <Text numberOfLines={2} style={styles.gridProductName}>
                      {item.name}
                    </Text>
                    <Text numberOfLines={2} style={styles.productMeta}>
                      {item.description || 'Live stock visible for dispatch planning.'}
                    </Text>
                    <View style={styles.catalogFooter}>
                      <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                      {renderProductAction(item, true)}
                    </View>
                  </Card>
                );
              })}
            </View>
          ) : null}
        </>
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    actionCluster: {
      alignItems: 'flex-start',
      gap: 6,
    },
    addButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.sm,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: theme.spacing.md,
    },
    addButtonText: {
      color: theme.colors.textOnAccent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    addInlineButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.accentMuted,
      borderRadius: theme.radius.sm,
      justifyContent: 'center',
      minHeight: 34,
      paddingHorizontal: 12,
    },
    addInlineText: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    cartButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      gap: 2,
      justifyContent: 'center',
      minWidth: 92,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    cartButtonCount: {
      color: theme.colors.textOnAccent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 20,
      fontWeight: '700',
    },
    cartButtonLabel: {
      color: theme.colors.textOnAccent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    cartHint: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    catalogFooter: {
      alignItems: 'flex-start',
      gap: 10,
      marginTop: 'auto',
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
    content: {
      paddingBottom: 110,
    },
    discoveryCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 12,
    },
    discoveryCount: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
    discoveryHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    discoveryTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 15,
      fontWeight: '700',
    },
    error: {
      color: theme.colors.danger,
    },
    featuredCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 10,
      overflow: 'hidden',
      padding: 0,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: theme.isDark ? 0.16 : 0.08,
      shadowRadius: 16,
    },
    filterChip: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: 14,
    },
    filterChipActive: {
      backgroundColor: theme.colors.accentMuted,
      borderColor: theme.colors.accent,
    },
    filterChipText: {
      color: theme.colors.textMuted,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    filterChipTextActive: {
      color: theme.colors.accent,
    },
    filterWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    gridCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 10,
      minHeight: 282,
      padding: theme.spacing.sm,
      width: '47%',
    },
    gridCardFull: {
      width: '100%',
    },
    gridProductName: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    gridStockText: {
      color: theme.colors.accentSecondary,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    gridStockTextLow: {
      color: theme.colors.warning,
    },
    gridStockTextSoldOut: {
      color: theme.colors.danger,
    },
    gridTagRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
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
    heroStatChip: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flexGrow: 1,
      gap: 2,
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
    heroStrip: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 12,
    },
    heroStripText: {
      color: theme.colors.textMuted,
      lineHeight: 20,
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
      gap: theme.spacing.sm,
    },
    priceBlock: {
      gap: 2,
    },
    priceMeta: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    productBody: {
      gap: 10,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    productFooter: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
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
      fontSize: 20,
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
    stockPillLow: {
      color: theme.colors.warning,
    },
    stockPillSoldOut: {
      color: theme.colors.danger,
    },
  });

export default ProductListScreen;
