import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { TextField } from '../../components/TextField';
import api from '../../services/api';
import { showToast } from '../../services/toast';
import { Order, OrderStatus } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatCurrency, humanizeStatus } from '../../utils/formatters';
import {
  buildOrderNotes,
  DEFAULT_ORDER_PREFERENCES,
  formatDeliveryWindowLabel,
  formatPaymentMethodLabel,
  parseOrderNotes,
} from '../../utils/orderPreferences';

const statusOptions: Array<{
  value: OrderStatus;
  label: string;
  subtitle: string;
}> = [
  {
    value: 'approved',
    label: 'Ready to leave',
    subtitle: 'Dispatch confirmed. Worker is preparing the route.',
  },
  {
    value: 'out_for_delivery',
    label: 'On the way',
    subtitle: 'Route is live and customer can track worker progress.',
  },
  {
    value: 'delivered',
    label: 'Delivered',
    subtitle: 'Handoff completed with proof and final delivery update.',
  },
];

const DeliveryScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const styles = useThemedStyles(createStyles);
  const order: Order = route.params.order;
  const parsedNotes = useMemo(() => parseOrderNotes(order.notes), [order.notes]);
  const initialStatus = statusOptions.some((status) => status.value === order.status)
    ? order.status
    : 'approved';
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(initialStatus);
  const [workerUpdate, setWorkerUpdate] = useState(parsedNotes.workerUpdate);
  const [proofImage, setProofImage] = useState<Asset | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentStatusOption = statusOptions.find((status) => status.value === selectedStatus) || statusOptions[0];
  const selectedStepIndex = statusOptions.findIndex((status) => status.value === selectedStatus);
  const proofRequired = selectedStatus === 'delivered' && !proofImage?.uri && !order.deliveryProof;
  const submitLabel =
    selectedStatus === 'approved'
      ? 'Save dispatch state'
      : selectedStatus === 'out_for_delivery'
        ? 'Mark out for delivery'
        : 'Complete delivery';

  const handleImageSelection = async (mode: 'camera' | 'gallery') => {
    try {
      setError('');
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
    if (proofRequired) {
      setError('Attach a delivery photo before marking this order as delivered.');
      return;
    }

    setSubmitting(true);

    try {
      setError('');
      const formData = new FormData();
      formData.append('status', selectedStatus);
      formData.append(
        'notes',
        buildOrderNotes({
          paymentMethod: parsedNotes.paymentMethod || DEFAULT_ORDER_PREFERENCES.paymentMethod,
          deliveryWindow: parsedNotes.deliveryWindow || DEFAULT_ORDER_PREFERENCES.deliveryWindow,
          callBeforeDrop:
            typeof parsedNotes.callBeforeDrop === 'boolean'
              ? parsedNotes.callBeforeDrop
              : DEFAULT_ORDER_PREFERENCES.callBeforeDrop,
          unloadAssistance:
            typeof parsedNotes.unloadAssistance === 'boolean'
              ? parsedNotes.unloadAssistance
              : DEFAULT_ORDER_PREFERENCES.unloadAssistance,
          customerInstructions: parsedNotes.customerInstructions,
          workerUpdate: workerUpdate.trim(),
        }),
      );

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

      showToast({
        type: 'success',
        title: 'Delivery updated',
        message: `Order is now ${humanizeStatus(selectedStatus).toLowerCase()}.`,
      });
      navigation.goBack();
    } catch (submitError) {
      setError(extractErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout>
      <Card style={styles.summary}>
        <Text style={styles.orderId}>Order #{order._id.slice(-6).toUpperCase()}</Text>
        <Text style={styles.meta}>
          {order.items.length} item(s) • {formatCurrency(order.totalAmount)}
        </Text>
        <Text style={styles.meta}>Address: {order.deliveryAddress || 'Address pending confirmation'}</Text>
        <View style={styles.summaryActions}>
          <PrimaryButton
            label="Open Route"
            onPress={() => navigation.navigate('MapNavigation', { order })}
            variant="outline"
          />
          <PrimaryButton
            label="Refresh Proof"
            onPress={() => handleImageSelection('gallery')}
            variant="ghost"
          />
        </View>
      </Card>

      <Card style={styles.workflowCard}>
        <Text style={styles.sectionTitle}>Delivery workflow</Text>
        <Text style={styles.sectionHint}>{currentStatusOption.subtitle}</Text>
        <View style={styles.stepList}>
          {statusOptions.map((status, index) => {
            const active = status.value === selectedStatus;
            const completed = index < selectedStepIndex;

            return (
              <Pressable
                key={status.value}
                onPress={() => setSelectedStatus(status.value)}
                style={[
                  styles.stepCard,
                  active ? styles.stepCardActive : null,
                  completed ? styles.stepCardCompleted : null,
                ]}
              >
                <Text style={[styles.stepTitle, active ? styles.stepTitleActive : null]}>{status.label}</Text>
                <Text style={[styles.stepMeta, active ? styles.stepMetaActive : null]}>{status.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.requirementsCard}>
        <Text style={styles.sectionTitle}>Delivery brief</Text>
        <View style={styles.requirementRow}>
          <Text style={styles.requirementLabel}>Payment</Text>
          <Text style={styles.requirementValue}>{formatPaymentMethodLabel(parsedNotes.paymentMethod)}</Text>
        </View>
        <View style={styles.requirementRow}>
          <Text style={styles.requirementLabel}>Delivery slot</Text>
          <Text style={styles.requirementValue}>{formatDeliveryWindowLabel(parsedNotes.deliveryWindow)}</Text>
        </View>
        <View style={styles.requirementRow}>
          <Text style={styles.requirementLabel}>Call before drop</Text>
          <Text style={styles.requirementValue}>{parsedNotes.callBeforeDrop ? 'Yes' : 'Not required'}</Text>
        </View>
        <View style={styles.requirementRow}>
          <Text style={styles.requirementLabel}>Unload assistance</Text>
          <Text style={styles.requirementValue}>{parsedNotes.unloadAssistance ? 'Needed' : 'Not required'}</Text>
        </View>
        {parsedNotes.customerInstructions ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteLabel}>Customer instructions</Text>
            <Text style={styles.noteText}>{parsedNotes.customerInstructions}</Text>
          </View>
        ) : null}
      </Card>

      <Card style={styles.requirementsCard}>
        <Text style={styles.sectionTitle}>Delivery proof</Text>
        <Text style={styles.sectionHint}>
          Delivered orders should include a site photo, signed handoff photo, or drop proof.
        </Text>
        <View style={styles.proofActions}>
          <PrimaryButton label="Use Camera" variant="ghost" onPress={() => handleImageSelection('camera')} />
          <PrimaryButton label="Choose Photo" variant="outline" onPress={() => handleImageSelection('gallery')} />
        </View>
        {proofImage?.uri ? <Image source={{ uri: proofImage.uri }} style={styles.preview} /> : null}
        {!proofImage?.uri && order.deliveryProof ? (
          <Text style={styles.successNote}>Proof already exists on this order.</Text>
        ) : null}
        {proofRequired ? <Text style={styles.warningText}>Proof is required before delivery can be completed.</Text> : null}
      </Card>

      <TextField
        label="Worker Update"
        value={workerUpdate}
        onChangeText={setWorkerUpdate}
        multiline
        placeholder="Add arrival note, customer confirmation, or handoff detail"
        style={styles.notesInput}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={submitLabel} onPress={submitUpdate} loading={submitting} />
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    error: {
      color: theme.colors.danger,
    },
    meta: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    noteCard: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 6,
      padding: theme.spacing.md,
    },
    noteLabel: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    noteText: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    notesInput: {
      minHeight: 110,
      textAlignVertical: 'top',
    },
    orderId: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 20,
      fontWeight: '700',
    },
    preview: {
      borderRadius: theme.radius.md,
      height: 220,
      width: '100%',
    },
    proofActions: {
      gap: 10,
    },
    requirementLabel: {
      color: theme.colors.textMuted,
      fontSize: 12,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    requirementRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    requirementValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontWeight: '700',
      paddingLeft: theme.spacing.md,
      textAlign: 'right',
    },
    requirementsCard: {
      gap: 12,
    },
    sectionHint: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    stepCard: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 6,
      padding: theme.spacing.md,
    },
    stepCardActive: {
      backgroundColor: theme.colors.accentMuted,
      borderColor: theme.colors.accent,
    },
    stepCardCompleted: {
      borderColor: theme.colors.accentSecondary,
    },
    stepList: {
      gap: theme.spacing.sm,
    },
    stepMeta: {
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
    stepMetaActive: {
      color: theme.colors.text,
    },
    stepTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 15,
      fontWeight: '700',
    },
    stepTitleActive: {
      color: theme.colors.accent,
    },
    successNote: {
      color: theme.colors.success,
      fontFamily: theme.fontFamily.heading,
      fontWeight: '700',
    },
    summary: {
      gap: 8,
    },
    summaryActions: {
      gap: 10,
      marginTop: 4,
    },
    warningText: {
      color: theme.colors.warning,
      fontFamily: theme.fontFamily.heading,
      fontWeight: '700',
      lineHeight: 20,
    },
    workflowCard: {
      gap: 10,
    },
  });

export default DeliveryScreen;
