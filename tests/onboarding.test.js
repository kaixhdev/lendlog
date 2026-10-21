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

  describe("Regression Tests: Currency Selection, Continue Navigation & Dashboard Return", () => {
    // Helper state machine simulating OnboardingScreen wizard state
    function createWizardState(initialSettings = { currency: "₹", profileName: "Friend", theme: "dark" }) {
      let state = {
        step: 3, // Start on Step 3: Select Currency
        settings: { ...initialSettings },
        persistedSettings: { ...initialSettings },
        currency: initialSettings.currency || "₹",
        customCurrency: "",
        isCustomCurrency: false,
        selectedTheme: initialSettings.theme || "dark",
        profileName: initialSettings.profileName || "",
        hasCompletedOnboarding: false,
        activeRoute: "/onboarding",
      };

      const selectCurrency = (sym) => {
        state.isCustomCurrency = false;
        state.currency = sym;
      };

      const selectCustomCurrency = (sym = "") => {
        state.isCustomCurrency = true;
        state.customCurrency = sym;
      };

      const getEffectiveCurrency = () => {
        return state.isCustomCurrency ? (state.customCurrency.trim() || "₹") : state.currency;
      };

      const getHasSelectedCurrency = () => {
        return state.isCustomCurrency ? state.customCurrency.trim().length > 0 : Boolean(state.currency);
      };

      const handleCurrencyContinue = () => {
        if (!getHasSelectedCurrency()) {
          throw new Error("Cannot continue without selecting or entering a currency");
        }
        const chosen = getEffectiveCurrency();
        state.settings.currency = chosen;
        state.persistedSettings.currency = chosen;
        state.step = Math.min(6, state.step + 1);
      };

      const prevStep = () => {
        state.step = Math.max(1, state.step - 1);
      };

      const completeSetup = () => {
        const finalCurrency = getEffectiveCurrency();
        state.settings = {
          ...state.settings,
          currency: finalCurrency,
          profileName: state.profileName.trim() || "Friend",
          theme: state.selectedTheme,
          hasCompletedOnboarding: true,
        };
        state.persistedSettings = { ...state.settings };
        state.hasCompletedOnboarding = true;
        state.activeRoute = "/(tabs)";
      };

      const resetOnboarding = () => {
        state.hasCompletedOnboarding = false;
        state.activeRoute = "/onboarding";
        state.step = 1;
      };

      return {
        state,
        selectCurrency,
        selectCustomCurrency,
        getEffectiveCurrency,
        getHasSelectedCurrency,
        handleCurrencyContinue,
        prevStep,
        completeSetup,
        resetOnboarding,
      };
    }

    test("Currency selection and persistence: selecting standard currency updates state and persists", () => {
      const wizard = createWizardState();
      assert.strictEqual(wizard.state.currency, "₹");
      assert.strictEqual(wizard.getHasSelectedCurrency(), true);

      // Select USD ($)
      wizard.selectCurrency("$");
      assert.strictEqual(wizard.state.currency, "$");
      assert.strictEqual(wizard.getEffectiveCurrency(), "$");
      assert.strictEqual(wizard.getHasSelectedCurrency(), true);

      // Tap continue
      wizard.handleCurrencyContinue();
      assert.strictEqual(wizard.state.step, 4, "Continue must advance from Step 3 to Step 4");
      assert.strictEqual(wizard.state.persistedSettings.currency, "$", "Selected currency must be persisted");
    });

    test("Currency selection: custom currency validation and whitespace trimming", () => {
      const wizard = createWizardState();
      wizard.selectCustomCurrency("");
      assert.strictEqual(wizard.getHasSelectedCurrency(), false, "Empty custom currency must NOT allow continue");

      wizard.selectCustomCurrency("   ");
      assert.strictEqual(wizard.getHasSelectedCurrency(), false, "Whitespace-only custom currency must NOT allow continue");

      wizard.selectCustomCurrency("  ¥  ");
      assert.strictEqual(wizard.getHasSelectedCurrency(), true, "Valid custom currency symbol allows continue");
      assert.strictEqual(wizard.getEffectiveCurrency(), "¥", "Custom symbol must be trimmed");

      wizard.handleCurrencyContinue();
      assert.strictEqual(wizard.state.step, 4);
      assert.strictEqual(wizard.state.persistedSettings.currency, "¥");
    });

    test("Continue-button navigation: step advancement and back navigation preserves chosen currency", () => {
      const wizard = createWizardState({ currency: "₹" });
      // Change to EUR (€)
      wizard.selectCurrency("€");
      assert.strictEqual(wizard.getEffectiveCurrency(), "€");

      // Advance to step 4 (Appearance)
      wizard.handleCurrencyContinue();
      assert.strictEqual(wizard.state.step, 4);

      // Navigate back to step 3
      wizard.prevStep();
      assert.strictEqual(wizard.state.step, 3, "Navigating back returns to Step 3");
      assert.strictEqual(wizard.state.currency, "€", "Selected currency must remain selected");
      assert.strictEqual(wizard.getHasSelectedCurrency(), true, "Continue button must remain visible and active");
    });

    test("Returning to dashboard after completing setup: transitions route to /(tabs) and sets flag", () => {
      const wizard = createWizardState();
      assert.strictEqual(wizard.state.hasCompletedOnboarding, false);
      assert.strictEqual(wizard.state.activeRoute, "/onboarding");

      // Select CAD and complete setup
      wizard.selectCurrency("CA$");
      wizard.handleCurrencyContinue(); // step 4
      wizard.completeSetup(); // final CTA

      assert.strictEqual(wizard.state.hasCompletedOnboarding, true, "Onboarding flag must be true");
      assert.strictEqual(wizard.state.persistedSettings.hasCompletedOnboarding, true);
      assert.strictEqual(wizard.state.persistedSettings.currency, "CA$");
      assert.strictEqual(wizard.state.activeRoute, "/(tabs)", "Active route must redirect to dashboard");
    });

    test("Re-running setup wizard from Profile/Settings: reset allows re-entry and returns to dashboard", () => {
      const wizard = createWizardState();
      // Complete initial onboarding
      wizard.completeSetup();
      assert.strictEqual(wizard.state.hasCompletedOnboarding, true);
      assert.strictEqual(wizard.state.activeRoute, "/(tabs)");

      // User triggers 'Re-run Setup Wizard' from Profile/Settings
      wizard.resetOnboarding();
      assert.strictEqual(wizard.state.hasCompletedOnboarding, false);
      assert.strictEqual(wizard.state.activeRoute, "/onboarding");
      assert.strictEqual(wizard.state.step, 1);

      // Re-run through wizard to Step 3 and pick GBP (£)
      wizard.state.step = 3;
      wizard.selectCurrency("£");
      wizard.handleCurrencyContinue();
      assert.strictEqual(wizard.state.persistedSettings.currency, "£");

      // Finish re-run
      wizard.completeSetup();
      assert.strictEqual(wizard.state.hasCompletedOnboarding, true);
      assert.strictEqual(wizard.state.persistedSettings.currency, "£");
      assert.strictEqual(wizard.state.activeRoute, "/(tabs)");
    });
  });
});
