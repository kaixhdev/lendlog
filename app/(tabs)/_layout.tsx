import { Tabs } from 'expo-router';
import React from 'react';

import { CustomTabBar } from '@/components/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as any)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="people" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
