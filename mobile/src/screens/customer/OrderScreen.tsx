import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { TextField } from '../../components/TextField';
import api from '../../services/api';
import {
  getCurrentLocation,
  getLocationDetails,
  LocationDetails,
  requestLocationPermission,
} from '../../services/location';
import { showToast } from '../../services/toast';
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
  const [deliveryLocationDetails, setDeliveryLocationDetails] = useState<LocationDetails | null>(null);
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
      const details = await getLocationDetails(location, 'Drop point');
      setDeliveryLocationDetails(details);

      if (!deliveryAddress.trim()) {
        setDeliveryAddress(details.fullLabel);
      }
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
      showToast({
        type: 'success',
        title: 'Order placed',
        message: 'Your order has been sent to dispatch.',
      });
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
        <PrimaryButton
          label="Browse Products"
          onPress={() => navigation.getParent()?.navigate('CustomerHomeTab')}
        />
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
      {deliveryLocation && deliveryLocationDetails ? (
        <>
          <Text style={styles.locationTitle}>Pinned drop point: {deliveryLocationDetails.title}</Text>
          <Text style={styles.locationText}>{deliveryLocationDetails.subtitle}</Text>
          <Text style={styles.locationMeta}>{deliveryLocationDetails.coordinates}</Text>
        </>
      ) : null}
      <Text style={styles.helperText}>You can continue without GPS, but tracking works best when location is shared.</Text>
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
    locationTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
    },
    locationMeta: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    helperText: {
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
    error: {
      color: theme.colors.danger,
    },
  });

export default OrderScreen;
