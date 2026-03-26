import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../theme/ThemeProvider';

interface AppIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const AppIcon = ({ name, size = 20, color, style }: AppIconProps) => {
  const { theme } = useAppTheme();

  return <Ionicons name={name} size={size} color={color || theme.colors.text} style={style} />;
};
