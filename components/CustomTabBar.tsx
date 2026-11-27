import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useThemeContext } from '@/context/ThemeContext';

const TABS = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'records', label: 'Records', icon: 'list' },
  { name: 'people', label: 'People', icon: 'users' },
  { name: 'analytics', label: 'Analytics', icon: 'bar-chart-2' },
  { name: 'profile', label: 'Profile', icon: 'user' },
] as const;

interface Props {
  state: { routes: { name: string }[]; index: number };
  navigation: { navigate: (name: string) => void };
}

function TabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: (typeof TABS)[number];
  isActive: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const tapFade = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.55,
        duration: 65,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      style={styles.tab}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
      onPress={() => {
        tapFade();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Animated.View
        style={[
          styles.tabInner,
          isActive && { backgroundColor: c.primary + '18' },
          { opacity: fadeAnim },
        ]}
      >
        <Feather
          name={tab.icon}
          size={20}
          color={isActive ? c.primary : c.text3}
        />
        <Text
          style={[
            styles.label,
            {
              color: isActive ? c.primary : c.text3,
              fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_500Medium',
            },
          ]}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function CustomTabBar({ state, navigation }: Props) {
  const c = useColors();
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const currentName = state.routes[state.index]?.name;
  const bottomPad = Math.max(insets.bottom, 8);
  const useNativeGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();
  const tabs = TABS.map((tab) => (
    <TabItem
      key={tab.name}
      tab={tab}
      isActive={currentName === tab.name}
      onPress={() => navigation.navigate(tab.name)}
    />
  ));

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: bottomPad, backgroundColor: 'transparent' },
      ]}
    >
      {useNativeGlass ? (
        <GlassView
          colorScheme={theme}
          glassEffectStyle="regular"
          isInteractive
          tintColor={c.nav + '40'}
          style={[
            styles.bar,
            {
              backgroundColor: 'transparent',
              borderColor: c.border + 'CC',
            },
          ]}
        >
          {tabs}
        </GlassView>
      ) : (
        <BlurView
          intensity={Platform.OS === 'web' ? 45 : 72}
          tint={theme === 'dark' ? 'dark' : 'light'}
          style={[
            styles.bar,
            {
              backgroundColor: c.nav + 'B8',
              borderColor: c.border + 'CC',
            },
          ]}
        >
          {tabs}
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 7,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 5,
    paddingVertical: 6,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  tabInner: {
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 3,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
});
