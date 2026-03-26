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

const WorkerManagementScreen = () => {
  const styles = useThemedStyles(createStyles);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadWorkers = async () => {
      try {
        setError('');
        const response = await api.get<ApiEnvelope<User[]>>('/workers');
        setWorkers(response.data.data);
      } catch (loadError) {
        setError(extractErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    loadWorkers();
  }, []);

  if (loading) {
    return <LoadingOverlay label="Loading workers" />;
  }

  return (
    <ScreenLayout title="Workers" subtitle="Delivery staff under your organization and their account details.">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {workers.length === 0 ? (
        <EmptyState title="No workers yet" subtitle="Workers can join using the organization code." />
      ) : (
        workers.map((worker) => (
          <Card key={worker._id} style={styles.card}>
            <Text style={styles.name}>{worker.name}</Text>
            <Text style={styles.meta}>{worker.phone}</Text>
            <Text style={styles.badge}>Worker</Text>
            <Text style={styles.meta}>Workspace: {worker.organization?.name || '-'}</Text>
            <Text style={styles.meta}>Synced: {formatDate(new Date())}</Text>
          </Card>
        ))
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: 6,
    },
    name: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 20,
      fontWeight: '700',
    },
    meta: {
      color: theme.colors.textMuted,
    },
    badge: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    error: {
      color: theme.colors.danger,
    },
  });

export default WorkerManagementScreen;
