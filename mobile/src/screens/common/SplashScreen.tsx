import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppTheme } from '../../theme/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';

const SplashScreen = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.glowPrimary} />
      <View style={styles.glowSecondary} />
      <Text style={styles.brand}>Loka</Text>
      <Text style={styles.tagline}>Move Smarter. Deliver Faster.</Text>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      flex: 1,
      justifyContent: 'center',
    },
    glowPrimary: {
      backgroundColor: theme.colors.glowPrimary,
      borderRadius: 180,
      height: 240,
      position: 'absolute',
      right: -40,
      top: 100,
      width: 240,
    },
    glowSecondary: {
      backgroundColor: theme.colors.glowSecondary,
      borderRadius: 140,
      bottom: 120,
      height: 180,
      left: -40,
      position: 'absolute',
      width: 180,
    },
    brand: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 56,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    tagline: {
      color: theme.colors.textMuted,
      marginTop: 12,
    },
  });

export default SplashScreen;
