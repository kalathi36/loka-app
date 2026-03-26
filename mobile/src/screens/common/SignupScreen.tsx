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

const roleOptions = [
  { label: 'Customer', value: 'customer' as const, description: 'Place and track orders' },
  { label: 'Worker', value: 'worker' as const, description: 'Receive deliveries and update live status' },
];

const SignupScreen = ({ navigation }: { navigation: any }) => {
  const { registerUser, signingUp } = useAuth();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [organizationCode, setOrganizationCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'worker'>('customer');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    try {
      setError('');
      await registerUser({
        organizationCode: organizationCode.trim(),
        name: name.trim(),
        phone: phone.trim(),
        password,
        role,
      });
    } catch (signupError) {
      setError(extractErrorMessage(signupError));
    }
  };

  return (
    <ScreenLayout
      title="Join Organization"
      subtitle="Create a new user account for an existing Loka workspace."
      rightAction={<ThemeToggleButton />}
    >
      <View style={styles.infoCard}>
        <Text style={styles.kicker}>Shared org code required</Text>
        <Text style={styles.infoText}>
          Ask your admin for the organization code after they register the company workspace.
        </Text>
      </View>

      <View style={styles.roleGrid}>
        {roleOptions.map((option) => {
          const active = option.value === role;
          return (
            <Pressable
              key={option.value}
              onPress={() => setRole(option.value)}
              style={[styles.roleCard, active ? styles.roleCardActive : null]}
            >
              <Text style={styles.roleTitle}>{option.label}</Text>
              <Text style={styles.roleText}>{option.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>User Signup</Text>
        <TextField
          label="Organization Code"
          value={organizationCode}
          autoCapitalize="characters"
          onChangeText={setOrganizationCode}
          placeholder="Enter org code"
          hint="Example: LOKA1X7Q"
        />
        <TextField label="Full Name" value={name} onChangeText={setName} placeholder="Enter your name" />
        <TextField
          label="Phone"
          value={phone}
          keyboardType="phone-pad"
          onChangeText={setPhone}
          placeholder="Enter phone number"
        />
        <TextField
          label="Password"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          placeholder="Choose a strong password"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Create Account" onPress={handleSignup} loading={signingUp} />
        <PrimaryButton label="Back to Login" variant="outline" onPress={() => navigation.navigate('Login')} />
      </View>

      <View style={styles.footerCard}>
        <Text style={styles.footerTitle}>Need an admin account?</Text>
        <Text style={styles.footerText}>
          Admin access is created when a new organization is registered. Start there if you are launching a new business workspace.
        </Text>
        <Text style={[styles.footerLink, { color: theme.colors.accentSecondary }]} onPress={() => navigation.navigate('RegisterOrganization')}>
          Register a new organization
        </Text>
      </View>
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    infoCard: {
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      gap: 8,
      padding: theme.spacing.lg,
    },
    kicker: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    infoText: {
      color: theme.colors.textMuted,
      lineHeight: 21,
    },
    roleGrid: {
      gap: theme.spacing.sm,
    },
    roleCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 6,
      padding: theme.spacing.md,
    },
    roleCardActive: {
      borderColor: theme.colors.accentSecondary,
      backgroundColor: theme.colors.surfaceMuted,
    },
    roleTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    roleText: {
      color: theme.colors.textMuted,
      lineHeight: 20,
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
    footerCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 8,
      padding: theme.spacing.md,
    },
    footerTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
    },
    footerText: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    footerLink: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.7,
      marginTop: 4,
      textTransform: 'uppercase',
    },
  });

export default SignupScreen;
