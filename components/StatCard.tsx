import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  title: string;
  value: string;
  color?: string;
  subtitle?: string;
}

export function StatCard({ title, value, color, subtitle }: Props) {
  const c = useColors();
  const valueColor = color ?? c.text;
  return (
    <View
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <Text
        style={[
          styles.title,
          { color: c.text3, fontFamily: 'Inter_500Medium' },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.value,
          { color: valueColor, fontFamily: 'Inter_700Bold' },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            { color: c.text3, fontFamily: 'Inter_400Regular' },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 1,
    gap: 4,
    minWidth: 0,
  },
  title: { fontSize: 11, letterSpacing: 0.5 },
  value: { fontSize: 20 },
  subtitle: { fontSize: 11 },
});
