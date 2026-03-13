import React from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { ProviderTabParamList } from './types';
import { COLORS } from '../theme/colors';
import { LAYOUT } from '../config/constants';

import ProviderDashboardStack from './stacks/ProviderDashboardStack';
import ProviderListingsStack from './stacks/ProviderListingsStack';
import ProviderBookingsStack from './stacks/ProviderBookingsStack';
import ProviderInboxStack from './stacks/ProviderInboxStack';
import ProviderProfileStack from './stacks/ProviderProfileStack';

const Tab = createBottomTabNavigator<ProviderTabParamList>();

const TAB_ICON_MAP: Record<keyof ProviderTabParamList, { focused: string; unfocused: string }> = {
  DashboardTab: { focused: 'grid', unfocused: 'grid-outline' },
  ListingsTab: { focused: 'list', unfocused: 'list-outline' },
  ProviderBookingsTab: { focused: 'calendar', unfocused: 'calendar-outline' },
  ProviderInboxTab: { focused: 'chatbubble', unfocused: 'chatbubble-outline' },
  ProviderProfileTab: { focused: 'person-circle', unfocused: 'person-circle-outline' },
};

export default function ProviderNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary[500],
        tabBarInactiveTintColor: COLORS.neutral[300],
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarStyle: {
          backgroundColor: COLORS.background.primary,
          borderTopWidth: 1,
          borderTopColor: COLORS.neutral[100],
          paddingTop: 8,
          paddingBottom: LAYOUT.TAB_BAR_PADDING_BOTTOM,
          height: LAYOUT.TAB_BAR_HEIGHT,
          elevation: 12,
          shadowColor: COLORS.neutral[700],
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
        },
        tabBarIcon: ({ focused, color }) => {
          const iconConfig = TAB_ICON_MAP[route.name];
          const iconName = focused ? iconConfig.focused : iconConfig.unfocused;
          return (
            <View style={{ alignItems: 'center', minHeight: 28, justifyContent: 'center' }}>
              <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={22} color={color} />
              {focused && (
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: COLORS.primary[500],
                    marginTop: 3,
                  }}
                />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={ProviderDashboardStack}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="ListingsTab"
        component={ProviderListingsStack}
        options={{ tabBarLabel: 'Listings' }}
      />
      <Tab.Screen
        name="ProviderBookingsTab"
        component={ProviderBookingsStack}
        options={{ tabBarLabel: 'Bookings' }}
      />
      <Tab.Screen
        name="ProviderInboxTab"
        component={ProviderInboxStack}
        options={{ tabBarLabel: 'Inbox' }}
      />
      <Tab.Screen
        name="ProviderProfileTab"
        component={ProviderProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
