import React, { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { TextField } from '../../components/TextField';
import api from '../../services/api';
import { showToast } from '../../services/toast';
import { useAuth } from '../../store/AuthContext';
import { ApiEnvelope } from '../../types';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage } from '../../utils/formatters';

const ForgotPasswordScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);
  const [organizationCode, setOrganizationCode] = useState(user?.organization?.code || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  const submitReset = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      setError('');
      await api.post<ApiEnvelope<{ phone: string }>>('/auth/forgot-password', {
        organizationCode: organizationCode.trim(),
        phone: phone.trim(),
        newPassword,
      });
      showToast({
        type: 'success',
        title: 'Password updated',
        message: 'Use the new password the next time you sign in.',
      });

      if (isAuthenticated) {
        navigation.goBack();
      } else {
        navigation.navigate('Login');
      }
    } catch (resetError) {
      setError(extractErrorMessage(resetError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      flushTop={isAuthenticated}
      title="Forgot Password"
      subtitle="Reset access using your organization code and registered phone number."
    >
      <TextField
        label="Organization Code"
        value={organizationCode}
        autoCapitalize="characters"
        onChangeText={setOrganizationCode}
        placeholder="LOKA1234"
      />
      <TextField
        label="Phone"
        value={phone}
        keyboardType="phone-pad"
        onChangeText={setPhone}
        placeholder="Registered phone number"
      />
      <TextField
        label="New Password"
        value={newPassword}
        secureTextEntry
        onChangeText={setNewPassword}
        placeholder="New password"
      />
      <TextField
        label="Confirm Password"
        value={confirmPassword}
        secureTextEntry
        onChangeText={setConfirmPassword}
        placeholder="Confirm password"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Reset Password" onPress={submitReset} loading={submitting} />
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    error: {
      color: theme.colors.danger,
    },
  });

export default ForgotPasswordScreen;
