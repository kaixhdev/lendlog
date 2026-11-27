import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
    try {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.4,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } catch {}
  };

  return (
    <TouchableOpacity
      key={tab.name}
      style={styles.tab}
      activeOpacity={1}
      onPress={() => {
        tapFade();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Animated.View style={[styles.tabInner, { opacity: fadeAnim }]}>
        <Feather
          name={tab.icon}
          size={22}
          color={isActive ? c.primary : c.text3}
        />
        <Text
          style={[
            styles.label,
            {
              color: isActive ? c.primary : c.text3,
              fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
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
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const currentName = state.routes[state.index]?.name;
  const bottomPad = isWeb ? 8 : Math.max(insets.bottom, 8);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: c.nav,
          borderTopColor: c.border,
          paddingBottom: bottomPad,
        },
      ]}
    >
      {TABS.map((tab) => (
        <TabItem
          key={tab.name}
          tab={tab}
          isActive={currentName === tab.name}
          onPress={() => navigation.navigate(tab.name)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
});
