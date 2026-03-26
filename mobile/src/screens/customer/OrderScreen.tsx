import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { TextField } from '../../components/TextField';
import api from '../../services/api';
import { getCurrentLocation, requestLocationPermission } from '../../services/location';
import { useCart } from '../../store/CartContext';
import { ApiEnvelope, LocationPoint, Order } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency } from '../../utils/formatters';

const OrderScreen = ({ navigation }: { navigation: any }) => {
  const styles = useThemedStyles(createStyles);
  const { items, totalAmount, clearCart } = useCart();
  const [notes, setNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<LocationPoint | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const captureCurrentLocation = async () => {
    try {
      setError('');
      const granted = await requestLocationPermission();

      if (!granted) {
        setError('Location permission is required for live delivery tracking.');
        return;
      }

      const location = await getCurrentLocation();
      setDeliveryLocation(location);
    } catch (locationError) {
      setError(extractErrorMessage(locationError));
    }
  };

  const placeOrder = async () => {
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setSubmitting(true);

    try {
      setError('');
      const response = await api.post<ApiEnvelope<Order>>('/orders', {
        items: items.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
        })),
        notes,
        deliveryAddress,
        deliveryLocation,
      });

      clearCart();
      navigation.replace('OrderTracking', {
        orderId: response.data.data._id,
      });
    } catch (orderError) {
      setError(extractErrorMessage(orderError));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <ScreenLayout title="Checkout" subtitle="No cart items available right now.">
        <EmptyState title="Nothing to order" subtitle="Go back to the storefront and add products first." />
        <PrimaryButton label="Browse Products" onPress={() => navigation.navigate('Products')} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Checkout" subtitle="Confirm the drop point and dispatch instructions before placing the order.">
      <Text style={styles.total}>Total payable: {formatCurrency(totalAmount)}</Text>
      <TextField
        label="Delivery Address"
        value={deliveryAddress}
        onChangeText={setDeliveryAddress}
        placeholder="Shop or drop location"
      />
      <TextField
        label="Order Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        style={styles.notes}
      />
      <PrimaryButton label="Use My Current Location" variant="outline" onPress={captureCurrentLocation} />
      {deliveryLocation ? (
        <Text style={styles.locationText}>
          GPS: {deliveryLocation.latitude.toFixed(5)}, {deliveryLocation.longitude.toFixed(5)}
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Place Order" onPress={placeOrder} loading={submitting} />
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    total: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 22,
      fontWeight: '700',
    },
    notes: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    locationText: {
      color: theme.colors.textMuted,
    },
    error: {
      color: theme.colors.danger,
    },
  });

export default OrderScreen;
