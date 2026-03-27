import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';
import { SkeletonBlock } from './SkeletonBlock';

export const LoadingOverlay = ({ label }: { label: string }) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonBlock height={14} radius={8} width={110} />
        <SkeletonBlock height={30} radius={14} style={styles.headerTitle} width="72%" />
      </View>
      <SkeletonBlock height={136} radius={24} />
      <View style={styles.grid}>
        <SkeletonBlock height={150} radius={22} style={styles.gridItem} />
        <SkeletonBlock height={150} radius={22} style={styles.gridItem} />
      </View>
      <SkeletonBlock height={118} radius={22} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
      gap: theme.spacing.md,
      justifyContent: 'center',
      padding: theme.spacing.md,
      paddingTop: theme.spacing.lg,
    },
    grid: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    gridItem: {
      flex: 1,
    },
    header: {
      gap: theme.spacing.sm,
    },
    headerTitle: {
      marginBottom: 4,
    },
    label: {
      alignSelf: 'center',
      color: theme.colors.textMuted,
    },
  });
