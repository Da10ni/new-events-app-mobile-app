import React, { useState, useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { ClientTabParamList } from './types';
import { COLORS } from '../theme/colors';
import { LAYOUT } from '../config/constants';
import { messageApi } from '../services/api/messageApi';

import ExploreStack from './stacks/ExploreStack';
import WishlistStack from './stacks/WishlistStack';
import BookingsStack from './stacks/BookingsStack';
import InboxStack from './stacks/InboxStack';

const Tab = createBottomTabNavigator<ClientTabParamList>();

const TAB_ICON_MAP: Record<keyof ClientTabParamList, { focused: string; unfocused: string }> = {
  ExploreTab: { focused: 'home', unfocused: 'home-outline' },
  WishlistTab: { focused: 'heart', unfocused: 'heart-outline' },
  BookingsTab: { focused: 'calendar', unfocused: 'calendar-outline' },
  InboxTab: { focused: 'chatbubble', unfocused: 'chatbubble-outline' },
};

export default function ClientNavigator() {
  const [unreadCount, setUnreadCount] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await messageApi.getUnreadCount();
        setUnreadCount(res.data?.data?.count || 0);
      } catch {}
    };
    fetchUnread();
    pollingRef.current = setInterval(fetchUnread, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
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
          const showDot = route.name === 'InboxTab' && unreadCount > 0 && !focused;
          return (
            <View style={{ alignItems: 'center', minHeight: 28, justifyContent: 'center' }}>
              <View>
                <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={22} color={color} />
                {showDot && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -4,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: COLORS.primary[400],
                      borderWidth: 1.5,
                      borderColor: '#FFFFFF',
                    }}
                  />
                )}
              </View>
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
        name="ExploreTab"
        component={ExploreStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="WishlistTab"
        component={WishlistStack}
        options={{ tabBarLabel: 'Wishlists' }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsStack}
        options={{ tabBarLabel: 'Bookings' }}
      />
      <Tab.Screen
        name="InboxTab"
        component={InboxStack}
        options={({ route }) => ({
          tabBarLabel: 'Inbox',
          tabBarStyle: getFocusedRouteNameFromRoute(route) === 'ChatScreen'
            ? { display: 'none' as const }
            : {
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
        })}
      />
    </Tab.Navigator>
  );
}
