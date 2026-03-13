import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ProviderBookingsStackParamList } from '../types';
import { COLORS } from '../../theme/colors';

import ProviderBookingsScreen from '../../screens/provider/ProviderBookingsScreen';
import ProviderBookingDetailScreen from '../../screens/provider/ProviderBookingDetailScreen';

const Stack = createNativeStackNavigator<ProviderBookingsStackParamList>();

export default function ProviderBookingsStack() {
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
        name="ProviderBookingsScreen"
        component={ProviderBookingsScreen}
        options={{
          headerTitle: 'Bookings',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: COLORS.neutral[600],
          },
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="ProviderBookingDetailScreen"
        component={ProviderBookingDetailScreen}
        options={{ headerTitle: 'Booking details' }}
      />
    </Stack.Navigator>
  );
}
