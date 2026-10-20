import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddRecordModal } from "@/components/AddRecordModal";
import { FadeInView } from "@/components/FadeInView";
import { RecordCard } from "@/components/RecordCard";
import { useStorage } from "@/context/StorageContext";
import { useColors } from "@/hooks/useColors";
import type { FilterType, Record, SortType } from "@/types";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Lent", value: "lent" },
  { label: "Borrowed", value: "borrowed" },
  { label: "Pending", value: "pending" },
  { label: "Settled", value: "settled" },
];

const SORTS: { label: string; value: SortType }[] = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Highest", value: "highest" },
  { label: "Lowest", value: "lowest" },
];

export default function RecordsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { markSettled, deleteRecord, getFilteredRecords, getSummary, settings } = useStorage();

  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [search, setSearch] = useState("");
  const [editRecord, setEditRecord] = useState<Record | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);

  const records = getFilteredRecords(filter, search, sort);
  const summary = getSummary();
  const currency = settings.currency;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function fmt(n: number) {
    if (Math.abs(n) >= 100000) return `${currency}${(Math.abs(n) / 100000).toFixed(1)}L`;
    if (Math.abs(n) >= 1000) return `${currency}${(Math.abs(n) / 1000).toFixed(1)}K`;
    const hasDecimals = n % 1 !== 0;
    return `${currency}${Math.abs(n).toLocaleString("en-IN", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;
  }

  return (
    <FadeInView style={{ backgroundColor: c.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: c.background, borderBottomColor: c.border }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: c.text, fontFamily: "Inter_700Bold" }]}>Transactions</Text>
          <View style={[styles.badge, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.badgeText, { color: c.text2, fontFamily: "Inter_600SemiBold" }]}>{records.length}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="search" size={16} color={c.text3} />
          <TextInput
            placeholder="Search by name or note..."
            placeholderTextColor={c.text3}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: c.text, fontFamily: "Inter_400Regular" }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={c.text3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Summary strip */}
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: c.primary, fontFamily: "Inter_700Bold" }]}>{fmt(summary.totalLent)}</Text>
            <Text style={[styles.summaryLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>lent</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: c.danger, fontFamily: "Inter_700Bold" }]}>{fmt(summary.totalBorrowed)}</Text>
            <Text style={[styles.summaryLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>borrowed</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: c.blue, fontFamily: "Inter_700Bold" }]}>{fmt(summary.pendingReceivable)}</Text>
            <Text style={[styles.summaryLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>pending</Text>
          </View>
        </View>

        {/* Filter chips */}
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={i => i.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(item.value); }}
              style={[styles.chip, { backgroundColor: filter === item.value ? c.primary : c.card, borderColor: filter === item.value ? c.primary : c.border }]}
            >
              <Text style={[styles.chipText, { color: filter === item.value ? "#000" : c.text2, fontFamily: "Inter_600SemiBold" }]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Sort chips */}
        <FlatList
          horizontal
          data={SORTS}
          keyExtractor={i => i.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSort(item.value); }}
              style={[styles.chip, { backgroundColor: sort === item.value ? c.card2 : "transparent", borderColor: sort === item.value ? c.primary : c.border }]}
            >
              <Text style={[styles.chipText, { color: sort === item.value ? c.primary : c.text3, fontFamily: "Inter_500Medium" }]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* List */}
      <FlatList
        data={records}
        keyExtractor={r => r.id}
        scrollEnabled={records.length > 0}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 90 }]}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={c.text3} />
            <Text style={[styles.emptyTitle, { color: c.text2, fontFamily: "Inter_600SemiBold" }]}>No records found</Text>
            <Text style={[styles.emptyText, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
              {search ? "Try a different search term" : "Change filter or add a record"}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <RecordCard
            record={item}
            currency={currency}
            onSettle={async id => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); await markSettled(id); }}
            onEdit={r => { setOpenPayment(false); setEditRecord(r); setShowModal(true); }}
            onPay={r => { setOpenPayment(true); setEditRecord(r); setShowModal(true); }}
            onDelete={async id => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); await deleteRecord(id); }}
          />
        )}
      />

      <AddRecordModal
        visible={showModal}
        onClose={() => { setShowModal(false); setEditRecord(null); setOpenPayment(false); }}
        initialType={editRecord?.type ?? "lent"}
        editRecord={editRecord}
        openPayment={openPayment}
      />
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 6, borderBottomWidth: 1, gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 28 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 13 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, height: 44, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, height: 44 },
  summaryStrip: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  summaryItem: { flex: 1, alignItems: "center", gap: 2 },
  summaryVal: { fontSize: 16 },
  summaryLabel: { fontSize: 11 },
  summaryDivider: { width: 1, height: 30, marginHorizontal: 8 },
  chips: { gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  list: { padding: 16, gap: 0 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: "center" },
});
