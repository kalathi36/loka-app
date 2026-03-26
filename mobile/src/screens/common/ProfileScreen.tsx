import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionTile } from '../../components/ActionTile';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { useAuth } from '../../store/AuthContext';
import { useAppTheme } from '../../theme/ThemeProvider';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';

const ProfileScreen = ({ navigation }: { navigation: any }) => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <ScreenLayout>
      <Card style={styles.identityCard}>
        <Text style={styles.eyebrow}>Workspace account</Text>
        <Text style={styles.name}>{user?.name || 'Loka User'}</Text>
        <Text style={styles.meta}>{user?.phone || '-'}</Text>
        <Text style={styles.role}>{user?.role || 'member'}</Text>
        <Text style={styles.org}>{user?.organization?.name || 'No organization linked'}</Text>
        <Text style={styles.helper}>
          Account details, preferences, and security tools for your workspace access.
        </Text>
      </Card>

      <Card style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Theme</Text>
            <Text style={styles.settingSubtitle}>
              Currently using {mode === 'dark' ? 'dark' : 'light'} mode.
            </Text>
          </View>
          <PrimaryButton
            label={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            variant="outline"
            onPress={toggleTheme}
          />
        </View>
      </Card>

      <ActionTile
        title="Edit Profile"
        subtitle="Update your display name and phone number."
        onPress={() => navigation.navigate('EditProfile')}
      />
      <ActionTile
        title="Forgot Password"
        subtitle="Reset your password using your organization code and phone."
        onPress={() => navigation.navigate('ForgotPassword')}
      />

      <PrimaryButton label="Logout" variant="outline" onPress={logout} />
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    identityCard: {
      gap: 8,
    },
    eyebrow: {
      color: theme.colors.textMuted,
      fontSize: 12,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    name: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 28,
      fontWeight: '700',
    },
    meta: {
      color: theme.colors.textMuted,
      fontSize: 15,
    },
    role: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    org: {
      color: theme.colors.text,
      fontSize: 14,
    },
    helper: {
      color: theme.colors.textMuted,
      lineHeight: 20,
      marginTop: 4,
    },
    settingsCard: {
      gap: theme.spacing.sm,
    },
    settingRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.md,
      justifyContent: 'space-between',
    },
    settingCopy: {
      flex: 1,
      gap: 4,
    },
    settingTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    settingSubtitle: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
  });

export default ProfileScreen;
