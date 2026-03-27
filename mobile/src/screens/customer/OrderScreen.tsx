import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
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
import { extractErrorMessage, formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  buildOrderNotes,
  DEFAULT_ORDER_PREFERENCES,
  formatDeliveryWindowLabel,
  formatPaymentMethodLabel,
  ORDER_DELIVERY_WINDOW_OPTIONS,
  ORDER_PAYMENT_OPTIONS,
  OrderDeliveryWindow,
  OrderPaymentMethod,
  parseOrderNotes,
} from '../../utils/orderPreferences';

interface DeliveryPreset {
  key: string;
  address: string;
  updatedAt: string;
  deliveryLocation: LocationPoint | null;
  deliveryWindow?: OrderDeliveryWindow;
  paymentMethod?: OrderPaymentMethod;
  callBeforeDrop?: boolean;
  unloadAssistance?: boolean;
  customerInstructions: string;
}

const OrderScreen = ({ navigation }: { navigation: any }) => {
  const styles = useThemedStyles(createStyles);
  const { itemCount, items, totalAmount, clearCart } = useCart();
  const [notes, setNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<LocationPoint | null>(null);
  const [deliveryLocationDetails, setDeliveryLocationDetails] = useState<LocationDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>(
    DEFAULT_ORDER_PREFERENCES.paymentMethod,
  );
  const [deliveryWindow, setDeliveryWindow] = useState<OrderDeliveryWindow>(
    DEFAULT_ORDER_PREFERENCES.deliveryWindow,
  );
  const [callBeforeDrop, setCallBeforeDrop] = useState(DEFAULT_ORDER_PREFERENCES.callBeforeDrop);
  const [unloadAssistance, setUnloadAssistance] = useState(DEFAULT_ORDER_PREFERENCES.unloadAssistance);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const hasDeliveryPoint = Boolean(deliveryAddress.trim() || deliveryLocation);
  const orderLines = useMemo(
    () =>
      items.map((item) => ({
        key: item._id,
        title: item.name,
        quantity: item.quantity,
        total: item.price * item.quantity,
      })),
    [items],
  );
  const recentDeliveryPresets = useMemo<DeliveryPreset[]>(() => {
    const seenKeys = new Set<string>();

    return recentOrders
      .filter((order) => order.deliveryAddress?.trim() || order.deliveryLocation)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      .reduce<DeliveryPreset[]>((carry, order) => {
        const address = order.deliveryAddress?.trim() || 'Pinned delivery point';
        const key = `${address.toLowerCase()}-${order.deliveryLocation?.latitude || ''}-${order.deliveryLocation?.longitude || ''}`;

        if (seenKeys.has(key)) {
          return carry;
        }

        seenKeys.add(key);
        const parsedNotes = parseOrderNotes(order.notes);

        carry.push({
          key,
          address,
          updatedAt: order.updatedAt,
          deliveryLocation: order.deliveryLocation || null,
          deliveryWindow: parsedNotes.deliveryWindow,
          paymentMethod: parsedNotes.paymentMethod,
          callBeforeDrop: parsedNotes.callBeforeDrop,
          unloadAssistance: parsedNotes.unloadAssistance,
          customerInstructions: parsedNotes.customerInstructions,
        });

        return carry;
      }, [])
      .slice(0, 3);
  }, [recentOrders]);

  useEffect(() => {
    let active = true;

    const loadRecentOrders = async () => {
      try {
        const response = await api.get<ApiEnvelope<Order[]>>('/orders');

        if (active) {
          setRecentOrders(response.data.data);
        }
      } catch {
        if (active) {
          setRecentOrders([]);
        }
      }
    };

    loadRecentOrders().catch(() => null);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!deliveryLocation) {
      setDeliveryLocationDetails(null);
      return;
    }

    let active = true;

    getLocationDetails(deliveryLocation, deliveryAddress.trim() || 'Delivery point')
      .then((details) => {
        if (active) {
          setDeliveryLocationDetails(details);
        }
      })
      .catch(() => {
        if (active) {
          setDeliveryLocationDetails(null);
        }
      });

    return () => {
      active = false;
    };
  }, [deliveryAddress, deliveryLocation]);

  const captureCurrentLocation = async () => {
    try {
      setError('');
      setCapturingLocation(true);
      const granted = await requestLocationPermission();

      if (!granted) {
        setError('Location permission is required for precise live delivery tracking.');
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
    } finally {
      setCapturingLocation(false);
    }
  };

  const applyPreset = (preset: DeliveryPreset) => {
    setDeliveryAddress(preset.address);
    setDeliveryLocation(preset.deliveryLocation);
    setPaymentMethod(preset.paymentMethod || DEFAULT_ORDER_PREFERENCES.paymentMethod);
    setDeliveryWindow(preset.deliveryWindow || DEFAULT_ORDER_PREFERENCES.deliveryWindow);
    setCallBeforeDrop(
      typeof preset.callBeforeDrop === 'boolean'
        ? preset.callBeforeDrop
        : DEFAULT_ORDER_PREFERENCES.callBeforeDrop,
    );
    setUnloadAssistance(
      typeof preset.unloadAssistance === 'boolean'
        ? preset.unloadAssistance
        : DEFAULT_ORDER_PREFERENCES.unloadAssistance,
    );
    setNotes(preset.customerInstructions);
    setError('');
  };

  const placeOrder = async () => {
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (!hasDeliveryPoint) {
      setError('Add a delivery address or pin your current location before placing the order.');
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
        notes: buildOrderNotes({
          paymentMethod,
          deliveryWindow,
          callBeforeDrop,
          unloadAssistance,
          customerInstructions: notes.trim(),
        }),
        deliveryAddress: deliveryAddress.trim(),
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
      <ScreenLayout>
        <EmptyState title="Nothing to order" subtitle="Go back to the storefront and add products first." />
        <PrimaryButton
          label="Browse Products"
          onPress={() => navigation.getParent()?.navigate('CustomerShopTab')}
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <Card style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Final review</Text>
        <Text style={styles.heroTitle}>{formatCurrency(totalAmount)}</Text>
        <Text style={styles.heroMeta}>
          {itemCount} unit{itemCount === 1 ? '' : 's'} across {items.length} line
          {items.length === 1 ? '' : 's'} with live tracking, delivery proof, and dispatch notes synced to the worker.
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{formatPaymentMethodLabel(paymentMethod)}</Text>
            <Text style={styles.heroStatLabel}>Payment</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{formatDeliveryWindowLabel(deliveryWindow)}</Text>
            <Text style={styles.heroStatLabel}>Delivery slot</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{callBeforeDrop ? 'Call' : 'Drop'}</Text>
            <Text style={styles.heroStatLabel}>Arrival workflow</Text>
          </View>
        </View>
      </Card>

      {recentDeliveryPresets.length ? (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent delivery profiles</Text>
          <Text style={styles.helperText}>
            Reuse your last few delivery setups, including drop point and fulfilment preferences.
          </Text>
          <View style={styles.presetList}>
            {recentDeliveryPresets.map((preset) => (
              <Pressable key={preset.key} onPress={() => applyPreset(preset)} style={styles.presetCard}>
                <Text numberOfLines={1} style={styles.presetTitle}>
                  {preset.address}
                </Text>
                <Text numberOfLines={2} style={styles.presetMeta}>
                  Last used {formatDateTime(preset.updatedAt)}
                </Text>
                <Text numberOfLines={1} style={styles.presetMeta}>
                  {formatPaymentMethodLabel(preset.paymentMethod)} • {formatDeliveryWindowLabel(preset.deliveryWindow)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Delivery details</Text>
        <TextField
          hint="Use a site name, street address, or landmark so the worker can reach you without calling twice."
          label="Delivery Address"
          onChangeText={setDeliveryAddress}
          placeholder="Shop, warehouse, or drop location"
          value={deliveryAddress}
        />
        <TextField
          hint="Optional notes like entry gate, unloading contact, or stack placement instructions."
          label="Site Instructions"
          multiline
          onChangeText={setNotes}
          placeholder="Add delivery instructions"
          style={styles.notes}
          value={notes}
        />
        <PrimaryButton
          label={deliveryLocation ? 'Refresh Current Location' : 'Use My Current Location'}
          loading={capturingLocation}
          onPress={captureCurrentLocation}
          variant="outline"
        />
        {deliveryLocation && deliveryLocationDetails ? (
          <View style={styles.locationCard}>
            <Text style={styles.locationTitle}>{deliveryLocationDetails.title}</Text>
            <Text style={styles.locationText}>{deliveryLocationDetails.subtitle}</Text>
            <Text style={styles.locationMeta}>{deliveryLocationDetails.coordinates}</Text>
          </View>
        ) : (
          <Text style={styles.helperText}>
            Pinning your location improves ETA accuracy and worker navigation.
          </Text>
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Fulfilment preferences</Text>
        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceLabel}>Payment method</Text>
          <View style={styles.optionWrap}>
            {ORDER_PAYMENT_OPTIONS.map((option) => {
              const active = option.value === paymentMethod;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setPaymentMethod(option.value)}
                  style={[styles.optionChip, active ? styles.optionChipActive : null]}
                >
                  <Text style={[styles.optionChipText, active ? styles.optionChipTextActive : null]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceLabel}>Preferred delivery slot</Text>
          <View style={styles.optionWrap}>
            {ORDER_DELIVERY_WINDOW_OPTIONS.map((option) => {
              const active = option.value === deliveryWindow;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setDeliveryWindow(option.value)}
                  style={[styles.optionChip, active ? styles.optionChipActive : null]}
                >
                  <Text style={[styles.optionChipText, active ? styles.optionChipTextActive : null]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceLabel}>Ops handoff</Text>
          <View style={styles.optionWrap}>
            <Pressable
              onPress={() => setCallBeforeDrop((current) => !current)}
              style={[styles.optionChip, callBeforeDrop ? styles.optionChipActive : null]}
            >
              <Text style={[styles.optionChipText, callBeforeDrop ? styles.optionChipTextActive : null]}>
                Call before drop
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setUnloadAssistance((current) => !current)}
              style={[styles.optionChip, unloadAssistance ? styles.optionChipActive : null]}
            >
              <Text style={[styles.optionChipText, unloadAssistance ? styles.optionChipTextActive : null]}>
                Unload assistance needed
              </Text>
            </Pressable>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Order review</Text>
        {orderLines.map((line) => (
          <View key={line.key} style={styles.orderRow}>
            <View style={styles.orderRowCopy}>
              <Text style={styles.orderRowTitle}>{line.title}</Text>
              <Text style={styles.orderRowMeta}>Qty {line.quantity}</Text>
            </View>
            <Text style={styles.orderRowValue}>{formatCurrency(line.total)}</Text>
          </View>
        ))}
        <View style={styles.preferenceSummary}>
          <Text style={styles.preferenceSummaryText}>Payment: {formatPaymentMethodLabel(paymentMethod)}</Text>
          <Text style={styles.preferenceSummaryText}>Slot: {formatDeliveryWindowLabel(deliveryWindow)}</Text>
          <Text style={styles.preferenceSummaryText}>
            Arrival: {callBeforeDrop ? 'Call before drop' : 'Proceed on arrival'}
          </Text>
          {unloadAssistance ? (
            <Text style={styles.preferenceSummaryText}>Unload support requested</Text>
          ) : null}
        </View>
        <View style={[styles.orderRow, styles.orderRowTotal]}>
          <Text style={styles.orderTotalLabel}>Total payable</Text>
          <Text style={styles.orderTotalValue}>{formatCurrency(totalAmount)}</Text>
        </View>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        disabled={!hasDeliveryPoint}
        label="Place Order"
        loading={submitting}
        onPress={placeOrder}
      />
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    error: {
      color: theme.colors.danger,
    },
    helperText: {
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
    heroCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 8,
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
      marginTop: 4,
    },
    heroStatValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
    },
    heroTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 28,
      fontWeight: '700',
    },
    locationCard: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 4,
      padding: theme.spacing.md,
    },
    locationMeta: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    locationText: {
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
    locationTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
    },
    notes: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    optionChip: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    optionChipActive: {
      backgroundColor: theme.colors.accentMuted,
      borderColor: theme.colors.accent,
    },
    optionChipText: {
      color: theme.colors.textMuted,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    optionChipTextActive: {
      color: theme.colors.accent,
    },
    optionWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    orderRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    orderRowCopy: {
      flex: 1,
      gap: 4,
      paddingRight: theme.spacing.md,
    },
    orderRowMeta: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    orderRowTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontWeight: '700',
    },
    orderRowTotal: {
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      marginTop: 4,
      paddingTop: 12,
    },
    orderRowValue: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontWeight: '700',
    },
    orderTotalLabel: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    orderTotalValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 24,
      fontWeight: '700',
    },
    preferenceGroup: {
      gap: 10,
    },
    preferenceLabel: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 14,
      fontWeight: '700',
    },
    preferenceSummary: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 6,
      padding: theme.spacing.md,
    },
    preferenceSummaryText: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    presetCard: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 4,
      padding: theme.spacing.md,
    },
    presetList: {
      gap: theme.spacing.sm,
    },
    presetMeta: {
      color: theme.colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
    presetTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 15,
      fontWeight: '700',
    },
    sectionCard: {
      backgroundColor: theme.colors.surfaceRaised,
      gap: 12,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
  });

export default OrderScreen;
