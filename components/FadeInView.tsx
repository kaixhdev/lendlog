import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function FadeInView({ children, style }: Props) {
  return <View style={[{ flex: 1 }, style]}>{children}</View>;
}
