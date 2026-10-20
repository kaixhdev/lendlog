import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

export type ThemePreference = "system" | "dark" | "light";

interface ThemeContextType {
  theme: "dark" | "light";
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  themePreference: "dark",
  setThemePreference: async () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("dark");

  useEffect(() => {
    AsyncStorage.getItem("lendlog_theme").then(v => {
      if (v === "system" || v === "light" || v === "dark") {
        setThemePreferenceState(v as ThemePreference);
      }
    });
  }, []);

  const setThemePreference = useCallback(async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    await AsyncStorage.setItem("lendlog_theme", pref);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreferenceState(prev => {
      const active = prev === "system" ? (systemScheme === "light" ? "light" : "dark") : prev;
      const next = active === "dark" ? "light" : "dark";
      AsyncStorage.setItem("lendlog_theme", next);
      return next;
    });
  }, [systemScheme]);

  const activeTheme: "dark" | "light" =
    themePreference === "system"
      ? (systemScheme === "light" ? "light" : "dark")
      : themePreference;

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        themePreference,
        setThemePreference,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
