import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useCart } from '../../store/CartContext';
import { ApiEnvelope, Product } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency } from '../../utils/formatters';

const ProductListScreen = ({ navigation }: { navigation: any }) => {
  const { user, logout } = useAuth();
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
    const unsubscribe = navigation.addListener('focus', () => {
      loadProducts();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <ScreenLayout
      title={user?.organization?.name || 'Customer Orders'}
      subtitle="Browse available stock, build a cart, and track every dispatch from the same app."
      rightAction={<PrimaryButton label="Logout" variant="ghost" onPress={logout} />}
    >
      <Card style={styles.heroCard}>
        <Text style={styles.heroTitle}>Loka Storefront</Text>
        <Text style={styles.heroMeta}>Instant ordering with live logistics visibility and direct support chat.</Text>
        <View style={styles.heroActions}>
          <PrimaryButton label={`Cart (${items.length})`} onPress={() => navigation.navigate('Cart')} />
          <PrimaryButton label="Track" variant="ghost" onPress={() => navigation.navigate('OrderTracking')} />
          <PrimaryButton label="Chat" variant="outline" onPress={() => navigation.navigate('Chat')} />
        </View>
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {products.length === 0 ? (
        <EmptyState title="No products available" subtitle="Admins can publish products from the management console." />
      ) : (
        products.map((product) => (
          <Card key={product._id} style={styles.productCard}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productMeta}>{product.category}</Text>
            <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
            <Text style={styles.productMeta}>In stock: {product.stock}</Text>
            <PrimaryButton label="Add to Cart" onPress={() => addToCart(product)} disabled={product.stock < 1} />
          </Card>
        ))
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    heroCard: {
      gap: 10,
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
    heroActions: {
      gap: 10,
      marginTop: 8,
    },
    error: {
      color: theme.colors.danger,
    },
    productCard: {
      gap: 8,
    },
    productName: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 20,
      fontWeight: '700',
    },
    productMeta: {
      color: theme.colors.textMuted,
    },
    productPrice: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
  });

export default ProductListScreen;
