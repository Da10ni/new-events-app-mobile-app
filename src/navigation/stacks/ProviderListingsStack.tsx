import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ProviderListingsStackParamList } from '../types';
import { COLORS } from '../../theme/colors';

import MyListingsScreen from '../../screens/provider/MyListingsScreen';
import AddListingScreen from '../../screens/provider/AddListingScreen';
import EditListingScreen from '../../screens/provider/EditListingScreen';
import ListingPreviewScreen from '../../screens/provider/ListingPreviewScreen';

const Stack = createNativeStackNavigator<ProviderListingsStackParamList>();

export default function ProviderListingsStack() {
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
        name="MyListingsScreen"
        component={MyListingsScreen}
        options={{
          headerTitle: 'My Listings',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: COLORS.neutral[600],
          },
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="AddListingScreen"
        component={AddListingScreen}
        options={{ headerTitle: 'Create listing' }}
      />
      <Stack.Screen
        name="EditListingScreen"
        component={EditListingScreen}
        options={{ headerTitle: 'Edit listing' }}
      />
      <Stack.Screen
        name="ListingPreviewScreen"
        component={ListingPreviewScreen}
        options={{ headerTitle: 'Preview' }}
      />
    </Stack.Navigator>
  );
}
