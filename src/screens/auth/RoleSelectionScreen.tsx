import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setUser } from '../../store/slices/authSlice';
import { Text, Button } from '../../components/ui';
import { useSweetAlert } from '../../components/feedback';
import { COLORS } from '../../theme/colors';
import axiosInstance from '../../services/api/axiosInstance';

type RoleOption = 'client' | 'vendor';

interface RoleCardData {
  role: RoleOption;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  features: string[];
}

const roleCards: RoleCardData[] = [
  {
    role: 'client',
    icon: 'search',
    title: 'Find & Book Services',
    description: 'Browse and book event services for your special occasions.',
    features: [
      'Browse event service listings',
      'Book photographers, caterers, DJs & more',
      'Manage your bookings and reviews',
      'Save favorites to wishlists',
    ],
  },
  {
    role: 'vendor',
    icon: 'storefront',
    title: 'List & Manage Services',
    description: 'Offer your event services and grow your business.',
    features: [
      'Create service listings',
      'Manage bookings and availability',
      'Track earnings and analytics',
      'Connect with clients directly',
    ],
  },
];

export default function RoleSelectionScreen() {
  const dispatch = useAppDispatch();
  const { showAlert } = useSweetAlert();
  const user = useAppSelector((state) => state.auth.user);

  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleContinue() {
    if (!selectedRole) {
      showAlert({ type: 'warning', title: 'Select a Role', message: 'Please choose how you want to use EventsApp.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axiosInstance.patch('/users/me', { role: selectedRole });

      if (response.data?.data) {
        dispatch(setUser(response.data.data));
      } else if (user) {
        dispatch(setUser({ ...user, role: selectedRole }));
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to update role. Please try again.';
      showAlert({ type: 'error', title: 'Error', message });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderRoleCard(card: RoleCardData, index: number) {
    const isSelected = selectedRole === card.role;

    return (
      <Animated.View
        key={card.role}
        entering={FadeInDown.delay(200 + index * 150).duration(500)}
      >
        <TouchableOpacity
          className="rounded-2xl p-5 mb-4"
          style={{
            borderWidth: 2,
            borderColor: isSelected ? COLORS.primary[500] : COLORS.neutral[200],
            backgroundColor: isSelected ? COLORS.primary[50] : COLORS.background.primary,
          }}
          onPress={() => setSelectedRole(card.role)}
          activeOpacity={0.8}
        >
          {/* Card Header */}
          <View className="flex-row items-center mb-3">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-4"
              style={{
                backgroundColor: isSelected ? COLORS.primary[500] : COLORS.neutral[100],
              }}
            >
              <Ionicons
                name={card.icon}
                size={24}
                color={isSelected ? COLORS.neutral[0] : COLORS.neutral[400]}
              />
            </View>
            <View className="flex-1">
              <Text variant="h4" weight="bold" color={isSelected ? COLORS.primary[600] : COLORS.neutral[600]}>
                {card.title}
              </Text>
              <Text variant="label" className="mt-0.5" color={COLORS.neutral[400]}>
                {card.description}
              </Text>
            </View>

            {/* Selection Indicator */}
            <View
              className="w-6 h-6 rounded-full items-center justify-center"
              style={{
                borderWidth: 2,
                borderColor: isSelected ? COLORS.primary[500] : COLORS.neutral[300],
                backgroundColor: isSelected ? COLORS.primary[500] : 'transparent',
              }}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={14} color={COLORS.neutral[0]} />
              )}
            </View>
          </View>

          {/* Features List */}
          <View className="ml-1 mt-2">
            {card.features.map((feature, featureIndex) => (
              <View key={featureIndex} className="flex-row items-center mb-2">
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={isSelected ? COLORS.primary[500] : COLORS.neutral[300]}
                  style={{ marginRight: 8 }}
                />
                <Text variant="label" color={COLORS.neutral[500]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-12">
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(500)} className="mb-8">
            <Text variant="h3" weight="bold" className="mb-2" color={COLORS.primary[600]}>
              How would you like to use EventsApp?
            </Text>
            <Text variant="body" color={COLORS.neutral[400]} style={{ lineHeight: 24 }}>
              Choose your primary role. You can always switch later from your profile settings.
            </Text>
          </Animated.View>

          {/* Role Cards */}
          <View className="mb-8">
            {roleCards.map((card, index) => renderRoleCard(card, index))}
          </View>

          {/* Continue Button */}
          <Animated.View entering={FadeInUp.delay(500).duration(500)} className="mb-8">
            <Button
              title="Continue"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting || !selectedRole}
              onPress={handleContinue}
            />
          </Animated.View>

          {/* Info Note */}
          <Animated.View
            entering={FadeIn.delay(600).duration(400)}
            className="flex-row items-start rounded-xl p-4 mb-6"
            style={{ backgroundColor: COLORS.neutral[50] }}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.neutral[400]}
              style={{ marginRight: 10, marginTop: 1 }}
            />
            <Text variant="label" className="flex-1" color={COLORS.neutral[400]} style={{ lineHeight: 20 }}>
              Your role determines your app experience. Clients can browse and
              book services, while providers can list and manage their event
              services.
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
