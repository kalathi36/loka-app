import { Order } from '../types';
import { getEntityId } from './formatters';

export type OrderPaymentMethod = 'cash_on_delivery' | 'upi_on_delivery' | 'bank_transfer';
export type OrderDeliveryWindow = 'asap' | 'morning' | 'afternoon' | 'evening';

export interface ParsedOrderNotes {
  paymentMethod?: OrderPaymentMethod;
  deliveryWindow?: OrderDeliveryWindow;
  callBeforeDrop?: boolean;
  unloadAssistance?: boolean;
  customerInstructions: string;
  workerUpdate: string;
  hasStructuredMetadata: boolean;
}

export interface OrderPreferencesInput {
  paymentMethod: OrderPaymentMethod;
  deliveryWindow: OrderDeliveryWindow;
  callBeforeDrop: boolean;
  unloadAssistance: boolean;
  customerInstructions?: string;
  workerUpdate?: string;
}

export const DEFAULT_ORDER_PREFERENCES: Omit<
  OrderPreferencesInput,
  'customerInstructions' | 'workerUpdate'
> = {
  paymentMethod: 'cash_on_delivery',
  deliveryWindow: 'asap',
  callBeforeDrop: true,
  unloadAssistance: false,
};

export const ORDER_PAYMENT_OPTIONS: Array<{
  value: OrderPaymentMethod;
  label: string;
  shortLabel: string;
}> = [
  { value: 'cash_on_delivery', label: 'Cash on delivery', shortLabel: 'COD' },
  { value: 'upi_on_delivery', label: 'UPI on delivery', shortLabel: 'UPI' },
  { value: 'bank_transfer', label: 'Bank transfer', shortLabel: 'Transfer' },
];

