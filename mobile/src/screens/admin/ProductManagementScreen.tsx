import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { ProductThumbnail } from '../../components/ProductThumbnail';
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
  description: '',
  imageUrl: '',
  stock: '',
};

const ProductManagementScreen = () => {
  const styles = useThemedStyles(createStyles);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const submitForm = async () => {
    try {
      setSubmitting(true);
      setError('');

      const payload = {
        name: form.name,
        price: Number(form.price),
        category: form.category,
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
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

  if (loading) {
    return <LoadingOverlay label="Loading products" />;
  }

  return (
    <ScreenLayout title="Product Catalog" subtitle="Create, update, and retire stock items without leaving mobile.">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>{form.id ? 'Edit Product' : 'Add Product'}</Text>
        <Text style={styles.helperText}>
          Use your own photos, supplier media, or copyright-free images only. Leave image blank to use the built-in material thumbnail.
        </Text>
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
          hint="Optional. Helps buyers understand the product faster."
          label="Description"
          multiline
          onChangeText={(value) => setForm({ ...form, description: value })}
          style={styles.descriptionInput}
          textAlignVertical="top"
          value={form.description}
        />
        <TextField
          hint="Optional. Paste a direct image URL from a trusted, copyright-safe source."
          label="Image URL"
          onChangeText={(value) => setForm({ ...form, imageUrl: value })}
          placeholder="https://example.com/product.jpg"
          value={form.imageUrl}
        />
        <TextField
          label="Stock"
          value={form.stock}
          keyboardType="numeric"
          onChangeText={(value) => setForm({ ...form, stock: value })}
        />
        <View style={styles.previewCard}>
          <ProductThumbnail
            category={form.category}
            height={160}
            imageUrl={form.imageUrl}
            name={form.name || 'Product preview'}
          />
        </View>
        <PrimaryButton label={form.id ? 'Update Product' : 'Create Product'} onPress={submitForm} loading={submitting} />
        {form.id ? <PrimaryButton label="Cancel Edit" variant="outline" onPress={() => setForm(emptyForm)} /> : null}
      </Card>
      {products.length === 0 ? (
        <EmptyState title="No products yet" subtitle="Create a product to start accepting orders." />
      ) : (
        products.map((product) => (
          <Card key={product._id} style={styles.productCard}>
            <ProductThumbnail
              category={product.category}
              height={144}
              imageUrl={product.imageUrl}
              name={product.name}
            />
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productMeta}>
              {formatCurrency(product.price)} • {product.category}
            </Text>
            {product.description ? <Text style={styles.productDescription}>{product.description}</Text> : null}
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
                    description: product.description || '',
                    imageUrl: product.imageUrl || '',
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
    helperText: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    descriptionInput: {
      minHeight: 96,
      paddingTop: 12,
    },
    previewCard: {
      minHeight: 160,
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
    productDescription: {
      color: theme.colors.text,
      lineHeight: 20,
    },
    actionRow: {
      gap: 10,
      marginTop: 6,
    },
  });

export default ProductManagementScreen;
