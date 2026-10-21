import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useStorage } from "@/context/StorageContext";
import { ThemePreference, useThemeContext } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

const CURRENCY_OPTIONS = [
  { symbol: "₹", name: "INR - Indian Rupee", desc: "Default for India" },
  { symbol: "$", name: "USD - US Dollar", desc: "United States" },
  { symbol: "€", name: "EUR - Euro", desc: "European Union" },
  { symbol: "£", name: "GBP - British Pound", desc: "United Kingdom" },
  { symbol: "AED", name: "AED - UAE Dirham", desc: "United Arab Emirates" },
  { symbol: "CA$", name: "CAD - Canadian Dollar", desc: "Canada" },
  { symbol: "A$", name: "AUD - Australian Dollar", desc: "Australia" },
  { symbol: "Rs.", name: "Rs. - Rupee (Classic)", desc: "Classic notation" },
];

export default function OnboardingScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, completeOnboarding, saveSettings } = useStorage();
  const { themePreference, setThemePreference } = useThemeContext();

  // Wizard state: 1 to 6
  const [step, setStep] = useState(1);
  const [profileName, setProfileName] = useState(settings.profileName && settings.profileName !== "Friend" ? settings.profileName : "");
  const [currency, setCurrency] = useState(settings.currency || "₹");
  const [customCurrency, setCustomCurrency] = useState("");
  const [isCustomCurrency, setIsCustomCurrency] = useState(
    !CURRENCY_OPTIONS.some(o => o.symbol === (settings.currency || "₹"))
  );
  const [selectedTheme, setSelectedTheme] = useState<ThemePreference>(themePreference || "dark");

  const effectiveCurrency = isCustomCurrency ? (customCurrency.trim() || "₹") : currency;
  const hasSelectedCurrency = isCustomCurrency
    ? customCurrency.trim().length > 0
    : Boolean(currency);

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(prev => Math.min(6, prev + 1));
  };

  const prevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleCurrencyContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const chosen = effectiveCurrency.trim() || "₹";
    await saveSettings({ currency: chosen });
    nextStep();
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await completeOnboarding({
      profileName: profileName.trim() || "Friend",
      currency: effectiveCurrency,
      theme: selectedTheme,
    });
    router.replace("/(tabs)");
  };

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeOnboarding({
      profileName: profileName.trim() || "Friend",
      currency: effectiveCurrency,
      theme: selectedTheme,
    });
    router.replace("/(tabs)");
  };

  const handleSelectTheme = async (mode: ThemePreference) => {
    setSelectedTheme(mode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setThemePreference(mode);
  };

  const handleSelectCurrency = (sym: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCustomCurrency(false);
    setCurrency(sym);
  };

  const handleChooseCustomCurrency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCustomCurrency(true);
    if (!customCurrency && currency) {
      setCustomCurrency(currency);
    }
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 12);
  const stickyBottomPadding = Math.max(insets.bottom, 16);
  const scrollBottomPadding = step === 3
    ? stickyBottomPadding + 88
    : insets.bottom + 20;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding, paddingBottom: scrollBottomPadding },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with step progress */}
        {step > 1 && (
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={prevStep}
              style={[styles.backBtn, { borderColor: c.border, backgroundColor: c.card }]}
              accessibilityLabel="Back to previous step"
            >
              <Feather name="arrow-left" size={18} color={c.text} />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <Text style={[styles.progressText, { color: c.text3, fontFamily: "Inter_600SemiBold" }]}>
                {step === 6 ? "SUMMARY" : `STEP ${step - 1} OF 5`}
              </Text>
              <View style={[styles.progressBarTrack, { backgroundColor: c.border }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: c.primary,
                      width: `${((step - 1) / 5) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={[styles.skipBtnText, { color: c.text3, fontFamily: "Inter_500Medium" }]}>
                Skip
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.welcomeHero}>
              <View style={[styles.logoBadge, { backgroundColor: c.primary + "18" }]}>
                <Feather name="book-open" size={44} color={c.primary} />
              </View>
              <Text style={[styles.title, { color: c.text, fontFamily: "Inter_700Bold" }]}>
                Welcome to LendLog
              </Text>
              <Text style={[styles.subtitle, { color: c.text2, fontFamily: "Inter_400Regular" }]}>
                A private, offline-first personal lending tracker for your friends, family, and colleagues.
              </Text>
            </View>

            <View style={styles.featureList}>
              <View style={[styles.featureCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.featureIcon, { backgroundColor: c.primary + "20" }]}>
                  <Feather name="trending-up" size={20} color={c.primary} />
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={[styles.featureTitle, { color: c.text, fontFamily: "Inter_600SemiBold" }]}>
                    Track Lent & Borrowed
                  </Text>
                  <Text style={[styles.featureDesc, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
                    Keep precise tabs on who owes you and who you owe with zero hassle.
                  </Text>
                </View>
              </View>

              <View style={[styles.featureCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.featureIcon, { backgroundColor: c.blue + "20" }]}>
                  <Feather name="clock" size={20} color={c.blue} />
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={[styles.featureTitle, { color: c.text, fontFamily: "Inter_600SemiBold" }]}>
                    Partial Payments & History
                  </Text>
                  <Text style={[styles.featureDesc, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
                    Log repayments in installments with automatic live balance updates.
                  </Text>
                </View>
              </View>

              <View style={[styles.featureCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.featureIcon, { backgroundColor: c.orange + "20" }]}>
                  <Feather name="shield" size={20} color={c.orange} />
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={[styles.featureTitle, { color: c.text, fontFamily: "Inter_600SemiBold" }]}>
                    100% Private & Offline
                  </Text>
                  <Text style={[styles.featureDesc, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
                    Your financial data never leaves your device. No cloud, no ads, no trackers.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: c.primary }]}
                onPress={nextStep}
                accessibilityLabel="Get Started with setup"
              >
                <Text style={[styles.primaryButtonText, { color: "#000", fontFamily: "Inter_700Bold" }]}>
                  Get Started
                </Text>
                <Feather name="arrow-right" size={20} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.textButton}
                onPress={handleSkip}
                accessibilityLabel="Skip setup and use defaults"
              >
                <Text style={[styles.textButtonText, { color: c.text3, fontFamily: "Inter_500Medium" }]}>
                  Skip Setup (Use Defaults)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 2: PERSONALIZATION */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepIconWrap, { backgroundColor: c.primary + "18" }]}>
                <Feather name="user" size={28} color={c.primary} />
              </View>
              <Text style={[styles.title, { color: c.text, fontFamily: "Inter_700Bold" }]}>
                Personalize Your Profile
              </Text>
              <Text style={[styles.subtitle, { color: c.text2, fontFamily: "Inter_400Regular" }]}>
                What should we call you? Your name appears in dashboard greetings and exported statements.
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: c.text3, fontFamily: "Inter_600SemiBold" }]}>
                YOUR DISPLAY NAME (OPTIONAL)
              </Text>
              <TextInput
                value={profileName}
                onChangeText={setProfileName}
                placeholder="e.g. Rahul, Alex, Sam..."
                placeholderTextColor={c.text3}
                style={[
                  styles.textInput,
                  {
                    color: c.text,
                    backgroundColor: c.card,
                    borderColor: c.border,
                    fontFamily: "Inter_500Medium",
                  },
                ]}
                maxLength={30}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={nextStep}
              />
            </View>

            <View style={[styles.calloutCard, { backgroundColor: c.card2, borderColor: c.border }]}>
              <Feather name="lock" size={18} color={c.primary} />
              <Text style={[styles.calloutText, { color: c.text2, fontFamily: "Inter_400Regular" }]}>
                Your name is stored locally on this phone only. You can skip this or change it at any time in Profile & Settings.
              </Text>
            </View>

            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: c.primary }]}
                onPress={nextStep}
              >
                <Text style={[styles.primaryButtonText, { color: "#000", fontFamily: "Inter_700Bold" }]}>
                  Continue
                </Text>
                <Feather name="arrow-right" size={20} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.textButton} onPress={nextStep}>
                <Text style={[styles.textButtonText, { color: c.text3, fontFamily: "Inter_500Medium" }]}>
                  Continue without name
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: CURRENCY AND FORMATTING */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepIconWrap, { backgroundColor: c.primary + "18" }]}>
                <Feather name="dollar-sign" size={28} color={c.primary} />
              </View>
              <Text style={[styles.title, { color: c.text, fontFamily: "Inter_700Bold" }]}>
                Select Currency
              </Text>
              <Text style={[styles.subtitle, { color: c.text2, fontFamily: "Inter_400Regular" }]}>
                Choose your preferred currency symbol. Default is INR (₹) for Indian users.
              </Text>
            </View>

            {/* Live Sample Preview */}
            <View style={[styles.previewCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.previewHeading, { color: c.text3, fontFamily: "Inter_600SemiBold" }]}>
                LIVE BALANCE PREVIEW
              </Text>
              <View style={styles.previewRow}>
                <View style={styles.previewItem}>
                  <Text style={[styles.previewLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Total Lent</Text>
                  <Text style={[styles.previewVal, { color: c.primary, fontFamily: "Inter_700Bold" }]}>
                    {effectiveCurrency} 2,500.00
                  </Text>
                </View>
                <View style={styles.previewDivider} />
                <View style={styles.previewItem}>
                  <Text style={[styles.previewLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Repaid</Text>
                  <Text style={[styles.previewVal, { color: c.blue, fontFamily: "Inter_700Bold" }]}>
                    {effectiveCurrency} 1,000.00
                  </Text>
                </View>
                <View style={styles.previewDivider} />
                <View style={styles.previewItem}>
                  <Text style={[styles.previewLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Pending</Text>
                  <Text style={[styles.previewVal, { color: c.orange, fontFamily: "Inter_700Bold" }]}>
                    {effectiveCurrency} 1,500.00
                  </Text>
                </View>
              </View>
              <Text style={[styles.previewNote, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
                Amounts maintain 2 decimal places. Currency selection adjusts the display symbol without altering existing transaction numbers.
              </Text>
            </View>

            {/* Currency Options Grid */}
            <View style={styles.currencyGrid}>
              {CURRENCY_OPTIONS.map((item) => {
                const isSelected = !isCustomCurrency && currency === item.symbol;
                return (
                  <TouchableOpacity
                    key={item.symbol}
                    onPress={() => handleSelectCurrency(item.symbol)}
                    style={[
                      styles.currencyCard,
                      {
                        backgroundColor: isSelected ? c.primary + "18" : c.card,
                        borderColor: isSelected ? c.primary : c.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={[styles.symbolPill, { backgroundColor: isSelected ? c.primary : c.card2 }]}>
                      <Text
                        style={[
                          styles.symbolText,
                          {
                            color: isSelected ? c.primaryForeground : c.text,
                            fontFamily: "Inter_700Bold",
                          },
                        ]}
                      >
                        {item.symbol}
                      </Text>
                    </View>
                    <View style={styles.currencyMeta}>
                      <Text
                        style={[
                          styles.currencyName,
                          {
                            color: isSelected ? c.primary : c.text,
                            fontFamily: "Inter_600SemiBold",
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={[styles.currencyDesc, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
                        {item.desc}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={[styles.checkCircle, { backgroundColor: c.primary }]}>
                        <Feather name="check" size={14} color={c.primaryForeground} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Custom currency row */}
              <TouchableOpacity
                onPress={handleChooseCustomCurrency}
                style={[
                  styles.currencyCard,
                  {
                    backgroundColor: isCustomCurrency ? c.primary + "18" : c.card,
                    borderColor: isCustomCurrency ? c.primary : c.border,
                    borderWidth: isCustomCurrency ? 2 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isCustomCurrency }}
              >
                <View style={[styles.symbolPill, { backgroundColor: isCustomCurrency ? c.primary : c.card2 }]}>
                  <Feather name="edit-2" size={16} color={isCustomCurrency ? c.primaryForeground : c.text} />
                </View>
                <View style={styles.currencyMeta}>
                  <Text
                    style={[
                      styles.currencyName,
                      {
                        color: isCustomCurrency ? c.primary : c.text,
                        fontFamily: "Inter_600SemiBold",
                      },
                    ]}
                  >
                    Custom Symbol
                  </Text>
                  <Text style={[styles.currencyDesc, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
                    Type any symbol (e.g. ¥, ৳, ₩)
                  </Text>
                </View>
                {isCustomCurrency && (
                  <View style={[styles.checkCircle, { backgroundColor: c.primary }]}>
                    <Feather name="check" size={14} color={c.primaryForeground} />
                  </View>
                )}
              </TouchableOpacity>

              {isCustomCurrency && (
                <View style={[styles.customInputWrap, { backgroundColor: c.card2, borderColor: c.border }]}>
                  <Text style={[styles.inputLabel, { color: c.text3, fontFamily: "Inter_600SemiBold" }]}>
                    ENTER CUSTOM SYMBOL (MAX 5 CHARS)
                  </Text>
                  <TextInput
                    value={customCurrency}
                    onChangeText={setCustomCurrency}
                    placeholder="e.g. ৳ or ¥"
                    placeholderTextColor={c.text3}
                    maxLength={5}
                    style={[
                      styles.textInput,
                      {
                        color: c.text,
                        backgroundColor: c.card,
                        borderColor: c.border,
                        fontFamily: "Inter_600SemiBold",
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          </View>
        )}

        {/* STEP 4: APPEARANCE */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepIconWrap, { backgroundColor: c.primary + "18" }]}>
                <Feather name="moon" size={28} color={c.primary} />
              </View>
              <Text style={[styles.title, { color: c.text, fontFamily: "Inter_700Bold" }]}>
                Choose Appearance
              </Text>
              <Text style={[styles.subtitle, { color: c.text2, fontFamily: "Inter_400Regular" }]}>
                Pick how LendLog looks. Your choice takes effect immediately.
              </Text>
            </View>

            <View style={styles.themeOptions}>
              {[
                {
                  id: "dark" as ThemePreference,
                  icon: "moon",
                  label: "Dark Mode",
                  badge: "Recommended",
                  desc: "Sleek OLED true-black, easy on the eyes and saves battery.",
                },
                {
                  id: "light" as ThemePreference,
                  icon: "sun",
                  label: "Light Mode",
                  desc: "Clean, high-contrast crisp theme for bright daylight.",
                },
                {
                  id: "system" as ThemePreference,
                  icon: "smartphone",
                  label: "System Default",
                  desc: "Automatically follows your Android system display settings.",
                },
              ].map((item) => {
                const isSelected = selectedTheme === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleSelectTheme(item.id)}
                    style={[
                      styles.themeCard,
                      {
                        backgroundColor: isSelected ? c.primary + "15" : c.card,
                        borderColor: isSelected ? c.primary : c.border,
                      },
                    ]}
                  >
                    <View style={[styles.themeIconBox, { backgroundColor: isSelected ? c.primary : c.card2 }]}>
                      <Feather name={item.icon as any} size={22} color={isSelected ? "#000" : c.text} />
                    </View>
                    <View style={styles.themeMeta}>
                      <View style={styles.themeTitleRow}>
                        <Text
                          style={[
                            styles.themeLabel,
                            {
                              color: isSelected ? c.primary : c.text,
                              fontFamily: "Inter_600SemiBold",
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                        {item.badge && (
                          <View style={[styles.themeBadge, { backgroundColor: c.primary + "25" }]}>
                            <Text style={[styles.themeBadgeText, { color: c.primary, fontFamily: "Inter_600SemiBold" }]}>
                              {item.badge}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.themeDesc, { color: c.text3, fontFamily: "Inter_400Regular" }]}>
                        {item.desc}
                      </Text>
                    </View>
                    {isSelected && <Feather name="check-circle" size={20} color={c.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: c.primary }]}
                onPress={nextStep}
              >
                <Text style={[styles.primaryButtonText, { color: "#000", fontFamily: "Inter_700Bold" }]}>
                  Continue
                </Text>
                <Feather name="arrow-right" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 5: DATA AND PRIVACY */}
        {step === 5 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepIconWrap, { backgroundColor: c.primary + "18" }]}>
                <Feather name="shield" size={28} color={c.primary} />
              </View>
              <Text style={[styles.title, { color: c.text, fontFamily: "Inter_700Bold" }]}>
                Data & Privacy
              </Text>
              <Text style={[styles.subtitle, { color: c.text2, fontFamily: "Inter_400Regular" }]}>
                LendLog is built from the ground up for privacy. No accounts, no servers, no telemetry.
              </Text>
            </View>

            <View style={styles.privacyList}>
              <View style={[styles.privacyCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.privacyIcon, { backgroundColor: c.primary + "20" }]}>
                  <Feather name="hard-drive" size={22} color={c.primary} />
                </View>
                <View style={styles.privacyMeta}>
                  <Text style={[styles.privacyTitle, { color: c.text, fontFamily: "Inter_600SemiBold" }]}>
                    100% On-Device Storage
                  </Text>
                  <Text style={[styles.privacyDesc, { color: c.text2, fontFamily: "Inter_400Regular" }]}>
                    All lending records, payments, and preferences are saved exclusively on your phone's internal storage. No cloud servers are involved.
                  </Text>
                </View>
              </View>

              <View style={[styles.privacyCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.privacyIcon, { backgroundColor: c.blue + "20" }]}>
                  <Feather name="eye-off" size={22} color={c.blue} />
                </View>
                <View style={styles.privacyMeta}>
                  <Text style={[styles.privacyTitle, { color: c.text, fontFamily: "Inter_600SemiBold" }]}>
                    Zero Analytics or Telemetry
                  </Text>
                  <Text style={[styles.privacyDesc, { color: c.text2, fontFamily: "Inter_400Regular" }]}>
                    No tracking SDKs, no behavioral telemetry, no advertising IDs. What you record in LendLog remains entirely between you and your phone.
                  </Text>
                </View>
              </View>

              <View style={[styles.privacyCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.privacyIcon, { backgroundColor: c.orange + "20" }]}>
                  <Feather name="download" size={22} color={c.orange} />
                </View>
                <View style={styles.privacyMeta}>
                  <Text style={[styles.privacyTitle, { color: c.text, fontFamily: "Inter_600SemiBold" }]}>
                    Full Backup & Restore Control
                  </Text>
                  <Text style={[styles.privacyDesc, { color: c.text2, fontFamily: "Inter_400Regular" }]}>
                    You can export standard JSON backup files from the Profile tab anytime to transfer records between phones or keep local offline copies.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: c.primary }]}
                onPress={nextStep}
              >
                <Text style={[styles.primaryButtonText, { color: "#000", fontFamily: "Inter_700Bold" }]}>
                  Review & Finish
                </Text>
                <Feather name="arrow-right" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 6: SUMMARY & COMPLETION */}
        {step === 6 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepIconWrap, { backgroundColor: c.primary + "18" }]}>
                <Feather name="check-circle" size={32} color={c.primary} />
              </View>
              <Text style={[styles.title, { color: c.text, fontFamily: "Inter_700Bold" }]}>
                You're All Set!
              </Text>
              <Text style={[styles.subtitle, { color: c.text2, fontFamily: "Inter_400Regular" }]}>
                Here is a summary of your setup choices. You can modify any of these at any time in Profile & Settings.
              </Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.summaryHeading, { color: c.text3, fontFamily: "Inter_600SemiBold" }]}>
                CONFIGURATION SUMMARY
              </Text>

              <View style={styles.summaryItem}>
                <View style={styles.summaryLabelRow}>
                  <Feather name="user" size={16} color={c.text3} />
                  <Text style={[styles.summaryLabel, { color: c.text3, fontFamily: "Inter_500Medium" }]}>
                    Display Name
                  </Text>
                </View>
                <Text style={[styles.summaryValue, { color: c.text, fontFamily: "Inter_600SemiBold" }]}>
                  {profileName.trim() || "Friend (Default)"}
                </Text>
              </View>

              <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />

              <View style={styles.summaryItem}>
                <View style={styles.summaryLabelRow}>
                  <Feather name="dollar-sign" size={16} color={c.text3} />
                  <Text style={[styles.summaryLabel, { color: c.text3, fontFamily: "Inter_500Medium" }]}>
                    Currency Symbol
                  </Text>
                </View>
                <Text style={[styles.summaryValue, { color: c.primary, fontFamily: "Inter_700Bold" }]}>
                  {effectiveCurrency}
                </Text>
              </View>

              <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />

              <View style={styles.summaryItem}>
                <View style={styles.summaryLabelRow}>
                  <Feather name="moon" size={16} color={c.text3} />
                  <Text style={[styles.summaryLabel, { color: c.text3, fontFamily: "Inter_500Medium" }]}>
                    Theme Mode
                  </Text>
                </View>
                <Text style={[styles.summaryValue, { color: c.text, fontFamily: "Inter_600SemiBold" }]}>
                  {selectedTheme === "dark" ? "Dark Mode" : selectedTheme === "light" ? "Light Mode" : "System Default"}
                </Text>
              </View>

              <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />

              <View style={styles.summaryItem}>
                <View style={styles.summaryLabelRow}>
                  <Feather name="shield" size={16} color={c.text3} />
                  <Text style={[styles.summaryLabel, { color: c.text3, fontFamily: "Inter_500Medium" }]}>
                    Storage & Privacy
                  </Text>
                </View>
                <Text style={[styles.summaryValue, { color: c.primary, fontFamily: "Inter_600SemiBold" }]}>
                  100% Local & Private
                </Text>
              </View>
            </View>

            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: c.primary }]}
                onPress={handleFinish}
                accessibilityLabel="Start Using LendLog"
              >
                <Text style={[styles.primaryButtonText, { color: "#000", fontFamily: "Inter_700Bold" }]}>
                  Start Using LendLog
                </Text>
                <Feather name="arrow-right" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating / Sticky bottom action for Step 3: Select Currency */}
      {step === 3 && hasSelectedCurrency && (
        <View
          style={[
            styles.floatingFooter,
            {
              backgroundColor: c.background,
              borderTopColor: c.border,
              paddingBottom: stickyBottomPadding,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: c.primary }]}
            onPress={handleCurrencyContinue}
            activeOpacity={0.8}
            accessibilityLabel="Continue to appearance setup"
          >
            <Text style={[styles.primaryButtonText, { color: c.primaryForeground, fontFamily: "Inter_700Bold" }]}>
              Continue
            </Text>
            <Feather name="arrow-right" size={20} color={c.primaryForeground} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  progressText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  progressBarTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipBtnText: {
    fontSize: 13,
  },
  stepContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  welcomeHero: {
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    textAlign: "center",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  featureList: {
    gap: 12,
    marginVertical: 12,
  },
  featureCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextCol: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 15,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  stepHeader: {
    alignItems: "center",
    marginVertical: 14,
    gap: 8,
  },
  stepIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  formGroup: {
    marginVertical: 16,
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  textInput: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  calloutCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
    marginVertical: 8,
  },
  calloutText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 10,
    gap: 12,
  },
  previewHeading: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewItem: {
    alignItems: "center",
    flex: 1,
  },
  previewDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(128,128,128,0.2)",
  },
  previewLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  previewVal: {
    fontSize: 16,
  },
  previewNote: {
    fontSize: 12,
    lineHeight: 16,
  },
  currencyGrid: {
    gap: 8,
    marginVertical: 8,
  },
  currencyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  symbolPill: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  symbolText: {
    fontSize: 17,
  },
  currencyMeta: {
    flex: 1,
    gap: 2,
  },
  currencyName: {
    fontSize: 14,
  },
  currencyDesc: {
    fontSize: 12,
  },
  customInputWrap: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
    gap: 6,
  },
  themeOptions: {
    gap: 12,
    marginVertical: 16,
  },
  themeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  themeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  themeMeta: {
    flex: 1,
    gap: 3,
  },
  themeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  themeLabel: {
    fontSize: 15,
  },
  themeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  themeBadgeText: {
    fontSize: 10,
  },
  themeDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  privacyList: {
    gap: 12,
    marginVertical: 14,
  },
  privacyCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "flex-start",
    gap: 14,
  },
  privacyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  privacyMeta: {
    flex: 1,
    gap: 4,
  },
  privacyTitle: {
    fontSize: 15,
  },
  privacyDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginVertical: 14,
    gap: 12,
  },
  summaryHeading: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 14,
  },
  summaryDivider: {
    height: 1,
  },
  bottomActions: {
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
  },
  textButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  textButtonText: {
    fontSize: 14,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
});
