import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useStorage } from "@/context/StorageContext";
import { useThemeContext } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { settings, saveSettings, getSummary, clearAllRecords, getPeople, records, restoreData } = useStorage();
  const { theme, toggleTheme } = useThemeContext();

  const [name, setName] = useState(settings.profileName);
  const [currency, setCurrency] = useState(settings.currency);
  const [editingName, setEditingName] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const topPad = Platform.OS === "web" ? 60 : insets.top;

  useEffect(() => {
    setName(settings.profileName);
    setCurrency(settings.currency);
  }, [settings.profileName, settings.currency]);

  const summary = getSummary();
  const people = getPeople();

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to set a profile photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await saveSettings({ profilePhoto: result.assets[0].uri });
    }
  };

  const removePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveSettings({ profilePhoto: undefined });
  };

  const handleSaveName = async () => {
    if (!name.trim()) { Alert.alert("Name required"); return; }
    await saveSettings({ profileName: name.trim() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditingName(false);
  };

  const handleSaveCurrency = async () => {
    await saveSettings({ currency: currency.trim() || "Rs." });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  /** Export all data to a dated .json file and open the system share sheet */
  const handleBackup = async () => {
    if (backingUp) return;
    setBackingUp(true);
    try {
      const payload = JSON.stringify(
        { records, settings, version: 1, exportedAt: new Date().toISOString() },
        null,
        2,
      );
      const dateStr = new Date().toISOString().split("T")[0]; // e.g. 2025-06-08
      const filename = `lendlog_backup_${dateStr}.json`;

      if (Platform.OS === "web") {
        // Web: download via browser
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Native: write to document directory then share
        const file = new File(Paths.document, filename);
        file.create({ overwrite: true });
        file.write(payload);
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(file.uri, {
            mimeType: "application/json",
            dialogTitle: "Save LendLog Backup",
            UTI: "public.json",
          });
        } else {
          Alert.alert("Backup saved", `File saved to:\n${file.uri}`);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Backup failed", "Unable to export backup data. Please try again.");
    } finally {
      setBackingUp(false);
    }
  };

  /** Pick a .json backup file from device storage and restore */
  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      if (Platform.OS === "web") {
        // Web: file input fallback
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const text = await file.text();
          parseAndConfirmRestore(text);
        };
        input.click();
        setRestoring(false);
        return;
      }

      // Native: use document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain", "text/json", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setRestoring(false);
        return;
      }

      const asset = result.assets[0];
      const file = new File(asset.uri);
      const content = await file.text();
      parseAndConfirmRestore(content);
    } catch {
      Alert.alert("Import failed", "Could not read the backup file. Make sure it is a valid LendLog backup (.json).");
    } finally {
      setRestoring(false);
    }
  };

  const parseAndConfirmRestore = (content: string) => {
    try {
      const data = JSON.parse(content.trim()) as { records?: unknown[]; settings?: Record<string, unknown> };
      if (!Array.isArray(data.records)) {
        Alert.alert("Invalid backup", "This file is not a valid LendLog backup.");
        return;
      }
      Alert.alert(
        "Restore data?",
        `This will replace ALL current data with ${data.records.length} record${data.records.length !== 1 ? "s" : ""} from the backup. This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            style: "destructive",
            onPress: async () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await restoreData(data.records as never, data.settings ?? {});
              Alert.alert("Restored!", "Your data has been restored successfully.");
            },
          },
        ],
      );
    } catch {
      Alert.alert("Invalid JSON", "Could not parse the backup file.");
    }
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
    Alert.alert("Done", "All records have been cleared.");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 8, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 90 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: c.text, fontFamily: "Inter_700Bold" }]}>Profile</Text>

      {/* Avatar card */}
      <View style={[styles.avatarCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Pressable onPress={pickPhoto} style={styles.avatarWrap}>
          {settings.profilePhoto ? (
            <Image source={{ uri: settings.profilePhoto }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <View style={[styles.avatarCircle, { backgroundColor: c.primary + "20", borderColor: c.primary + "40" }]}>
              <Text style={[styles.avatarInitial, { color: c.primary, fontFamily: "Inter_700Bold" }]}>
                {settings.profileName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.cameraBtn, { backgroundColor: c.primary }]}>
            <Feather name="camera" size={13} color="#000" />
          </View>
        </Pressable>

        {settings.profilePhoto && (
          <TouchableOpacity onPress={removePhoto} style={[styles.removePhotoBtn, { borderColor: c.border }]}>
            <Feather name="x" size={13} color={c.text3} />
            <Text style={[styles.removePhotoText, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Remove photo</Text>
          </TouchableOpacity>
        )}

        {editingName ? (
          <View style={styles.nameEditRow}>
            <TextInput
              value={name}
              onChangeText={setName}
              style={[styles.nameInput, { color: c.text, borderColor: c.primary, backgroundColor: c.card2, fontFamily: "Inter_600SemiBold" }]}
              autoFocus
              onSubmitEditing={handleSaveName}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={handleSaveName} style={[styles.iconBtn, { backgroundColor: c.primary }]}>
              <Feather name="check" size={16} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setName(settings.profileName); setEditingName(false); }}
              style={[styles.iconBtn, { borderColor: c.border, borderWidth: 1 }]}
            >
              <Feather name="x" size={16} color={c.text3} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.nameRow} onPress={() => setEditingName(true)}>
            <Text style={[styles.displayName, { color: c.text, fontFamily: "Inter_700Bold" }]}>{settings.profileName}</Text>
            <Feather name="edit-2" size={15} color={c.text3} />
          </TouchableOpacity>
        )}
      </View>

      {/* Currency */}
      <Section title="CURRENCY" c={c}>
        <Text style={[styles.label, { color: c.text3, fontFamily: "Inter_500Medium" }]}>SYMBOL</Text>
        <View style={styles.inlineRow}>
          <TextInput
            value={currency}
            onChangeText={setCurrency}
            style={[styles.inlineInput, { color: c.text, borderColor: c.border, backgroundColor: c.card2, fontFamily: "Inter_400Regular" }]}
            placeholder="Rs."
            placeholderTextColor={c.text3}
            maxLength={5}
            returnKeyType="done"
            onSubmitEditing={handleSaveCurrency}
          />
          <TouchableOpacity style={[styles.inlineBtn, { backgroundColor: c.primary }]} onPress={handleSaveCurrency}>
            <Text style={[styles.inlineBtnText, { fontFamily: "Inter_700Bold" }]}>Save</Text>
          </TouchableOpacity>
        </View>
      </Section>

      {/* Appearance */}
      <Section title="APPEARANCE" c={c}>
        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingLabel, { color: c.text, fontFamily: "Inter_500Medium" }]}>Dark Mode</Text>
            <Text style={[styles.settingDesc, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
              {theme === "dark" ? "Currently dark" : "Currently light"}
            </Text>
          </View>
          <Switch
            value={theme === "dark"}
            onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTheme(); }}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor="#fff"
          />
        </View>
      </Section>

      {/* Backup & Restore */}
      <Section title="BACKUP & RESTORE" c={c}>
        <Text style={[styles.backupDesc, { color: c.text2, fontFamily: "Inter_400Regular" }]}>
          Export all your records as a JSON file to keep a backup, or pick a previous backup file to restore your data.
        </Text>

        {/* Export */}
        <TouchableOpacity
          style={[styles.actionRow, { backgroundColor: c.primary + "15", borderColor: c.primary + "40", opacity: backingUp ? 0.6 : 1 }]}
          onPress={handleBackup}
          disabled={backingUp}
        >
          <View style={[styles.actionIcon, { backgroundColor: c.primary + "25" }]}>
            <Feather name="upload" size={18} color={c.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionLabel, { color: c.primary, fontFamily: "Inter_600SemiBold" }]}>
              {backingUp ? "Exporting…" : "Export Backup"}
            </Text>
            <Text style={[styles.actionDesc, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
              Save a JSON file with {records.length} record{records.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <Feather name="share" size={16} color={c.primary} />
        </TouchableOpacity>

        {/* Import */}
        <TouchableOpacity
          style={[styles.actionRow, { backgroundColor: c.blue + "15", borderColor: c.blue + "40", opacity: restoring ? 0.6 : 1 }]}
          onPress={handleRestore}
          disabled={restoring}
        >
          <View style={[styles.actionIcon, { backgroundColor: c.blue + "25" }]}>
            <Feather name="download" size={18} color={c.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionLabel, { color: c.blue, fontFamily: "Inter_600SemiBold" }]}>
              {restoring ? "Opening…" : "Import & Restore"}
            </Text>
            <Text style={[styles.actionDesc, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Pick a backup .json file from your device</Text>
          </View>
          <Feather name="folder" size={16} color={c.blue} />
        </TouchableOpacity>
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
        <TouchableOpacity
          style={[styles.actionRow, { backgroundColor: confirmClear ? c.danger + "30" : c.danger + "15", borderColor: confirmClear ? c.danger : c.danger + "40" }]}
          onPress={handleClearAll}
        >
          <View style={[styles.actionIcon, { backgroundColor: c.danger + "25" }]}>
            <Feather name={confirmClear ? "alert-triangle" : "trash-2"} size={18} color={c.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionLabel, { color: c.danger, fontFamily: "Inter_600SemiBold" }]}>
              {confirmClear ? "Tap again to confirm" : "Clear All Data"}
            </Text>
            <Text style={[styles.actionDesc, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
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
            <Text style={[styles.aboutVersion, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Version 1.0.2</Text>
          </View>
        </View>
        <Text style={[styles.aboutDesc, { color: c.text2, fontFamily: "Inter_400Regular" }]}>
          A personal lending tracker to keep tab of money you lend or borrow from friends and family.
        </Text>
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  children,
  c,
}: {
  title: string;
  children: React.ReactNode;
  c: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.text3, fontFamily: "Inter_600SemiBold" }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: c.card, borderColor: c.border }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 20 },
  pageTitle: { fontSize: 28, marginBottom: 4 },
  avatarCard: { borderRadius: 20, borderWidth: 1, padding: 20, alignItems: "center", gap: 12 },
  avatarWrap: { position: "relative" },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  avatarInitial: { fontSize: 38 },
  cameraBtn: { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  removePhotoBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  removePhotoText: { fontSize: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  displayName: { fontSize: 22 },
  nameEditRow: { flexDirection: "row", alignItems: "center", gap: 8, width: "100%" },
  nameInput: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 17 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, letterSpacing: 0.8 },
  sectionBody: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  label: { fontSize: 11, letterSpacing: 0.8 },
  inlineRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  inlineInput: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  inlineBtn: { height: 46, paddingHorizontal: 20, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  inlineBtnText: { fontSize: 14, color: "#000" },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingLabel: { fontSize: 15 },
  settingDesc: { fontSize: 13, marginTop: 2 },
  backupDesc: { fontSize: 13, lineHeight: 19 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 15, marginBottom: 2 },
  actionDesc: { fontSize: 12 },
  dataGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dataStat: { width: "47%", padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center", gap: 4 },
  dataStatValue: { fontSize: 24 },
  dataStatLabel: { fontSize: 12, textAlign: "center" },
  aboutRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  aboutIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  aboutName: { fontSize: 18 },
  aboutVersion: { fontSize: 13 },
  aboutDesc: { fontSize: 14, lineHeight: 20 },
});
