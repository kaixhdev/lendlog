import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { PersonStats } from "@/types";

interface Props {
  person: PersonStats;
  currency: string;
  onTap: (person: PersonStats) => void;
  onLongPress: (person: PersonStats) => void;
}

function fmt(n: number, currency: string) {
  const hasDecimals = n % 1 !== 0;
  return `${currency}${Math.abs(n).toLocaleString("en-IN", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function PersonCard({ person, currency, onTap, onLongPress }: Props) {
  const c = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const initial = person.name.charAt(0).toUpperCase();
  const netPositive = person.netBalance >= 0;
  const netColor = person.netBalance === 0 ? c.text2 : netPositive ? c.primary : c.danger;
  const avatarColor = netPositive ? c.primary : c.danger;

  useEffect(() => {
    try {
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    } catch {}
  }, []);

  const handlePressIn = () => {
    try {
      Animated.timing(pressAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }).start();
    } catch {}
  };

  const handlePressOut = () => {
    try {
      Animated.timing(pressAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
    } catch {}
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onTap(person); }}
        onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onLongPress(person); }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, transform: [{ scale: pressAnim }] }]}>
          <View style={[styles.avatar, { backgroundColor: avatarColor + "20", borderColor: avatarColor + "40", borderWidth: 1.5 }]}>
            <Text style={[styles.initial, { color: avatarColor, fontFamily: "Inter_700Bold" }]}>{initial}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: c.text, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>{person.name}</Text>
            <Text style={[styles.sub, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
              {person.recordCount} record{person.recordCount !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.right}>
            <Text style={[styles.balance, { color: netColor, fontFamily: "Inter_700Bold" }]}>
              {person.netBalance === 0 ? "Settled" : (netPositive ? "+" : "-") + fmt(person.netBalance, currency)}
            </Text>
            <Text style={[styles.balanceSub, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
              {person.netBalance === 0 ? "all clear" : netPositive ? "owes you" : "you owe"}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={c.text3} style={{ marginLeft: 4 }} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  initial: { fontSize: 18 },
  info: { flex: 1 },
  name: { fontSize: 16 },
  sub: { fontSize: 12, marginTop: 2 },
  right: { alignItems: "flex-end" },
  balance: { fontSize: 16 },
  balanceSub: { fontSize: 11, marginTop: 2 },
});
