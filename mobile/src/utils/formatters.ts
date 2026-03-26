import { OrderStatus, User } from '../types';

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);

export const formatDateTime = (value?: string) => {
  if (!value) {
    return 'Just now';
  }

  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const humanizeStatus = (status: OrderStatus) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());

export const getEntityId = (value: User | string | null | undefined) =>
  typeof value === 'string' ? value : value?._id || '';

export const getEntityName = (value: User | string | null | undefined, fallback = 'Unassigned') =>
  typeof value === 'string' ? value : value?.name || fallback;

export const extractErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};
