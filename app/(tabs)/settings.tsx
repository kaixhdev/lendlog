import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStorage } from "@/context/StorageContext";
import { useThemeContext } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { settings, saveSettings, getSummary, clearAllRecords, getPeople } = useStorage();
  const { theme, toggleTheme } = useThemeContext();

  const [name, setName] = useState(settings.profileName);
  const [currency, setCurrency] = useState(settings.currency);
  const [confirmClear, setConfirmClear] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    setName(settings.profileName);
    setCurrency(settings.currency);
  }, [settings.profileName, settings.currency]);

  const summary = getSummary();
  const people = getPeople();

  const handleSaveProfile = async () => {
    if (!name.trim()) { Alert.alert("Name required"); return; }
    await saveSettings({ profileName: name.trim(), currency: currency.trim() || "Rs." });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Profile saved");
  };

  const handleClearAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    setConfirmClear(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await clearAllRecords();
    Alert.alert("Done", "All records cleared.");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: c.text, fontFamily: "Inter_700Bold" }]}>Settings</Text>

      {/* Profile */}
      <Section title="PROFILE" c={c}>
        <Text style={[styles.label, { color: c.text3, fontFamily: "Inter_500Medium" }]}>YOUR NAME</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.card2, fontFamily: "Inter_400Regular" }]}
          placeholder="Your name"
          placeholderTextColor={c.text3}
        />
        <Text style={[styles.label, { color: c.text3, fontFamily: "Inter_500Medium" }]}>CURRENCY SYMBOL</Text>
        <TextInput
          value={currency}
          onChangeText={setCurrency}
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.card2, fontFamily: "Inter_400Regular" }]}
          placeholder="Rs."
          placeholderTextColor={c.text3}
          maxLength={5}
        />
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: c.primary }]} onPress={handleSaveProfile}>
          <Text style={[styles.primaryBtnText, { color: "#000", fontFamily: "Inter_700Bold" }]}>Save Profile</Text>
        </TouchableOpacity>
      </Section>

      {/* Appearance */}
      <Section title="APPEARANCE" c={c}>
        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingLabel, { color: c.text, fontFamily: "Inter_500Medium" }]}>Dark Mode</Text>
            <Text style={[styles.settingDesc, { color: c.text3, fontFamily: "Inter_400Regular" }]}>{theme === "dark" ? "Currently dark" : "Currently light"}</Text>
          </View>
          <Switch
            value={theme === "dark"}
            onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTheme(); }}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor={"#fff"}
          />
        </View>
      </Section>

      {/* Data summary */}
      <Section title="DATA SUMMARY" c={c}>
        <View style={styles.dataGrid}>
          {[
            { label: "Total Records", value: String(summary.totalRecords), color: c.text },
            { label: "Settled", value: String(summary.settledRecords), color: c.primary },
            { label: "Pending", value: String(summary.totalRecords - summary.settledRecords), color: c.orange },
            { label: "People", value: String(people.length), color: c.blue },
          ].map((item, i) => (
            <View key={i} style={[styles.dataStat, { backgroundColor: c.card2, borderColor: c.border }]}>
              <Text style={[styles.dataStatValue, { color: item.color, fontFamily: "Inter_700Bold" }]}>{item.value}</Text>
              <Text style={[styles.dataStatLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Danger zone */}
      <Section title="DANGER ZONE" c={c}>
        <TouchableOpacity style={[styles.dangerBtn, { backgroundColor: confirmClear ? c.danger + "30" : c.danger + "15", borderColor: confirmClear ? c.danger : c.danger + "40" }]} onPress={handleClearAll}>
          <Feather name={confirmClear ? "alert-triangle" : "trash-2"} size={18} color={c.danger} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.dangerLabel, { color: c.danger, fontFamily: "Inter_600SemiBold" }]}>
              {confirmClear ? "Tap again to confirm" : "Clear All Data"}
            </Text>
            <Text style={[styles.dangerDesc, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
              {confirmClear ? "This cannot be undone — all records will be deleted" : "Permanently delete all lending records"}
            </Text>
          </View>
        </TouchableOpacity>
      </Section>

      {/* About */}
      <Section title="ABOUT" c={c}>
        <View style={styles.aboutRow}>
          <View style={[styles.aboutIcon, { backgroundColor: c.primary + "20" }]}>
            <Feather name="book-open" size={22} color={c.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.aboutName, { color: c.text, fontFamily: "Inter_700Bold" }]}>LendLog</Text>
            <Text style={[styles.aboutVersion, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Version 1.0.1</Text>
          </View>
        </View>
        <Text style={[styles.aboutDesc, { color: c.text2, fontFamily: "Inter_400Regular" }]}>
          A personal lending tracker to keep tab of money you lend or borrow from friends and family.
        </Text>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children, c }: { title: string; children: React.ReactNode; c: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.text3, fontFamily: "Inter_600SemiBold" }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: c.card, borderColor: c.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 20 },
  title: { fontSize: 28 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, letterSpacing: 0.8 },
  sectionBody: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  label: { fontSize: 11, letterSpacing: 0.8 },
  input: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  primaryBtn: { borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  primaryBtnText: { fontSize: 15 },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingLabel: { fontSize: 15 },
  settingDesc: { fontSize: 13, marginTop: 2 },
  dataGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dataStat: { width: "47%", padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center", gap: 4 },
  dataStatValue: { fontSize: 24 },
  dataStatLabel: { fontSize: 12, textAlign: "center" },
  dangerBtn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  dangerLabel: { fontSize: 15 },
  dangerDesc: { fontSize: 12, marginTop: 2 },
  aboutRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  aboutIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  aboutName: { fontSize: 18 },
  aboutVersion: { fontSize: 13 },
  aboutDesc: { fontSize: 14, lineHeight: 20 },
});
