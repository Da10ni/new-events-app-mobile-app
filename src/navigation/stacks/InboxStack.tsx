import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { InboxStackParamList } from '../types';
import { COLORS } from '../../theme/colors';

import InboxScreen from '../../screens/client/InboxScreen';
import ChatScreen from '../../screens/client/ChatScreen';

const Stack = createNativeStackNavigator<InboxStackParamList>();

export default function InboxStack() {
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
        name="InboxScreen"
        component={InboxScreen}
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
        name="ChatScreen"
        component={ChatScreen}
        options={({ route }) => ({
          headerTitle: route.params.recipientName,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 16,
            color: COLORS.neutral[600],
          },
          headerStyle: {
            backgroundColor: COLORS.background.primary,
          },
          statusBarTranslucent: false,
        })}
      />
    </Stack.Navigator>
  );
}
