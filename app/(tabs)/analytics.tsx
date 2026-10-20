import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart } from "@/components/BarChart";
import { PieChart } from "@/components/PieChart";
import { StatCard } from "@/components/StatCard";
import { useStorage } from "@/context/StorageContext";
import { useColors } from "@/hooks/useColors";

function fmt(n: number, currency: string) {
  if (Math.abs(n) >= 100000) return `${currency}${(Math.abs(n) / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `${currency}${(Math.abs(n) / 1000).toFixed(1)}K`;
  const hasDecimals = n % 1 !== 0;
  return `${currency}${Math.abs(n).toLocaleString("en-IN", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export default function AnalyticsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { getSummary, getMonthlyData, getPeople, settings } = useStorage();

  const summary = getSummary();
  const monthlyData = getMonthlyData();
  const people = getPeople();
  const currency = settings.currency;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const topDebtors = people.filter(p => p.netBalance > 0).slice(0, 5);
  const topCreditors = people.filter(p => p.netBalance < 0).slice(0, 5);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: c.text, fontFamily: "Inter_700Bold" }]}>Analytics</Text>

      {/* Overview stats */}
      <View style={styles.statsRow}>
        <StatCard title="TOTAL LENT" value={fmt(summary.totalLent, currency)} color={c.primary} />
        <StatCard title="TOTAL BORROWED" value={fmt(summary.totalBorrowed, currency)} color={c.danger} />
      </View>
      <View style={styles.statsRow}>
        <StatCard title="RECEIVABLE" value={fmt(summary.pendingReceivable, currency)} color={c.blue} />
        <StatCard title="PAYABLE" value={fmt(summary.pendingPayable, currency)} color={c.orange} />
      </View>

      {/* Settlement rate */}
      <View style={[styles.settlementCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.settlementHeader}>
          <Text style={[styles.settlementTitle, { color: c.text, fontFamily: "Inter_600SemiBold" }]}>Settlement Rate</Text>
          <Text style={[styles.settlementPct, { color: c.primary, fontFamily: "Inter_700Bold" }]}>{summary.settlementRate}%</Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: c.border }]}>
          <View style={[styles.progressFill, { backgroundColor: c.primary, width: `${summary.settlementRate}%` }]} />
        </View>
        <Text style={[styles.settlementSub, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
          {summary.settledRecords} of {summary.totalRecords} records settled
        </Text>
      </View>

      {/* Pie chart */}
      <PieChart lent={summary.totalLent} borrowed={summary.totalBorrowed} currency={currency} />

      {/* Bar chart */}
      <BarChart data={monthlyData} />

      {/* Top debtors */}
      {topDebtors.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: c.text, fontFamily: "Inter_700Bold" }]}>Top Debtors</Text>
          <Text style={[styles.sectionSub, { color: c.text3, fontFamily: "Inter_400Regular" }]}>People who owe you</Text>
          {topDebtors.map((p, i) => (
            <View key={p.name} style={[styles.rankRow, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.rankNum, { backgroundColor: c.primary + "20" }]}>
                <Text style={[styles.rankNumText, { color: c.primary, fontFamily: "Inter_700Bold" }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rankName, { color: c.text, fontFamily: "Inter_600SemiBold" }]}>{p.name}</Text>
                <Text style={[styles.rankSub, { color: c.text3, fontFamily: "Inter_400Regular" }]}>{p.recordCount} records</Text>
              </View>
              <Text style={[styles.rankAmt, { color: c.primary, fontFamily: "Inter_700Bold" }]}>{fmt(p.netBalance, currency)}</Text>
            </View>
          ))}
        </>
      )}

      {/* Top creditors */}
      {topCreditors.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: c.text, fontFamily: "Inter_700Bold" }]}>Top Creditors</Text>
          <Text style={[styles.sectionSub, { color: c.text3, fontFamily: "Inter_400Regular" }]}>People you owe</Text>
          {topCreditors.map((p, i) => (
            <View key={p.name} style={[styles.rankRow, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.rankNum, { backgroundColor: c.danger + "20" }]}>
                <Text style={[styles.rankNumText, { color: c.danger, fontFamily: "Inter_700Bold" }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rankName, { color: c.text, fontFamily: "Inter_600SemiBold" }]}>{p.name}</Text>
                <Text style={[styles.rankSub, { color: c.text3, fontFamily: "Inter_400Regular" }]}>{p.recordCount} records</Text>
              </View>
              <Text style={[styles.rankAmt, { color: c.danger, fontFamily: "Inter_700Bold" }]}>{fmt(Math.abs(p.netBalance), currency)}</Text>
            </View>
          ))}
        </>
      )}

      {summary.totalRecords === 0 && (
        <View style={styles.empty}>
          <Feather name="bar-chart-2" size={40} color={c.text3} />
          <Text style={[styles.emptyTitle, { color: c.text2, fontFamily: "Inter_600SemiBold" }]}>No data yet</Text>
          <Text style={[styles.emptyText, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Add lending records to see analytics</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  title: { fontSize: 28 },
  statsRow: { flexDirection: "row", gap: 10 },
  settlementCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  settlementHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  settlementTitle: { fontSize: 15 },
  settlementPct: { fontSize: 22 },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4 },
  settlementSub: { fontSize: 12 },
  sectionTitle: { fontSize: 18, marginTop: 4 },
  sectionSub: { fontSize: 13, marginTop: -8 },
  rankRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, gap: 12, marginBottom: 6 },
  rankNum: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  rankNumText: { fontSize: 14 },
  rankName: { fontSize: 15 },
  rankSub: { fontSize: 12 },
  rankAmt: { fontSize: 18 },
  empty: { alignItems: "center", paddingTop: 40, gap: 8 },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: "center" },
});
