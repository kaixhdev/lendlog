import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Record } from "@/types";

interface Props {
  record: Record;
  currency: string;
  onSettle: (id: string) => void;
  onEdit: (record: Record) => void;
  onPay: (record: Record) => void;
  onDelete?: (id: string) => void;
}

function fmt(n: number, currency: string) {
  const hasDecimals = n % 1 !== 0;
  return `${currency}${n.toLocaleString("en-IN", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function RecordCard({ record, currency, onSettle, onEdit, onPay, onDelete }: Props) {
  const c = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const accentColor = record.type === "lent" ? c.primary : c.danger;
  const remaining = record.amount - record.paid_amount;
  const progressPct = record.amount > 0 ? Math.min(record.paid_amount / record.amount, 1) : 0;

  useEffect(() => {
    try {
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    } catch {}
  }, []);

  const ActionBtn = ({
    icon, label, color, onPress,
  }: { icon: string; label: string; color: string; onPress: () => void }) => {
    const pressAnim = useRef(new Animated.Value(1)).current;

    const tapFade = () => {
      try {
        Animated.sequence([
          Animated.timing(pressAnim, { toValue: 0.45, duration: 60, useNativeDriver: true }),
          Animated.timing(pressAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start();
      } catch {}
    };

    return (
      <TouchableOpacity
        activeOpacity={1}
        style={[styles.actionBtn, { backgroundColor: color + "15", borderColor: color + "30" }]}
        onPress={() => {
          tapFade();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <Animated.View style={[styles.actionBtnInner, { opacity: pressAnim }]}>
          <Feather name={icon as any} size={13} color={color} />
          <Text style={[styles.actionText, { color, fontFamily: "Inter_600SemiBold" }]}>{label}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.accent, { backgroundColor: accentColor }]} />
          <View style={styles.body}>
            <View style={styles.topRow}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: c.text, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>{record.name}</Text>
                {record.settled && (
                  <View style={[styles.badge, { backgroundColor: c.primary + "22", borderColor: c.primary + "44" }]}>
                    <Text style={[styles.badgeText, { color: c.primary, fontFamily: "Inter_600SemiBold" }]}>SETTLED</Text>
                  </View>
                )}
                {!record.settled && record.due_date ? (
                  <View style={[styles.badge, { backgroundColor: c.orange + "22", borderColor: c.orange + "44" }]}>
                    <Text style={[styles.badgeText, { color: c.orange, fontFamily: "Inter_500Medium" }]}>Due {record.due_date}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.amount, { color: accentColor, fontFamily: "Inter_700Bold" }]}>{fmt(record.amount, currency)}</Text>
            </View>

            <View style={styles.metaRow}>
              <View style={[styles.typeTag, { backgroundColor: accentColor + "20" }]}>
                <Text style={[styles.typeText, { color: accentColor, fontFamily: "Inter_600SemiBold" }]}>
                  {record.type === "lent" ? "I LENT" : "I BORROWED"}
                </Text>
              </View>
              <Text style={[styles.date, { color: c.text2, fontFamily: "Inter_400Regular" }]}>{record.date}</Text>
            </View>

            {record.note ? <Text style={[styles.note, { color: c.text2, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>{record.note}</Text> : null}

            {record.paid_amount > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                  <Text style={[styles.progressLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
                    Paid {fmt(record.paid_amount, currency)}
                  </Text>
                  <Text style={[styles.progressLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
                    Left {fmt(Math.max(0, remaining), currency)}
                  </Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: c.border }]}>
                  <View style={[styles.progressFill, { backgroundColor: accentColor, width: `${progressPct * 100}%` }]} />
                </View>
              </View>
            )}

            <View style={styles.actions}>
              <ActionBtn
                icon={record.settled ? "rotate-ccw" : "check"}
                label={record.settled ? "Unsettle" : "Settle"}
                color={c.primary}
                onPress={() => onSettle(record.id)}
              />
              {!record.settled && (
                <ActionBtn icon="plus" label="Pay" color={c.blue} onPress={() => onPay(record)} />
              )}
              <ActionBtn icon="edit-2" label="Edit" color={c.orange} onPress={() => onEdit(record)} />
              {onDelete && (
                <ActionBtn icon="trash-2" label="Delete" color={c.danger} onPress={() => onDelete(record.id)} />
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  accent: { width: 4 },
  body: { flex: 1, padding: 14, gap: 6 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  nameRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginRight: 8 },
  name: { fontSize: 16 },
  amount: { fontSize: 18 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 10, letterSpacing: 0.5 },
  date: { fontSize: 12 },
  note: { fontSize: 13, lineHeight: 18 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  badgeText: { fontSize: 9, letterSpacing: 0.5 },
  progressSection: { gap: 4 },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 11 },
  progressBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  actions: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 2 },
  actionBtn: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  actionBtnInner: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  actionText: { fontSize: 12 },
});
