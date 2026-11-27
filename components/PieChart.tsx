import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  lent: number;
  borrowed: number;
  currency: string;
}

function fmt(n: number) {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}

export function PieChart({ lent, borrowed, currency }: Props) {
  const c = useColors();
  const total = lent + borrowed;
  const lentPct = total > 0 ? Math.round((lent / total) * 100) : 50;
  const borrowedPct = 100 - lentPct;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.card, borderColor: c.border },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: c.text, fontFamily: 'Inter_600SemiBold' },
        ]}
      >
        Lent vs Borrowed
      </Text>
      <View style={styles.row}>
        <View style={styles.visual}>
          {total === 0 ? (
            <View style={[styles.ring, { borderColor: c.border }]}>
              <Text
                style={[
                  styles.centerText,
                  { color: c.text2, fontFamily: 'Inter_400Regular' },
                ]}
              >
                No data
              </Text>
            </View>
          ) : (
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.segment,
                  { flex: lentPct, backgroundColor: c.primary },
                ]}
              />
              <View
                style={[
                  styles.segment,
                  { flex: borrowedPct, backgroundColor: c.danger },
                ]}
              />
            </View>
          )}
        </View>
        <View style={styles.legendCol}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: c.primary }]} />
            <View>
              <Text
                style={[
                  styles.legendLabel,
                  { color: c.text2, fontFamily: 'Inter_400Regular' },
                ]}
              >
                Lent
              </Text>
              <Text
                style={[
                  styles.legendValue,
                  { color: c.primary, fontFamily: 'Inter_700Bold' },
                ]}
              >
                {currency}
                {fmt(lent)}
              </Text>
              <Text
                style={[
                  styles.legendPct,
                  { color: c.text3, fontFamily: 'Inter_400Regular' },
                ]}
              >
                {lentPct}%
              </Text>
            </View>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: c.danger }]} />
            <View>
              <Text
                style={[
                  styles.legendLabel,
                  { color: c.text2, fontFamily: 'Inter_400Regular' },
                ]}
              >
                Borrowed
              </Text>
              <Text
                style={[
                  styles.legendValue,
                  { color: c.danger, fontFamily: 'Inter_700Bold' },
                ]}
              >
                {currency}
                {fmt(borrowed)}
              </Text>
              <Text
                style={[
                  styles.legendPct,
                  { color: c.text3, fontFamily: 'Inter_400Regular' },
                ]}
              >
                {borrowedPct}%
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 16 },
  title: { fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  visual: { flex: 1 },
  ring: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: { fontSize: 11 },
  barContainer: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  segment: { height: 20 },
  legendCol: { gap: 16 },
  legendItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  legendLabel: { fontSize: 12 },
  legendValue: { fontSize: 16 },
  legendPct: { fontSize: 11 },
});
