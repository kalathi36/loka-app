import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DimensionValue, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ProductThumbnail } from '../../components/ProductThumbnail';
import { ScreenLayout } from '../../components/ScreenLayout';
import { SkeletonBlock } from '../../components/SkeletonBlock';
import { StatCard } from '../../components/StatCard';
import api, { getApiErrorStatus } from '../../services/api';
import {
  ApiEnvelope,
  ProductCategoryInsight,
  ProductInsights,
  ProductInventoryInsight,
  ProductSalesInsight,
} from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency } from '../../utils/formatters';

const emptyInsights: ProductInsights = {
  summary: {
    totalProducts: 0,
    totalCategories: 0,
    totalUnitsInStock: 0,
    inventoryValue: 0,
    averagePrice: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalUnitsSold: 0,
    orderedValue: 0,
  },
  categoryBreakdown: [],
  topSelling: [],
  lowStockProducts: [],
  newestProducts: [],
};

const ProductInsightsSkeleton = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.skeletonShell}>
      <View style={styles.grid}>
        <SkeletonBlock height={118} radius={24} style={styles.gridItem} />
        <SkeletonBlock height={118} radius={24} style={styles.gridItem} />
      </View>
      <View style={styles.grid}>
        <SkeletonBlock height={118} radius={24} style={styles.gridItem} />
        <SkeletonBlock height={118} radius={24} style={styles.gridItem} />
      </View>
      <SkeletonBlock height={220} radius={24} />
      <SkeletonBlock height={260} radius={24} />
      <SkeletonBlock height={190} radius={24} />
    </View>
  );
};

const ProductInsightRow = ({
  product,
  meta,
}: {
  product: ProductSalesInsight | ProductInventoryInsight;
  meta: React.ReactNode;
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.productRow}>
      <View style={styles.productThumbWrap}>
        <ProductThumbnail
          category={product.category}
          height={64}
          imageUrl={'imageUrl' in product ? product.imageUrl : undefined}
          name={product.name}
        />
      </View>
      <View style={styles.productTextWrap}>
        <Text numberOfLines={1} style={styles.rowProductName}>
          {product.name}
        </Text>
        <Text numberOfLines={1} style={styles.rowProductMeta}>
          {product.category} • Stock {product.stock}
        </Text>
        {meta}
      </View>
    </View>
  );
};

const CategoryRow = ({
  category,
  maxUnits,
}: {
  category: ProductCategoryInsight;
  maxUnits: number;
}) => {
  const styles = useThemedStyles(createStyles);
  const fillWidth = `${Math.max(12, Math.round((category.stockUnits / maxUnits) * 100))}%` as DimensionValue;

  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryHeader}>
        <Text numberOfLines={1} style={styles.categoryName}>
          {category.category}
        </Text>
        <Text style={styles.categoryValue}>{formatCurrency(category.inventoryValue)}</Text>
      </View>
      <View style={styles.categoryBarTrack}>
        <View style={[styles.categoryBarFill, { width: fillWidth }]} />
      </View>
      <View style={styles.categoryMetaRow}>
        <Text style={styles.categoryMeta}>{category.productCount} products</Text>
        <Text style={styles.categoryMeta}>{category.stockUnits} units</Text>
        <Text style={styles.categoryMeta}>Avg {formatCurrency(category.averagePrice)}</Text>
      </View>
    </View>
  );
};

