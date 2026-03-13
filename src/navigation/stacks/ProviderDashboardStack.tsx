import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ProviderDashboardStackParamList } from '../types';
import { COLORS } from '../../theme/colors';

import DashboardScreen from '../../screens/provider/DashboardScreen';
import EarningsScreen from '../../screens/provider/EarningsScreen';

const Stack = createNativeStackNavigator<ProviderDashboardStackParamList>();

export default function ProviderDashboardStack() {
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
        name="DashboardScreen"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EarningsScreen"
        component={EarningsScreen}
        options={{ headerTitle: 'Earnings' }}
      />
    </Stack.Navigator>
  );
}
