import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert, Animated, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useStorage } from "@/context/StorageContext";
import type { Record } from "@/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  initialType?: "lent" | "borrowed";
  editRecord?: Record | null;
  openPayment?: boolean;
}

function todayStr(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function AddRecordModal({ visible, onClose, initialType = "lent", editRecord, openPayment }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { createRecord, updateRecord, addPayment, deletePayment, getPeople, settings, records } = useStorage();
  const scrollRef = useRef<ScrollView>(null);
  const saveBtnScale = useRef(new Animated.Value(1)).current;

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"lent" | "borrowed">(initialType);
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payDate, setPayDate] = useState("");

  const activeRecord = editRecord ? (records.find(r => r.id === editRecord.id) ?? editRecord) : null;
  const isEdit = !!activeRecord;
  const people = getPeople();

  const modalTopPad = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight || 28) : 20);

  useEffect(() => {
    if (visible) {
      if (editRecord) {
        setName(editRecord.name);
        setAmount(String(editRecord.amount));
        setType(editRecord.type);
        setNote(editRecord.note);
        setDate(editRecord.date);
        setDueDate(editRecord.due_date);
      } else {
        setName("");
        setAmount("");
        setType(initialType);
        setNote("");
        setDate("");
        setDueDate("");
      }
      const shouldOpenPay = !!(openPayment && editRecord && !editRecord.settled);
      setShowPaymentForm(shouldOpenPay);
      setPayAmount("");
      setPayNote("");
      setPayDate("");
      if (shouldOpenPay) {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 350);
      }
    }
  }, [visible, editRecord, initialType, openPayment]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Name required", "Please enter the person's name."); return; }
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { Alert.alert("Valid amount required", "Please enter a positive amount."); return; }
    if (isEdit && activeRecord && amt < activeRecord.paid_amount) {
      Alert.alert(
        "Amount too low",
        `This record already has ${currency}${activeRecord.paid_amount} in recorded payments. The total amount cannot be less than payments already recorded.`
      );
      return;
    }
    
    Animated.sequence([
      Animated.timing(saveBtnScale, { toValue: 0.95, duration: 60, useNativeDriver: true }),
      Animated.timing(saveBtnScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isEdit && activeRecord) {
      await updateRecord(activeRecord.id, { name: name.trim(), amount: amt, type, note, date: date || todayStr(), due_date: dueDate });
    } else {
      await createRecord(name.trim(), amt, type, note, date, dueDate);
    }
    onClose();
  };

  const handleAddPayment = async () => {
    if (!activeRecord) return;
    const amt = parseFloat(payAmount);
    const remaining = activeRecord.amount - activeRecord.paid_amount;
    if (!payAmount || isNaN(amt) || amt <= 0) { Alert.alert("Enter valid amount"); return; }
    if (amt > remaining) { Alert.alert("Amount exceeds remaining balance"); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addPayment(activeRecord.id, amt, payNote, payDate);
    setShowPaymentForm(false);
    setPayAmount("");
    setPayNote("");
    setPayDate("");
  };

  const handleQuickAddAmount = (addVal: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentVal = parseFloat(amount) || 0;
    setAmount(String(currentVal + addVal));
  };

  const currency = settings.currency;
  const btnBgColor = type === "lent" ? c.primary : c.danger;
  const btnTextColor = type === "lent" ? "#000" : "#fff";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.container, { backgroundColor: c.background }]}>
          {/* Top Header with generous safe area padding so it sits below status bar & notch */}
          <View style={[styles.header, { paddingTop: modalTopPad + 12, paddingBottom: 14, borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={24} color={c.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: c.text, fontFamily: "Inter_700Bold" }]}>
              {isEdit ? "Edit Record" : "Add Record"}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_600SemiBold" }]}>TYPE</Text>
            <View style={[styles.typeRow, { backgroundColor: c.card, borderColor: c.border }]}>
              <Pressable
                style={[styles.typeBtn, type === "lent" && { backgroundColor: c.primary }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setType("lent"); }}
              >
                <Text style={[styles.typeBtnText, { color: type === "lent" ? "#000" : c.text2, fontFamily: "Inter_700Bold" }]}>
                  ↗ I Lent
                </Text>
              </Pressable>
              <Pressable
                style={[styles.typeBtn, type === "borrowed" && { backgroundColor: c.danger }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setType("borrowed"); }}
              >
                <Text style={[styles.typeBtnText, { color: type === "borrowed" ? "#fff" : c.text2, fontFamily: "Inter_700Bold" }]}>
                  ↙ I Borrowed
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_600SemiBold" }]}>PERSON NAME</Text>
            <TextInput
              placeholder="Who did you lend/borrow from?"
              placeholderTextColor={c.text3}
              value={name}
              onChangeText={setName}
              style={[styles.input, { backgroundColor: c.card2, borderColor: c.border, color: c.text, fontFamily: "Inter_400Regular" }]}
            />
            {/* Quick Contact Chips */}
            {people.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {people.slice(0, 6).map(p => (
                  <TouchableOpacity
                    key={p.name}
                    style={[styles.chip, { backgroundColor: name.toLowerCase() === p.name.toLowerCase() ? c.primary + "30" : c.card, borderColor: name.toLowerCase() === p.name.toLowerCase() ? c.primary : c.border }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setName(p.name); }}
                  >
                    <Text style={[styles.chipText, { color: name.toLowerCase() === p.name.toLowerCase() ? c.primary : c.text2, fontFamily: "Inter_500Medium" }]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_600SemiBold" }]}>AMOUNT ({currency})</Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor={c.text3}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={[styles.input, { backgroundColor: c.card2, borderColor: c.border, color: c.text, fontFamily: "Inter_400Regular" }]}
            />
            {/* Quick Amount Suggestion Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {[100, 500, 1000, 5000, 10000].map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.chip, { backgroundColor: c.card, borderColor: c.border }]}
                  onPress={() => handleQuickAddAmount(val)}
                >
                  <Text style={[styles.chipText, { color: c.primary, fontFamily: "Inter_600SemiBold" }]}>
                    +{currency}{val.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_600SemiBold" }]}>NOTE (optional)</Text>
            <TextInput
              placeholder="What's it for? (e.g. Dinner, Rent, Fuel)"
              placeholderTextColor={c.text3}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[styles.input, styles.textarea, { backgroundColor: c.card2, borderColor: c.border, color: c.text, fontFamily: "Inter_400Regular" }]}
            />

            <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_600SemiBold" }]}>DATE (DD/MM/YYYY)</Text>
            <TextInput
              placeholder="Leave blank for today"
              placeholderTextColor={c.text3}
              value={date}
              onChangeText={setDate}
              keyboardType="numeric"
              style={[styles.input, { backgroundColor: c.card2, borderColor: c.border, color: c.text, fontFamily: "Inter_400Regular" }]}
            />
            {/* Quick Date Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {[
                { label: "Today", value: todayStr(0) },
                { label: "Yesterday", value: todayStr(-1) },
                { label: "2 Days Ago", value: todayStr(-2) },
              ].map(item => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.chip, { backgroundColor: date === item.value ? c.primary + "30" : c.card, borderColor: date === item.value ? c.primary : c.border }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDate(item.value); }}
                >
                  <Text style={[styles.chipText, { color: date === item.value ? c.primary : c.text2, fontFamily: "Inter_500Medium" }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_600SemiBold" }]}>DUE DATE (optional)</Text>
            <TextInput
              placeholder="DD/MM/YYYY"
              placeholderTextColor={c.text3}
              value={dueDate}
              onChangeText={setDueDate}
              keyboardType="numeric"
              style={[styles.input, { backgroundColor: c.card2, borderColor: c.border, color: c.text, fontFamily: "Inter_400Regular" }]}
            />
            {/* Quick Due Date Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {[
                { label: "In 7 Days", value: todayStr(7) },
                { label: "In 15 Days", value: todayStr(15) },
                { label: "In 30 Days", value: todayStr(30) },
              ].map(item => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.chip, { backgroundColor: dueDate === item.value ? c.orange + "30" : c.card, borderColor: dueDate === item.value ? c.orange : c.border }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDueDate(item.value); }}
                >
                  <Text style={[styles.chipText, { color: dueDate === item.value ? c.orange : c.text2, fontFamily: "Inter_500Medium" }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isEdit && activeRecord && (
              <View style={styles.paySection}>
                <View style={[styles.divider, { backgroundColor: c.border }]} />
                <Text style={[styles.sectionTitle, { color: c.text, fontFamily: "Inter_700Bold" }]}>Payment History</Text>

                <View style={styles.payStats}>
                  <View style={[styles.payStat, { backgroundColor: c.card2, borderColor: c.border }]}>
                    <Text style={[styles.payStatLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Total</Text>
                    <Text style={[styles.payStatValue, { color: c.text, fontFamily: "Inter_700Bold" }]}>{currency}{activeRecord.amount.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.payStat, { backgroundColor: c.card2, borderColor: c.border }]}>
                    <Text style={[styles.payStatLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Paid</Text>
                    <Text style={[styles.payStatValue, { color: c.primary, fontFamily: "Inter_700Bold" }]}>{currency}{activeRecord.paid_amount.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.payStat, { backgroundColor: c.card2, borderColor: c.border }]}>
                    <Text style={[styles.payStatLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Left</Text>
                    <Text style={[styles.payStatValue, { color: c.danger, fontFamily: "Inter_700Bold" }]}>{currency}{(activeRecord.amount - activeRecord.paid_amount).toLocaleString()}</Text>
                  </View>
                </View>

                {activeRecord.paid_amount > 0 && (
                  <View style={[styles.progressBar, { backgroundColor: c.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: c.primary, width: `${Math.min(activeRecord.paid_amount / activeRecord.amount, 1) * 100}%` }]} />
                  </View>
                )}

                {activeRecord.payments.map(p => (
                  <View key={p.id} style={[styles.payRow, { backgroundColor: c.card2, borderColor: c.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.payAmt, { color: c.primary, fontFamily: "Inter_600SemiBold" }]}>{currency}{p.amount.toLocaleString()}</Text>
                      <Text style={[styles.payMeta, { color: c.text3, fontFamily: "Inter_400Regular" }]}>{p.date}{p.note ? ` • ${p.note}` : ""}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); deletePayment(activeRecord.id, p.id); }}>
                      <Feather name="trash-2" size={16} color={c.danger} />
                    </TouchableOpacity>
                  </View>
                ))}

                {!activeRecord.settled && (
                  showPaymentForm ? (
                    <View style={[styles.payForm, { backgroundColor: c.card, borderColor: c.border }]}>
                      <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_500Medium" }]}>PAYMENT AMOUNT</Text>
                      <TextInput
                        placeholder={`Max ${currency}${(activeRecord.amount - activeRecord.paid_amount).toLocaleString()}`}
                        placeholderTextColor={c.text3}
                        value={payAmount}
                        onChangeText={setPayAmount}
                        keyboardType="decimal-pad"
                        style={[styles.input, { backgroundColor: c.card2, borderColor: c.border, color: c.text, fontFamily: "Inter_400Regular" }]}
                      />
                      <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_500Medium" }]}>NOTE</Text>
                      <TextInput
                        placeholder="Optional"
                        placeholderTextColor={c.text3}
                        value={payNote}
                        onChangeText={setPayNote}
                        style={[styles.input, { backgroundColor: c.card2, borderColor: c.border, color: c.text, fontFamily: "Inter_400Regular" }]}
                      />
                      <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_500Medium" }]}>DATE</Text>
                      <TextInput
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor={c.text3}
                        value={payDate}
                        onChangeText={setPayDate}
                        keyboardType="numeric"
                        style={[styles.input, { backgroundColor: c.card2, borderColor: c.border, color: c.text, fontFamily: "Inter_400Regular" }]}
                      />
                      <View style={styles.payFormBtns}>
                        <TouchableOpacity style={[styles.ghostBtn, { borderColor: c.border }]} onPress={() => setShowPaymentForm(false)}>
                          <Text style={[styles.ghostBtnText, { color: c.text2, fontFamily: "Inter_500Medium" }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: c.primary }]} onPress={handleAddPayment}>
                          <Text style={[styles.primaryBtnText, { color: "#000", fontFamily: "Inter_700Bold" }]}>Add Payment</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.addPayBtn, { borderColor: c.blue + "50", backgroundColor: c.blue + "10" }]}
                      onPress={() => setShowPaymentForm(true)}
                    >
                      <Feather name="plus" size={16} color={c.blue} />
                      <Text style={[styles.addPayBtnText, { color: c.blue, fontFamily: "Inter_600SemiBold" }]}>Add Installment / Payment</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            )}

            {/* Prominent Bottom Save Action Button */}
            <View style={{ marginTop: 24, marginBottom: 20 }}>
              <Animated.View style={{ transform: [{ scale: saveBtnScale }] }}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={[styles.bottomSaveBtn, { backgroundColor: btnBgColor }]}
                  onPress={handleSave}
                >
                  <Feather name="check-circle" size={20} color={btnTextColor} />
                  <Text style={[styles.bottomSaveBtnText, { color: btnTextColor, fontFamily: "Inter_700Bold" }]}>
                    {isEdit ? "Save Changes" : type === "lent" ? "Save Lending Record" : "Save Borrowing Record"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, borderBottomWidth: 1 },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  title: { fontSize: 19 },
  form: { padding: 20, gap: 8 },
  label: { fontSize: 11, letterSpacing: 0.8, marginTop: 8 },
  input: { height: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  textarea: { height: 85, paddingTop: 14 },
  chipRow: { flexDirection: "row", gap: 6, paddingVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  chipText: { fontSize: 12 },
  typeRow: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  typeBtnText: { fontSize: 15 },
  divider: { height: 1, marginVertical: 16 },
  sectionTitle: { fontSize: 17, marginBottom: 8 },
  payStats: { flexDirection: "row", gap: 8, marginBottom: 10 },
  payStat: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  payStatLabel: { fontSize: 11 },
  payStatValue: { fontSize: 16, marginTop: 2 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: 6, borderRadius: 3 },
  payRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
  payAmt: { fontSize: 15 },
  payMeta: { fontSize: 12, marginTop: 2 },
  paySection: { marginTop: 8 },
  payForm: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8, marginTop: 10 },
  payFormBtns: { flexDirection: "row", gap: 8, marginTop: 10 },
  ghostBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  ghostBtnText: { fontSize: 14 },
  primaryBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  primaryBtnText: { fontSize: 14 },
  addPayBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 8 },
  addPayBtnText: { fontSize: 14 },
  bottomSaveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, width: "100%", elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
  bottomSaveBtnText: { fontSize: 16 },
});