const ProductInsightsScreen = ({ navigation }: { navigation: any }) => {
  const styles = useThemedStyles(createStyles);
  const [insights, setInsights] = useState<ProductInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInsights = useCallback(async () => {
    try {
      setError('');
      const response = await api.get<ApiEnvelope<ProductInsights>>('/admin/product-insights');
      setInsights(response.data.data || emptyInsights);
    } catch (loadError) {
      if (getApiErrorStatus(loadError) === 404) {
        setError('The product insights API is not live on this backend yet. Redeploy the backend to enable this tab.');
      } else {
        setError(extractErrorMessage(loadError));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
    const unsubscribe = navigation.addListener('focus', loadInsights);

    return unsubscribe;
  }, [loadInsights, navigation]);

  const insightData = insights || emptyInsights;
  const maxCategoryUnits = useMemo(
    () => Math.max(...insightData.categoryBreakdown.map((entry) => entry.stockUnits), 1),
    [insightData.categoryBreakdown],
  );

  if (loading && !insights) {
    return (
      <ScreenLayout
        flushTop
        title="Product Insights"
        subtitle="Stock health, category mix, and sell-through signals for your live catalog."
      >
        <ProductInsightsSkeleton />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      flushTop
      title="Product Insights"
      subtitle="Stock health, category mix, and sell-through signals for your live catalog."
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.grid}>
        <StatCard
          helper="Published products"
          iconName="cube-outline"
          label="Products"
          value={insightData.summary.totalProducts}
        />
        <StatCard
          accent="#7CFF6B"
          helper="Catalog categories"
          iconName="albums-outline"
          label="Categories"
          value={insightData.summary.totalCategories}
        />
      </View>
      <View style={styles.grid}>
        <StatCard
          helper="Units currently on hand"
          iconName="layers-outline"
          label="Stock Units"
          value={insightData.summary.totalUnitsInStock}
        />
        <StatCard
          accent="#FFD166"
          helper="Stock x price"
          iconName="cash-outline"
          label="Inventory Value"
          value={formatCurrency(insightData.summary.inventoryValue)}
        />
      </View>
      <View style={styles.grid}>
        <StatCard
          helper="Units sold through orders"
          iconName="trending-up-outline"
          label="Units Sold"
          value={insightData.summary.totalUnitsSold}
        />
        <StatCard
          accent="#9C8CFF"
          helper="Ordered gross value"
          iconName="bar-chart-outline"
          label="Ordered Value"
          value={formatCurrency(insightData.summary.orderedValue)}
        />
      </View>
      <View style={styles.grid}>
        <StatCard
          helper="Need replenishment soon"
          iconName="alert-circle-outline"
          label="Low Stock"
          value={insightData.summary.lowStockCount}
        />
        <StatCard
          accent="#FF7A7A"
          helper="Unavailable products"
          iconName="close-circle-outline"
          label="Out of Stock"
          value={insightData.summary.outOfStockCount}
        />
      </View>

      {insightData.summary.totalProducts === 0 ? (
        <EmptyState
          title="No products to analyze"
          subtitle="Create products first and this tab will start surfacing stock and demand insights."
        />
      ) : (
        <>
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Category Mix</Text>
            <Text style={styles.sectionSubtitle}>
              Where inventory value and unit depth are concentrated right now.
            </Text>
            <View style={styles.sectionBody}>
              {insightData.categoryBreakdown.map((entry) => (
                <CategoryRow key={entry.category} category={entry} maxUnits={maxCategoryUnits} />
              ))}
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Top Movers</Text>
            <Text style={styles.sectionSubtitle}>Best-selling products across all orders.</Text>
            <View style={styles.sectionBody}>
              {insightData.topSelling.length === 0 ? (
                <Text style={styles.emptyCopy}>No sales signals yet. Orders will populate this section automatically.</Text>
              ) : (
                insightData.topSelling.map((item) => (
                  <ProductInsightRow
                    key={String(item.productId || item.name)}
                    meta={
                      <View style={styles.rowStatsWrap}>
                        <Text style={styles.rowStat}>{item.unitsSold} units sold</Text>
                        <Text style={styles.rowStat}>{item.orderCount} orders</Text>
                        <Text style={styles.rowStat}>{formatCurrency(item.revenue)}</Text>
                      </View>
                    }
                    product={item}
                  />
                ))
              )}
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Restock Watch</Text>
            <Text style={styles.sectionSubtitle}>Products that need attention before they block demand.</Text>
            <View style={styles.sectionBody}>
              {insightData.lowStockProducts.length === 0 ? (
                <Text style={styles.emptyCopy}>No low-stock items right now.</Text>
              ) : (
                insightData.lowStockProducts.map((item) => (
                  <ProductInsightRow
                    key={item._id}
                    meta={
                      <View style={styles.rowStatsWrap}>
                        <Text style={styles.rowStat}>{formatCurrency(item.price)}</Text>
                        <Text style={[styles.rowStat, item.stock === 0 ? styles.rowStatDanger : null]}>
                          {item.stock === 0 ? 'Out of stock' : `${item.stock} units left`}
                        </Text>
                      </View>
                    }
                    product={item}
                  />
                ))
              )}
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>New Catalog Additions</Text>
            <Text style={styles.sectionSubtitle}>The latest products added to the organization catalog.</Text>
            <View style={styles.sectionBody}>
              {insightData.newestProducts.map((item) => (
                <ProductInsightRow
                  key={item._id}
                  meta={
                    <View style={styles.rowStatsWrap}>
                      <Text style={styles.rowStat}>{formatCurrency(item.price)}</Text>
                      <Text style={styles.rowStat}>{item.stock} units</Text>
                    </View>
                  }
                  product={item}
                />
              ))}
            </View>
          </Card>
        </>
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    categoryBarFill: {
      backgroundColor: theme.colors.accent,
      borderRadius: 999,
      height: '100%',
    },
    categoryBarTrack: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: 999,
      height: 10,
      overflow: 'hidden',
    },
    categoryHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    categoryMeta: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    categoryMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    categoryName: {
      color: theme.colors.text,
      flex: 1,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
      paddingRight: 10,
    },
    categoryRow: {
      gap: 10,
    },
    categoryValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 13,
      fontWeight: '700',
    },
    emptyCopy: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    error: {
      color: theme.colors.danger,
    },
    grid: {
      gap: theme.spacing.sm,
      flexDirection: 'row',
    },
    gridItem: {
      flex: 1,
    },
    productRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    productTextWrap: {
      flex: 1,
      gap: 6,
    },
    productThumbWrap: {
      borderRadius: theme.radius.md,
      overflow: 'hidden',
      width: 64,
    },
    rowProductMeta: {
      color: theme.colors.textMuted,
      fontSize: 13,
    },
    rowProductName: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    rowStat: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    rowStatDanger: {
      color: theme.colors.danger,
      fontFamily: theme.fontFamily.heading,
      fontWeight: '700',
    },
    rowStatsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    sectionBody: {
      gap: theme.spacing.md,
    },
    sectionCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: theme.spacing.sm,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: theme.isDark ? 0.18 : 0.07,
      shadowRadius: 22,
    },
    sectionSubtitle: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 22,
      fontWeight: '700',
    },
    skeletonShell: {
      gap: theme.spacing.md,
    },
  });

export default ProductInsightsScreen;
