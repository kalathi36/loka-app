import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { TextField } from '../../components/TextField';
import { ThemeToggleButton } from '../../components/ThemeToggleButton';
import { useAuth } from '../../store/AuthContext';
import { useAppTheme } from '../../theme/ThemeProvider';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage } from '../../utils/formatters';

const LoginScreen = ({ navigation }: { navigation: any }) => {
  const { login, loggingIn } = useAuth();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      await login(phone.trim(), password);
    } catch (loginError) {
      setError(extractErrorMessage(loginError));
    }
  };

  return (
    <ScreenLayout
      flushTop={false}
      title="Loka"
      subtitle="Realtime dispatch, live driver visibility, and order control for modern logistics teams."
      rightAction={<ThemeToggleButton />}
    >
      <View style={styles.heroCard}>
        <Text style={styles.kicker}>Live logistics workspace</Text>
        <Text style={styles.heroTitle}>Move Smarter. Deliver Faster.</Text>
        <Text style={styles.heroText}>
          One mobile app for operations, field staff, and customers with role-based access, live GPS, and instant updates.
        </Text>
        <View style={styles.metricRow}>
          <View style={styles.metricChip}>
            <Text style={styles.metricValue}>15s</Text>
            <Text style={styles.metricLabel}>GPS Pulse</Text>
          </View>
          <View style={styles.metricChip}>
            <Text style={styles.metricValue}>24/7</Text>
            <Text style={styles.metricLabel}>Ops Visibility</Text>
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Login</Text>
        <TextField
          label="Phone"
          value={phone}
          keyboardType="phone-pad"
          onChangeText={setPhone}
          placeholder="Enter account phone number"
        />
        <TextField
          label="Password"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          placeholder="Enter password"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Login" onPress={handleLogin} loading={loggingIn} />
        <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={[styles.ctaLink, { color: theme.colors.accent }]}>Forgot password?</Text>
        </Pressable>
      </View>

      <View style={styles.ctaGrid}>
        <Pressable style={styles.ctaCard} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.ctaTitle}>Join an Organization</Text>
          <Text style={styles.ctaText}>
            Create a worker or customer account using the organization code shared by your admin.
          </Text>
          <Text style={[styles.ctaLink, { color: theme.colors.accent }]}>Create user account</Text>
        </Pressable>
        <Pressable style={styles.ctaCard} onPress={() => navigation.navigate('RegisterOrganization')}>
          <Text style={styles.ctaTitle}>Register New Organization</Text>
          <Text style={styles.ctaText}>
            Launch a new Loka workspace and get an admin account plus a shareable org code in one step.
          </Text>
          <Text style={[styles.ctaLink, { color: theme.colors.accentSecondary }]}>Create organization</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    heroCard: {
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      gap: 12,
      marginTop: theme.spacing.sm,
      padding: theme.spacing.lg,
      shadowColor: theme.colors.shadow,
      shadowOpacity: theme.isDark ? 0.22 : 0.10,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
    },
    kicker: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    heroTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 38,
    },
    heroText: {
      color: theme.colors.textMuted,
      lineHeight: 22,
    },
    metricRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: 6,
    },
    metricChip: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flex: 1,
      gap: 6,
      padding: theme.spacing.md,
    },
    metricValue: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 22,
      fontWeight: '700',
    },
    metricLabel: {
      color: theme.colors.textMuted,
      fontSize: 12,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    formCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 20,
      fontWeight: '700',
    },
    error: {
      color: theme.colors.danger,
    },
    ctaGrid: {
      gap: theme.spacing.sm,
    },
    ctaCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 8,
      padding: theme.spacing.md,
    },
    ctaTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    ctaText: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    ctaLink: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      marginTop: 4,
      textTransform: 'uppercase',
    },
  });

export default LoginScreen;
