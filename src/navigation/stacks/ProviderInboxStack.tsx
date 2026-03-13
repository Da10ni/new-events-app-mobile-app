import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ProviderInboxStackParamList } from '../types';
import { COLORS } from '../../theme/colors';

import ProviderInboxScreen from '../../screens/provider/ProviderInboxScreen';
import ProviderChatScreen from '../../screens/provider/ProviderChatScreen';

const Stack = createNativeStackNavigator<ProviderInboxStackParamList>();

export default function ProviderInboxStack() {
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
        name="ProviderInboxScreen"
        component={ProviderInboxScreen}
        options={{
          headerTitle: 'Inbox',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: COLORS.neutral[600],
          },
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="ProviderChatScreen"
        component={ProviderChatScreen}
        options={({ route }) => ({
          headerTitle: route.params.recipientName,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 16,
            color: COLORS.neutral[600],
          },
        })}
      />
    </Stack.Navigator>
  );
}