export const ORDER_DELIVERY_WINDOW_OPTIONS: Array<{
  value: OrderDeliveryWindow;
  label: string;
}> = [
  { value: 'asap', label: 'ASAP' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
];

const noteLabels = {
  callBeforeDrop: 'Call before drop',
  customerInstructions: 'Customer instructions',
  deliveryWindow: 'Delivery window',
  paymentMethod: 'Payment method',
  unloadAssistance: 'Unload assistance',
  workerUpdate: 'Worker update',
} as const;

const paymentMethodMap = ORDER_PAYMENT_OPTIONS.reduce<Record<string, OrderPaymentMethod>>(
  (carry, option) => {
    carry[option.value] = option.value;
    carry[option.label.toLowerCase()] = option.value;
    carry[option.shortLabel.toLowerCase()] = option.value;
    return carry;
  },
  {},
);

const deliveryWindowMap = ORDER_DELIVERY_WINDOW_OPTIONS.reduce<Record<string, OrderDeliveryWindow>>(
  (carry, option) => {
    carry[option.value] = option.value;
    carry[option.label.toLowerCase()] = option.value;
    return carry;
  },
  {},
);

const parseBooleanValue = (value: string) => {
  const normalized = value.trim().toLowerCase();

  if (normalized === 'yes' || normalized === 'true') {
    return true;
  }

  if (normalized === 'no' || normalized === 'false') {
    return false;
  }

  return undefined;
};

const formatBooleanValue = (value: boolean) => (value ? 'Yes' : 'No');

const parseLabeledValue = (line: string, label: string) => {
  const prefix = `${label}:`;

  if (!line.startsWith(prefix)) {
    return null;
  }

  return line.slice(prefix.length).trim();
};

export const formatPaymentMethodLabel = (value?: OrderPaymentMethod) =>
  ORDER_PAYMENT_OPTIONS.find((option) => option.value === value)?.label || 'Not specified';

export const formatPaymentMethodShortLabel = (value?: OrderPaymentMethod) =>
  ORDER_PAYMENT_OPTIONS.find((option) => option.value === value)?.shortLabel || 'Payment';

export const formatDeliveryWindowLabel = (value?: OrderDeliveryWindow) =>
  ORDER_DELIVERY_WINDOW_OPTIONS.find((option) => option.value === value)?.label || 'Flexible';

export const buildOrderNotes = ({
  paymentMethod,
  deliveryWindow,
  callBeforeDrop,
  unloadAssistance,
  customerInstructions,
  workerUpdate,
}: OrderPreferencesInput) =>
  [
    `${noteLabels.paymentMethod}: ${formatPaymentMethodLabel(paymentMethod)}`,
    `${noteLabels.deliveryWindow}: ${formatDeliveryWindowLabel(deliveryWindow)}`,
    `${noteLabels.callBeforeDrop}: ${formatBooleanValue(callBeforeDrop)}`,
    `${noteLabels.unloadAssistance}: ${formatBooleanValue(unloadAssistance)}`,
    customerInstructions?.trim()
      ? `${noteLabels.customerInstructions}: ${customerInstructions.trim()}`
      : null,
    workerUpdate?.trim() ? `${noteLabels.workerUpdate}: ${workerUpdate.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n');

export const parseOrderNotes = (notes?: string | null): ParsedOrderNotes => {
  const result: ParsedOrderNotes = {
    customerInstructions: '',
    hasStructuredMetadata: false,
    workerUpdate: '',
  };

  const lines = (notes || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const legacyLines: string[] = [];

  lines.forEach((line) => {
    const paymentMethodValue = parseLabeledValue(line, noteLabels.paymentMethod);

    if (paymentMethodValue !== null) {
      result.hasStructuredMetadata = true;
      result.paymentMethod = paymentMethodMap[paymentMethodValue.toLowerCase()];
      return;
    }

    const deliveryWindowValue = parseLabeledValue(line, noteLabels.deliveryWindow);

    if (deliveryWindowValue !== null) {
      result.hasStructuredMetadata = true;
      result.deliveryWindow = deliveryWindowMap[deliveryWindowValue.toLowerCase()];
      return;
    }

    const callBeforeDropValue = parseLabeledValue(line, noteLabels.callBeforeDrop);

    if (callBeforeDropValue !== null) {
      result.hasStructuredMetadata = true;
      result.callBeforeDrop = parseBooleanValue(callBeforeDropValue);
      return;
    }

    const unloadAssistanceValue = parseLabeledValue(line, noteLabels.unloadAssistance);

    if (unloadAssistanceValue !== null) {
      result.hasStructuredMetadata = true;
      result.unloadAssistance = parseBooleanValue(unloadAssistanceValue);
      return;
    }

    const customerInstructionsValue = parseLabeledValue(line, noteLabels.customerInstructions);

    if (customerInstructionsValue !== null) {
      result.hasStructuredMetadata = true;
      result.customerInstructions = customerInstructionsValue;
      return;
    }

    const workerUpdateValue = parseLabeledValue(line, noteLabels.workerUpdate);

    if (workerUpdateValue !== null) {
      result.hasStructuredMetadata = true;
      result.workerUpdate = workerUpdateValue;
      return;
    }

    legacyLines.push(line);
  });

  if (legacyLines.length) {
    result.customerInstructions = result.customerInstructions
      ? `${result.customerInstructions} ${legacyLines.join(' ')}`
      : legacyLines.join(' ');
  }

  return result;
};

export const getOrderPreferenceBadges = (notes?: string | null) => {
  const parsedNotes = parseOrderNotes(notes);
  const badges = [];

  if (parsedNotes.paymentMethod) {
    badges.push(formatPaymentMethodShortLabel(parsedNotes.paymentMethod));
  }

  if (parsedNotes.deliveryWindow) {
    badges.push(formatDeliveryWindowLabel(parsedNotes.deliveryWindow));
  }

  if (parsedNotes.callBeforeDrop) {
    badges.push('Call before drop');
  }

  if (parsedNotes.unloadAssistance) {
    badges.push('Unload assist');
  }

  return badges;
};

export const getOrderAttentionReasons = (order: Order, now = Date.now()) => {
  const reasons: string[] = [];
  const updatedAtMs = new Date(order.updatedAt).getTime();
  const ageMinutes = Number.isFinite(updatedAtMs)
    ? Math.max(0, Math.floor((now - updatedAtMs) / 60000))
    : 0;
  const hasDeliveryPoint = Boolean(order.deliveryAddress?.trim() || order.deliveryLocation);

  if (order.status === 'pending' && ageMinutes >= 20) {
    reasons.push(`Approval overdue (${ageMinutes}m)`);
  }

  if (order.status === 'approved' && !getEntityId(order.assignedWorker)) {
    reasons.push('Worker not assigned');
  }

  if (order.status !== 'delivered' && !hasDeliveryPoint) {
    reasons.push('Delivery point missing');
  }

  if (order.status === 'out_for_delivery' && ageMinutes >= 90) {
    reasons.push(`Route stalled (${ageMinutes}m)`);
  }

  if (order.status === 'delivered' && !order.deliveryProof) {
    reasons.push('Proof missing');
  }

  return reasons;
};
