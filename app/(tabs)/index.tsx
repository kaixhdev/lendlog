import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal, Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddRecordModal } from "@/components/AddRecordModal";
import { FadeInView } from "@/components/FadeInView";
import { RecordCard } from "@/components/RecordCard";
import { StatCard } from "@/components/StatCard";
import { useStorage } from "@/context/StorageContext";
import { useColors } from "@/hooks/useColors";
import type { Record } from "@/types";

function fmt(n: number, currency: string) {
  if (Math.abs(n) >= 100000) return `${currency}${(Math.abs(n) / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `${currency}${(Math.abs(n) / 1000).toFixed(1)}K`;
  const hasDecimals = n % 1 !== 0;
  return `${currency}${Math.abs(n).toLocaleString("en-IN", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export default function HomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    records,
    settings,
    loading,
    hasCompletedOnboarding,
    markSettled,
    deleteRecord,
    getFilteredRecords,
    getSummary,
    refresh,
  } = useStorage();

  React.useEffect(() => {
    if (!loading && !hasCompletedOnboarding) {
      router.replace("/onboarding");
    }
  }, [loading, hasCompletedOnboarding, router]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"lent" | "borrowed">("lent");
  const [editRecord, setEditRecord] = useState<Record | null>(null);
  const [openPayment, setOpenPayment] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const summary = getSummary();
  const currency = settings.currency;
  const recentRecords = getFilteredRecords("all", "", "newest").slice(0, 5);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const openAdd = (type: "lent" | "borrowed") => {
    setShowFabMenu(false);
    setEditRecord(null);
    setModalType(type);
    setShowModal(true);
  };

  const openEdit = (record: Record) => {
    setEditRecord(record);
    setOpenPayment(false);
    setModalType(record.type);
    setShowModal(true);
  };

  const openPay = (record: Record) => {
    setEditRecord(record);
    setOpenPayment(true);
    setModalType(record.type);
    setShowModal(true);
  };

  const netColor = summary.netBalance > 0 ? c.primary : summary.netBalance < 0 ? c.danger : c.text2;
  const netLabel = summary.netBalance > 0 ? "People owe you money" : summary.netBalance < 0 ? "You owe money" : "All settled";

  if (loading || !hasCompletedOnboarding) {
    return null;
  }

  return (
    <FadeInView style={{ backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 10 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={[styles.appTitle, { color: c.text, fontFamily: "Inter_700Bold" }]}>LendLog</Text>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/profile"); }}
            style={[styles.profileBtn, { backgroundColor: c.card, borderColor: c.border }]}
            activeOpacity={0.8}
          >
            {settings.profilePhoto ? (
              <Image source={{ uri: settings.profilePhoto }} style={styles.profileImg} contentFit="cover" />
            ) : (
              <Text style={[styles.profileInitial, { color: c.primary, fontFamily: "Inter_700Bold" }]}>
                {settings.profileName.charAt(0).toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Hero Balance Card */}
        <View style={[styles.heroCard, { backgroundColor: c.greenCard, borderColor: c.border }]}>
          <Text style={[styles.heroLabel, { color: c.primary, fontFamily: "Inter_600SemiBold" }]}>NET BALANCE</Text>
          <Text style={[styles.heroAmount, { color: netColor, fontFamily: "Inter_700Bold" }]}>
            {summary.netBalance === 0 ? `${currency}0` : (summary.netBalance > 0 ? "+" : "-") + fmt(summary.netBalance, currency)}
          </Text>
          <Text style={[styles.heroSub, { color: c.text2, fontFamily: "Inter_400Regular" }]}>{netLabel}</Text>
          <View style={[styles.heroDivider, { backgroundColor: c.border }]} />
          <View style={styles.heroFooter}>
            <Text style={[styles.heroFooterText, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
              {summary.settlementRate}% settled
            </Text>
            <Text style={[styles.heroFooterText, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
              {summary.totalRecords} record{summary.totalRecords !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: c.text, fontFamily: "Inter_700Bold" }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {[
            { icon: "arrow-up-right", label: "Lent", color: c.primary, bg: c.primary + "20", action: () => openAdd("lent") },
            { icon: "arrow-down-left", label: "Borrowed", color: c.danger, bg: c.danger + "20", action: () => openAdd("borrowed") },
            { icon: "list", label: "History", color: c.blue, bg: c.blue + "20", action: () => router.push("/records") },
            { icon: "users", label: "People", color: c.orange, bg: c.orange + "20", action: () => router.push("/people") },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[styles.quickTile, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); item.action(); }}>
              <View style={[styles.quickIcon, { backgroundColor: item.bg }]}>
                <Feather name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={[styles.quickLabel, { color: c.text, fontFamily: "Inter_500Medium" }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard title="TOTAL LENT" value={fmt(summary.totalLent, currency)} color={c.primary} />
            <StatCard title="TOTAL BORROWED" value={fmt(summary.totalBorrowed, currency)} color={c.danger} />
          </View>
          <View style={styles.statsRow}>
            <StatCard title="RECEIVABLE" value={fmt(summary.pendingReceivable, currency)} color={c.blue} subtitle="pending" />
            <StatCard title="PAYABLE" value={fmt(summary.pendingPayable, currency)} color={c.orange} subtitle="pending" />
          </View>
        </View>

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { color: c.text, fontFamily: "Inter_700Bold" }]}>Recent Activity</Text>
        {recentRecords.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: c.card, borderColor: c.border }]}>
            <Feather name="inbox" size={32} color={c.text3} />
            <Text style={[styles.emptyTitle, { color: c.text2, fontFamily: "Inter_600SemiBold" }]}>No records yet</Text>
            <Text style={[styles.emptyText, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Tap + to add your first lending record</Text>
          </View>
        ) : (
          recentRecords.map(r => (
            <RecordCard
              key={r.id}
              record={r}
              currency={currency}
              onSettle={async (id) => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); await markSettled(id); }}
              onEdit={openEdit}
              onPay={openPay}
            />
          ))
        )}

        {records.length > 5 && (
          <TouchableOpacity
            style={[styles.seeAllBtn, { borderColor: c.border }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/records"); }}
          >
            <Text style={[styles.seeAllText, { color: c.primary, fontFamily: "Inter_600SemiBold" }]}>See All Records ({records.length})</Text>
            <Feather name="arrow-right" size={16} color={c.primary} />
          </TouchableOpacity>
        )}

        <View style={{ height: Platform.OS === "web" ? 100 : insets.bottom + 90 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: c.primary, bottom: Platform.OS === "web" ? 100 : insets.bottom + 80 }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowFabMenu(true); }}
      >
        <Feather name="plus" size={26} color="#000" />
      </TouchableOpacity>

      {/* FAB Menu Modal */}
      <Modal visible={showFabMenu} transparent animationType="fade" onRequestClose={() => setShowFabMenu(false)}>
        <Pressable style={styles.fabOverlay} onPress={() => setShowFabMenu(false)}>
          <View style={[styles.fabMenu, { backgroundColor: c.card, borderColor: c.border, bottom: Platform.OS === "web" ? 160 : insets.bottom + 140 }]}>
            <TouchableOpacity style={[styles.fabMenuBtn, { backgroundColor: c.primary }]} onPress={() => openAdd("lent")}>
              <Feather name="arrow-up-right" size={18} color="#000" />
              <Text style={[styles.fabMenuText, { color: "#000", fontFamily: "Inter_700Bold" }]}>I Lent Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.fabMenuBtn, { backgroundColor: c.danger }]} onPress={() => openAdd("borrowed")}>
              <Feather name="arrow-down-left" size={18} color="#fff" />
              <Text style={[styles.fabMenuText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>I Borrowed Money</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <AddRecordModal
        visible={showModal}
        onClose={() => { setShowModal(false); setEditRecord(null); setOpenPayment(false); }}
        initialType={modalType}
        editRecord={editRecord}
        openPayment={openPayment}
      />
    </FadeInView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  appTitle: { fontSize: 26, letterSpacing: -0.5 },
  profileBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  profileImg: { width: 38, height: 38, borderRadius: 19 },
  profileInitial: { fontSize: 17 },
  heroCard: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 6, alignItems: "center" },
  heroLabel: { fontSize: 12, letterSpacing: 1 },
  heroAmount: { fontSize: 48 },
  heroSub: { fontSize: 14 },
  heroDivider: { width: "100%", height: 1, marginVertical: 8 },
  heroFooter: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  heroFooterText: { fontSize: 13 },
  sectionTitle: { fontSize: 18, marginTop: 4 },
  quickActions: { flexDirection: "row", gap: 10 },
  quickTile: { flex: 1, alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1, gap: 8 },
  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 12 },
  statsGrid: { gap: 10 },
  statsRow: { flexDirection: "row", gap: 10 },
  emptyState: { padding: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16 },
  emptyText: { fontSize: 13, textAlign: "center" },
  seeAllBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  seeAllText: { fontSize: 15 },
  fab: { position: "absolute", right: 20, width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabOverlay: { flex: 1, justifyContent: "flex-end" },
  fabMenu: { position: "absolute", right: 20, left: 20, borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  fabMenuBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderRadius: 14 },
  fabMenuText: { fontSize: 16 },
});
