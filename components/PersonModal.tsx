import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useStorage } from "@/context/StorageContext";
import type { PersonStats, Record } from "@/types";

interface Props {
  person: PersonStats | null;
  visible: boolean;
  onClose: () => void;
  onEditRecord: (record: Record) => void;
}

function fmt(n: number, currency: string) {
  const hasDecimals = n % 1 !== 0;
  return `${currency}${Math.abs(n).toLocaleString("en-IN", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function PersonModal({ person, visible, onClose, onEditRecord }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { settleAllFor, deleteAllFor, renamePerson, settings } = useStorage();
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSettle, setConfirmSettle] = useState(false);
  const currency = settings.currency;

  if (!person) return null;

  const modalTopPad = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight || 28) : 20);
  const netPositive = person.netBalance >= 0;
  const netColor = person.netBalance === 0 ? c.text2 : netPositive ? c.primary : c.danger;
  const recentRecords = [...person.records].sort((a, b) => b.created.localeCompare(a.created)).slice(0, 8);

  const handleSettleAll = async () => {
    if (!confirmSettle) {
      setConfirmSettle(true);
      setTimeout(() => setConfirmSettle(false), 4000);
      return;
    }
    setConfirmSettle(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await settleAllFor(person.name);
    onClose();
  };

  const handleDeleteAll = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setConfirmDelete(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await deleteAllFor(person.name);
    onClose();
  };

  const handleRename = async () => {
    if (!newName.trim()) return;
    await renamePerson(person.name, newName.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowRename(false);
    setNewName("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: modalTopPad + 12, paddingBottom: 14, borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.iconBtn}>
            <Feather name="x" size={22} color={c.text2} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.text, fontFamily: "Inter_700Bold" }]}>{person.name}</Text>
          <TouchableOpacity onPress={() => { setShowRename(true); setNewName(person.name); }} activeOpacity={0.7} style={styles.iconBtn}>
            <Feather name="edit-2" size={20} color={c.text2} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={[styles.netCard, { backgroundColor: c.greenCard, borderColor: c.border }]}>
            <Text style={[styles.netLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>NET BALANCE</Text>
            <Text style={[styles.netValue, { color: netColor, fontFamily: "Inter_700Bold" }]}>
              {person.netBalance === 0 ? "All Settled" : (netPositive ? "+" : "-") + fmt(person.netBalance, currency)}
            </Text>
            <Text style={[styles.netSub, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
              {person.netBalance > 0 ? `${person.name} owes you` : person.netBalance < 0 ? `You owe ${person.name}` : "No pending amounts"}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.stat, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.statLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Total Lent</Text>
              <Text style={[styles.statValue, { color: c.primary, fontFamily: "Inter_700Bold" }]}>{fmt(person.totalLent, currency)}</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.statLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Total Borrowed</Text>
              <Text style={[styles.statValue, { color: c.danger, fontFamily: "Inter_700Bold" }]}>{fmt(person.totalBorrowed, currency)}</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.statLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Records</Text>
              <Text style={[styles.statValue, { color: c.text, fontFamily: "Inter_700Bold" }]}>{person.recordCount}</Text>
            </View>
          </View>

          {showRename && (
            <View style={[styles.renameBox, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.renameLabel, { color: c.text2, fontFamily: "Inter_500Medium" }]}>NEW NAME</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                style={[styles.renameInput, { color: c.text, borderColor: c.border, backgroundColor: c.card2, fontFamily: "Inter_400Regular" }]}
                placeholder="Enter new name"
                placeholderTextColor={c.text3}
                autoFocus
              />
              <View style={styles.renameBtns}>
                <TouchableOpacity style={[styles.ghostBtn, { borderColor: c.border }]} onPress={() => setShowRename(false)}>
                  <Text style={[styles.ghostBtnText, { color: c.text2, fontFamily: "Inter_500Medium" }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: c.primary }]} onPress={handleRename}>
                  <Text style={[styles.primaryBtnText, { color: "#000", fontFamily: "Inter_700Bold" }]}>Rename</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: c.text, fontFamily: "Inter_600SemiBold" }]}>Recent Transactions</Text>
          {recentRecords.map(r => {
            const acc = r.type === "lent" ? c.primary : c.danger;
            return (
              <Pressable key={r.id} onPress={() => { onClose(); setTimeout(() => onEditRecord(r), 300); }}>
                <View style={[styles.txRow, { backgroundColor: c.card, borderColor: c.border }]}>
                  <View style={[styles.txAccent, { backgroundColor: acc }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.txType, { color: acc, fontFamily: "Inter_600SemiBold" }]}>{r.type === "lent" ? "Lent" : "Borrowed"}</Text>
                    <Text style={[styles.txDate, { color: c.text3, fontFamily: "Inter_400Regular" }]}>{r.date}{r.note ? ` • ${r.note}` : ""}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.txAmt, { color: acc, fontFamily: "Inter_700Bold" }]}>{fmt(r.amount, currency)}</Text>
                    {r.settled && <Text style={[styles.txSettled, { color: c.primary, fontFamily: "Inter_500Medium" }]}>Settled</Text>}
                  </View>
                </View>
              </Pressable>
            );
          })}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: confirmSettle ? c.primary + "30" : c.primary + "15", borderColor: confirmSettle ? c.primary : c.primary + "30" }]} onPress={handleSettleAll}>
              <Feather name={confirmSettle ? "alert-circle" : "check-circle"} size={16} color={c.primary} />
              <Text style={[styles.actionText, { color: c.primary, fontFamily: "Inter_600SemiBold" }]}>
                {confirmSettle ? "Confirm?" : "Settle All"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: confirmDelete ? c.danger + "30" : c.danger + "15", borderColor: confirmDelete ? c.danger : c.danger + "30" }]} onPress={handleDeleteAll}>
              <Feather name={confirmDelete ? "alert-triangle" : "trash-2"} size={16} color={c.danger} />
              <Text style={[styles.actionText, { color: c.danger, fontFamily: "Inter_600SemiBold" }]}>
                {confirmDelete ? "Confirm?" : "Delete All"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderBottomWidth: 1 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18 },
  body: { padding: 16, gap: 12 },
  netCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 4 },
  netLabel: { fontSize: 11, letterSpacing: 0.8 },
  netValue: { fontSize: 36 },
  netSub: { fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "center", gap: 4 },
  statLabel: { fontSize: 10, textAlign: "center" },
  statValue: { fontSize: 16 },
  renameBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  renameLabel: { fontSize: 11, letterSpacing: 0.8 },
  renameInput: { height: 46, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 15 },
  renameBtns: { flexDirection: "row", gap: 8 },
  ghostBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  ghostBtnText: { fontSize: 14 },
  primaryBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  primaryBtnText: { fontSize: 14 },
  sectionTitle: { fontSize: 16, marginTop: 4 },
  txRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, overflow: "hidden", marginBottom: 6 },
  txAccent: { width: 4, height: "100%", minHeight: 50 },
  txType: { fontSize: 14, paddingLeft: 10, paddingTop: 10 },
  txDate: { fontSize: 12, paddingLeft: 10, paddingBottom: 10 },
  txAmt: { fontSize: 16, paddingRight: 12, paddingTop: 10 },
  txSettled: { fontSize: 11, paddingRight: 12, paddingBottom: 10 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 14, borderRadius: 12, borderWidth: 1 },
  actionText: { fontSize: 14 },
});
