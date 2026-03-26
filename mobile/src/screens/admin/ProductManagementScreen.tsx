import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { TextField } from '../../components/TextField';
import api from '../../services/api';
import { ApiEnvelope, Product } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency } from '../../utils/formatters';

const emptyForm = {
  id: '',
  name: '',
  price: '',
  category: '',
  stock: '',
};

const ProductManagementScreen = () => {
  const styles = useThemedStyles(createStyles);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const submitForm = async () => {
    try {
      setSubmitting(true);
      setError('');

      const payload = {
        name: form.name,
        price: Number(form.price),
        category: form.category,
        stock: Number(form.stock),
      };

      if (form.id) {
        await api.put(`/products/${form.id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setForm(emptyForm);
      await loadProducts();
    } catch (submitError) {
      setError(extractErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      setError('');
      await api.delete(`/products/${productId}`);
      await loadProducts();
    } catch (deleteError) {
      setError(extractErrorMessage(deleteError));
    }
  };

  return (
    <ScreenLayout title="Product Catalog" subtitle="Create, update, and retire stock items without leaving mobile.">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>{form.id ? 'Edit Product' : 'Add Product'}</Text>
        <TextField label="Name" value={form.name} onChangeText={(value) => setForm({ ...form, name: value })} />
        <TextField
          label="Price"
          value={form.price}
          keyboardType="numeric"
          onChangeText={(value) => setForm({ ...form, price: value })}
        />
        <TextField
          label="Category"
          value={form.category}
          onChangeText={(value) => setForm({ ...form, category: value })}
        />
        <TextField
          label="Stock"
          value={form.stock}
          keyboardType="numeric"
          onChangeText={(value) => setForm({ ...form, stock: value })}
        />
        <PrimaryButton label={form.id ? 'Update Product' : 'Create Product'} onPress={submitForm} loading={submitting} />
        {form.id ? <PrimaryButton label="Cancel Edit" variant="outline" onPress={() => setForm(emptyForm)} /> : null}
      </Card>
      {products.length === 0 ? (
        <EmptyState title="No products yet" subtitle="Create a product to start accepting orders." />
      ) : (
        products.map((product) => (
          <Card key={product._id} style={styles.productCard}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productMeta}>
              {formatCurrency(product.price)} • {product.category}
            </Text>
            <Text style={styles.productMeta}>Stock: {product.stock}</Text>
            <View style={styles.actionRow}>
              <PrimaryButton
                label="Edit"
                variant="ghost"
                onPress={() =>
                  setForm({
                    id: product._id,
                    name: product.name,
                    price: String(product.price),
                    category: product.category,
                    stock: String(product.stock),
                  })
                }
              />
              <PrimaryButton label="Delete" variant="outline" onPress={() => deleteProduct(product._id)} />
            </View>
          </Card>
        ))
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    error: {
      color: theme.colors.danger,
    },
    formCard: {
      gap: theme.spacing.sm,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    productCard: {
      gap: 8,
    },
    productName: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    productMeta: {
      color: theme.colors.textMuted,
    },
    actionRow: {
      gap: 10,
      marginTop: 6,
    },
  });

export default ProductManagementScreen;
