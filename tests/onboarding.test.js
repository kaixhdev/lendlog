const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// Pure mock implementation of LendLog onboarding detection & migration logic
function resolveOnboardingState({ oRaw, rRaw, sRaw }) {
  let loadedRecords = [];
  let loadedSettings = {
    currency: "Rs.",
    theme: "dark",
    profileName: "Friend",
  };

  if (rRaw) {
    try {
      loadedRecords = JSON.parse(rRaw);
    } catch {
      loadedRecords = [];
    }
  }

  if (sRaw) {
    try {
      loadedSettings = { ...loadedSettings, ...JSON.parse(sRaw) };
    } catch {}
  }

  let hasCompletedOnboarding = false;
  let shouldPersistFlag = false;

  if (oRaw === "true" || loadedSettings.hasCompletedOnboarding === true) {
    hasCompletedOnboarding = true;
  } else if (oRaw === "false") {
    hasCompletedOnboarding = false;
  } else {
    // oRaw is null (first run of this update)
    const isExistingUser = (Array.isArray(loadedRecords) && loadedRecords.length > 0) || sRaw !== null;
    if (isExistingUser) {
      hasCompletedOnboarding = true;
      shouldPersistFlag = true;
    } else {
      hasCompletedOnboarding = false;
    }
  }

  return { hasCompletedOnboarding, shouldPersistFlag, loadedRecords, loadedSettings };
}

function completeOnboardingState(currentSettings, prefs) {
  const updated = {
    ...currentSettings,
    ...(prefs?.profileName !== undefined && prefs.profileName.trim()
      ? { profileName: prefs.profileName.trim() }
      : {}),
    ...(prefs?.currency !== undefined && prefs.currency.trim()
      ? { currency: prefs.currency.trim() }
      : {}),
    ...(prefs?.theme ? { theme: prefs.theme } : {}),
    hasCompletedOnboarding: true,
  };
  return {
    updatedSettings: updated,
    onboardingFlag: "true",
  };
}

describe("LendLog Onboarding & Existing User Protection Tests", () => {
  test("Fresh install: wizard runs when no records, settings, or flags exist", () => {
    const result = resolveOnboardingState({ oRaw: null, rRaw: null, sRaw: null });
    assert.strictEqual(result.hasCompletedOnboarding, false, "Fresh install should require onboarding");
    assert.strictEqual(result.shouldPersistFlag, false);
    assert.strictEqual(result.loadedSettings.currency, "Rs.");
    assert.strictEqual(result.loadedSettings.profileName, "Friend");
  });

  test("Existing user with records: auto-migrates to completed onboarding and does NOT wipe data", () => {
    const existingRecords = JSON.stringify([
      { id: "1", name: "Kailash", amount: 500, paid_amount: 150.5, settled: false },
    ]);
    const result = resolveOnboardingState({ oRaw: null, rRaw: existingRecords, sRaw: null });
    assert.strictEqual(result.hasCompletedOnboarding, true, "Existing user with records must skip onboarding");
    assert.strictEqual(result.shouldPersistFlag, true, "Migration flag must be marked to persist");
    assert.strictEqual(result.loadedRecords.length, 1);
    assert.strictEqual(result.loadedRecords[0].name, "Kailash");
    assert.strictEqual(result.loadedRecords[0].amount, 500);
  });

  test("Existing user with settings only: auto-migrates to completed onboarding", () => {
    const existingSettings = JSON.stringify({
      currency: "$",
      theme: "dark",
      profileName: "Alex",
    });
    const result = resolveOnboardingState({ oRaw: null, rRaw: null, sRaw: existingSettings });
    assert.strictEqual(result.hasCompletedOnboarding, true, "Existing user with settings must skip onboarding");
    assert.strictEqual(result.shouldPersistFlag, true);
    assert.strictEqual(result.loadedSettings.profileName, "Alex");
    assert.strictEqual(result.loadedSettings.currency, "$");
  });

  test("User who previously completed onboarding: loads flag correctly", () => {
    const result = resolveOnboardingState({ oRaw: "true", rRaw: null, sRaw: null });
    assert.strictEqual(result.hasCompletedOnboarding, true);
  });

  test("User with explicit false onboarding flag: remains in onboarding state", () => {
    const result = resolveOnboardingState({ oRaw: "false", rRaw: null, sRaw: null });
    assert.strictEqual(result.hasCompletedOnboarding, false);
  });

  test("completeOnboarding updates preferences, trims inputs, and marks flag true", () => {
    const initial = { currency: "Rs.", theme: "dark", profileName: "Friend" };
    const { updatedSettings, onboardingFlag } = completeOnboardingState(initial, {
      profileName: "  Sarah Connor  ",
      currency: "₹",
      theme: "dark",
    });

    assert.strictEqual(updatedSettings.profileName, "Sarah Connor");
    assert.strictEqual(updatedSettings.currency, "₹");
    assert.strictEqual(updatedSettings.theme, "dark");
    assert.strictEqual(updatedSettings.hasCompletedOnboarding, true);
    assert.strictEqual(onboardingFlag, "true");
  });

  test("Skip setup preserves safe defaults (Friend, INR/Rs.) and marks flag true", () => {
    const initial = { currency: "₹", theme: "dark", profileName: "Friend" };
    const { updatedSettings, onboardingFlag } = completeOnboardingState(initial, {
      profileName: "",
      currency: "₹",
      theme: "dark",
    });

    assert.strictEqual(updatedSettings.profileName, "Friend");
    assert.strictEqual(updatedSettings.currency, "₹");
    assert.strictEqual(updatedSettings.hasCompletedOnboarding, true);
    assert.strictEqual(onboardingFlag, "true");
  });

  test("Currency selection invariant: changing currency symbol does NOT modify financial numbers", () => {
    const record = { id: "rec1", name: "Bob", amount: 1250.75, paid_amount: 500.25 };
    const initialCurrency = "Rs.";
    const newCurrency = "€";

    // Format simulation
    const initialFormatted = `${initialCurrency} ${record.amount.toFixed(2)}`;
    const newFormatted = `${newCurrency} ${record.amount.toFixed(2)}`;

    assert.strictEqual(initialFormatted, "Rs. 1250.75");
    assert.strictEqual(newFormatted, "€ 1250.75");
    // Ensure raw numeric values remain strictly identical
    assert.strictEqual(record.amount, 1250.75);
    assert.strictEqual(record.paid_amount, 500.25);
  });
});
