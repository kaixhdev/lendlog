import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { MonthlyData } from '@/types';

interface Props {
  data: MonthlyData[];
}

export function BarChart({ data }: Props) {
  const c = useColors();
  const maxVal = Math.max(...data.map((d) => Math.max(d.lent, d.borrowed)), 1);

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
        Monthly Overview
      </Text>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: c.primary }]} />
          <Text
            style={[
              styles.legendText,
              { color: c.text2, fontFamily: 'Inter_400Regular' },
            ]}
          >
            Lent
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: c.danger }]} />
          <Text
            style={[
              styles.legendText,
              { color: c.text2, fontFamily: 'Inter_400Regular' },
            ]}
          >
            Borrowed
          </Text>
        </View>
      </View>
      <View style={styles.chart}>
        {data.map((d, i) => {
          const lentH = maxVal > 0 ? (d.lent / maxVal) * 100 : 0;
          const borrowedH = maxVal > 0 ? (d.borrowed / maxVal) * 100 : 0;
          return (
            <View key={i} style={styles.group}>
              <View style={styles.bars}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      { height: lentH, backgroundColor: c.primary },
                    ]}
                  />
                </View>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      { height: borrowedH, backgroundColor: c.danger },
                    ]}
                  />
                </View>
              </View>
              <Text
                style={[
                  styles.label,
                  { color: c.text3, fontFamily: 'Inter_400Regular' },
                ]}
              >
                {d.month}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 1,
  },
  title: { fontSize: 15 },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 4 },
  group: { flex: 1, alignItems: 'center', gap: 4 },
  bars: { flexDirection: 'row', gap: 2, alignItems: 'flex-end', height: 100 },
  barWrapper: { width: 10, height: 100, justifyContent: 'flex-end' },
  bar: { borderRadius: 3 },
  label: { fontSize: 10, textAlign: 'center' },
});
