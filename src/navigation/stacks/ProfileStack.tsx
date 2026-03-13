import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ProfileStackParamList } from '../types';
import { COLORS } from '../../theme/colors';

import ProfileScreen from '../../screens/client/ProfileScreen';
import EditProfileScreen from '../../screens/client/EditProfileScreen';
import SettingsScreen from '../../screens/client/SettingsScreen';
import NotificationsScreen from '../../screens/client/NotificationsScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        headerTintColor: COLORS.neutral[600],
        headerStyle: { backgroundColor: COLORS.background.primary },
        headerLeft: () =>
          navigation.canGoBack() ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: COLORS.neutral[50],
                marginRight: 8,
              }}
            >
              <Ionicons name="chevron-back" size={22} color={COLORS.neutral[600]} />
            </TouchableOpacity>
          ) : null,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.background.primary },
      })}
    >
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          headerTitle: 'Profile',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: COLORS.neutral[600],
          },
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="EditProfileScreen"
        component={EditProfileScreen}
        options={{ headerTitle: 'Edit profile' }}
      />
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ headerTitle: 'Settings' }}
      />
      <Stack.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{ headerTitle: 'Notifications' }}
      />
    </Stack.Navigator>
  );
}
