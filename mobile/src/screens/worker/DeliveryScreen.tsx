import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { TextField } from '../../components/TextField';
import api from '../../services/api';
import { Order, OrderStatus } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency } from '../../utils/formatters';

const statusOptions: OrderStatus[] = ['approved', 'out_for_delivery', 'delivered'];

const DeliveryScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const styles = useThemedStyles(createStyles);
  const order: Order = route.params.order;
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [notes, setNotes] = useState(order.notes || '');
  const [proofImage, setProofImage] = useState<Asset | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleImageSelection = async (mode: 'camera' | 'gallery') => {
    try {
      const result =
        mode === 'camera'
          ? await launchCamera({ mediaType: 'photo', saveToPhotos: false })
          : await launchImageLibrary({ mediaType: 'photo' });

      if (result.assets?.[0]) {
        setProofImage(result.assets[0]);
      }
    } catch (pickerError) {
      setError(extractErrorMessage(pickerError));
    }
  };

  const submitUpdate = async () => {
    setSubmitting(true);

    try {
      setError('');
      const formData = new FormData();
      formData.append('status', selectedStatus);
      formData.append('notes', notes);

      if (proofImage?.uri) {
        formData.append('deliveryProof', {
          uri: proofImage.uri,
          type: proofImage.type || 'image/jpeg',
          name: proofImage.fileName || `delivery-proof-${Date.now()}.jpg`,
        } as any);
      }

      await api.put(`/orders/${order._id}/status`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigation.goBack();
    } catch (submitError) {
      setError(extractErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout title="Delivery Update" subtitle="Progress the order, add notes, and attach proof when delivery is complete.">
      <Card style={styles.summary}>
        <Text style={styles.orderId}>Order #{order._id.slice(-6).toUpperCase()}</Text>
        <Text style={styles.meta}>{order.items.length} item(s) • {formatCurrency(order.totalAmount)}</Text>
        <Text style={styles.meta}>Address: {order.deliveryAddress || 'Address pending confirmation'}</Text>
      </Card>
      <View style={styles.statusRow}>
        {statusOptions.map((status) => {
          const active = status === selectedStatus;
          return (
            <Pressable
              key={status}
              onPress={() => setSelectedStatus(status)}
              style={[styles.statusChip, active ? styles.statusChipActive : null]}
            >
              <Text style={styles.statusText}>{status.replace(/_/g, ' ')}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        style={styles.notesInput}
      />
      <View style={styles.actions}>
        <PrimaryButton label="Use Camera" variant="ghost" onPress={() => handleImageSelection('camera')} />
        <PrimaryButton label="Choose Photo" variant="outline" onPress={() => handleImageSelection('gallery')} />
      </View>
      {proofImage?.uri ? <Image source={{ uri: proofImage.uri }} style={styles.preview} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Save Update" onPress={submitUpdate} loading={submitting} />
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    summary: {
      gap: 8,
    },
    orderId: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 20,
      fontWeight: '700',
    },
    meta: {
      color: theme.colors.textMuted,
    },
    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    statusChip: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    statusChipActive: {
      borderColor: theme.colors.accentSecondary,
      backgroundColor: theme.colors.surfaceMuted,
    },
    statusText: {
      color: theme.colors.text,
      textTransform: 'uppercase',
    },
    notesInput: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    actions: {
      gap: 10,
    },
    preview: {
      borderRadius: theme.radius.md,
      height: 220,
      width: '100%',
    },
    error: {
      color: theme.colors.danger,
    },
  });

export default DeliveryScreen;
