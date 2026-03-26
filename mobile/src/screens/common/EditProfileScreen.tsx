import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenLayout } from '../../components/ScreenLayout';
import { TextField } from '../../components/TextField';
import { showToast } from '../../services/toast';
import { useAuth } from '../../store/AuthContext';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { extractErrorMessage } from '../../utils/formatters';

const EditProfileScreen = ({ navigation }: { navigation: any }) => {
  const { user, updateProfile } = useAuth();
  const styles = useThemedStyles(createStyles);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const saveProfile = async () => {
    setSubmitting(true);

    try {
      setError('');
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
      });
      showToast({
        type: 'success',
        title: 'Profile updated',
        message: 'Your account details were saved.',
      });
      navigation.goBack();
    } catch (profileError) {
      setError(extractErrorMessage(profileError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout title="Edit Profile" subtitle="Keep your contact details accurate for dispatch and support.">
      <TextField label="Name" value={name} onChangeText={setName} placeholder="Full name" />
      <TextField
        label="Phone"
        value={phone}
        keyboardType="phone-pad"
        onChangeText={setPhone}
        placeholder="Phone number"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Save Changes" onPress={saveProfile} loading={submitting} />
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    error: {
      color: theme.colors.danger,
    },
  });

export default EditProfileScreen;
