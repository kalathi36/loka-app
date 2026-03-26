import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { ScreenLayout } from '../../components/ScreenLayout';
import api from '../../services/api';
import { ApiEnvelope, User } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage, formatDate } from '../../utils/formatters';

const CustomerListScreen = () => {
  const styles = useThemedStyles(createStyles);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setError('');
        const response = await api.get<ApiEnvelope<User[]>>('/admin/customers');
        setCustomers(response.data.data);
      } catch (loadError) {
        setError(extractErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  if (loading) {
    return <LoadingOverlay label="Loading customers" />;
  }

  return (
    <ScreenLayout title="Customers" subtitle="Customer accounts operating under this organization.">
      <Card style={styles.summary}>
        <Text style={styles.summaryLabel}>Total customers</Text>
        <Text style={styles.summaryValue}>{customers.length}</Text>
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {customers.length === 0 ? (
        <EmptyState title="No customers yet" subtitle="Customer accounts created with the org code will appear here." />
      ) : (
        customers.map((customer) => (
          <Card key={customer._id} style={styles.card}>
            <Text style={styles.name}>{customer.name}</Text>
            <Text style={styles.meta}>{customer.phone}</Text>
            <Text style={styles.meta}>Joined {formatDate(new Date())}</Text>
          </Card>
        ))
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    summary: {
      gap: 6,
    },
    summaryLabel: {
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    summaryValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 28,
      fontWeight: '700',
    },
    card: {
      gap: 6,
    },
    name: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    meta: {
      color: theme.colors.textMuted,
    },
    error: {
      color: theme.colors.danger,
    },
  });

export default CustomerListScreen;
