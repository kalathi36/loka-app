import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { TextField } from '../../components/TextField';
import { ThemeToggleButton } from '../../components/ThemeToggleButton';
import { useAuth } from '../../store/AuthContext';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage } from '../../utils/formatters';

const RegisterOrganizationScreen = ({ navigation }: { navigation: any }) => {
  const { registerOrganization, registeringOrganization } = useAuth();
  const styles = useThemedStyles(createStyles);
  const [organizationName, setOrganizationName] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleCreateOrganization = async () => {
    try {
      setError('');
      await registerOrganization({
        organizationName: organizationName.trim(),
        name: name.trim(),
        phone: phone.trim(),
        password,
      });
    } catch (registerError) {
      setError(extractErrorMessage(registerError));
    }
  };

  return (
    <ScreenLayout
      title="Register Organization"
      subtitle="Launch a new operations workspace and create the first admin account."
      rightAction={<ThemeToggleButton />}
    >
      <View style={styles.heroCard}>
        <Text style={styles.kicker}>Admin onboarding</Text>
        <Text style={styles.heroTitle}>Set up your company command center.</Text>
        <Text style={styles.heroText}>
          After registration, Loka will create an admin account and generate an organization code you can share with workers and customers.
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Organization Setup</Text>
        <TextField
          label="Organization Name"
          value={organizationName}
          onChangeText={setOrganizationName}
          placeholder="Enter company or store name"
        />
        <TextField label="Admin Name" value={name} onChangeText={setName} placeholder="Enter owner/admin name" />
        <TextField
          label="Phone"
          value={phone}
          keyboardType="phone-pad"
          onChangeText={setPhone}
          placeholder="Enter admin phone number"
        />
        <TextField
          label="Password"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          placeholder="Choose a strong password"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label="Create Organization"
          onPress={handleCreateOrganization}
          loading={registeringOrganization}
        />
        <PrimaryButton label="Back to Login" variant="outline" onPress={() => navigation.navigate('Login')} />
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
      gap: 10,
      marginTop: theme.spacing.sm,
      padding: theme.spacing.lg,
    },
    kicker: {
      color: theme.colors.accentSecondary,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    heroTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 34,
    },
    heroText: {
      color: theme.colors.textMuted,
      lineHeight: 22,
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
  });

export default RegisterOrganizationScreen;
