import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ExploreStackParamList } from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { bookingApi } from '../../services/api/bookingApi';
import { Text, Card, Divider, Button } from '../../components/ui';
import type { Booking } from '../../types';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<ExploreStackParamList, 'BookingConfirmationScreen'>;

const NEXT_STEPS = [
  {
    icon: 'mail-outline' as const,
    title: 'Request Sent',
    description: 'Your booking request has been sent to the vendor.',
  },
  {
    icon: 'time-outline' as const,
    title: 'Vendor Review',
    description: 'The vendor will review your request and respond within 24-48 hours.',
  },
  {
    icon: 'checkmark-circle-outline' as const,
    title: 'Confirmation',
    description: 'Once confirmed, you will receive a notification and booking details.',
  },
  {
    icon: 'chatbubble-outline' as const,
    title: 'Stay Connected',
    description: 'Message the vendor for any questions or special arrangements.',
  },
];

export default function BookingConfirmationScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await bookingApi.getById(bookingId);
        setBooking(res.data.data.booking);
      } catch {
        // Even if fetch fails, show confirmation UI
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const handleViewBookings = () => {
    navigation.getParent()?.navigate('BookingsTab', {
      screen: 'BookingsScreen',
    });
  };

  const handleBackToExplore = () => {
    navigation.popToTop();
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="items-center px-6 pt-8">
        {/* Success Animation */}
        <Animated.View
          className="mb-6 items-center justify-center rounded-full bg-secondary-50"
          style={{
            width: 100,
            height: 100,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View className="items-center justify-center rounded-full bg-success p-4">
            <Ionicons name="checkmark" size={40} color={COLORS.neutral[0]} />
          </View>
        </Animated.View>

        {/* Title */}
        <Text variant="h2" weight="bold" className="mb-2 text-center">
          Booking Request Sent!
        </Text>
        <Text variant="body" color={COLORS.neutral[400]} className="mb-6 text-center">
          Your booking request has been successfully submitted.
        </Text>

        {/* Booking Number */}
        <Animated.View className="w-full" style={{ opacity: fadeAnim }}>
          {booking && (
            <Card padding="md" className="mb-6">
              <View className="items-center">
                <Text variant="caption" color={COLORS.neutral[400]} className="mb-1">
                  Booking Number
                </Text>
                <Text variant="h3" weight="bold" color={COLORS.primary[500]}>
                  {booking.bookingNumber || bookingId.slice(-8).toUpperCase()}
                </Text>
              </View>
            </Card>
          )}

          {/* Booking Summary */}
          {booking && (
            <Card padding="md" className="mb-6">
              <Text variant="body" weight="bold" className="mb-3">
                Booking Summary
              </Text>

              <View className="mb-2 flex-row items-center justify-between">
                <Text variant="label" color={COLORS.neutral[400]}>
                  Service
                </Text>
                <Text variant="label" weight="medium" className="flex-1 text-right" numberOfLines={1}>
                  {booking.listing.title}
                </Text>
              </View>

              <View className="mb-2 flex-row items-center justify-between">
                <Text variant="label" color={COLORS.neutral[400]}>
                  Event Date
                </Text>
                <Text variant="label" weight="medium">
                  {new Date(booking.eventDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              {booking.guestCount && (
                <View className="mb-2 flex-row items-center justify-between">
                  <Text variant="label" color={COLORS.neutral[400]}>
                    Guests
                  </Text>
                  <Text variant="label" weight="medium">
                    {booking.guestCount}
                  </Text>
                </View>
              )}

              {booking.pricingSnapshot.packageName && (
                <View className="mb-2 flex-row items-center justify-between">
                  <Text variant="label" color={COLORS.neutral[400]}>
                    Package
                  </Text>
                  <Text variant="label" weight="medium">
                    {booking.pricingSnapshot.packageName}
                  </Text>
                </View>
              )}

              <Divider className="my-3" />

              <View className="flex-row items-center justify-between">
                <Text variant="body" weight="bold">
                  Total Amount
                </Text>
                <Text variant="body" weight="bold" color={COLORS.primary[500]}>
                  {booking.pricingSnapshot.currency || 'PKR'}{' '}
                  {booking.pricingSnapshot.totalAmount.toLocaleString()}
                </Text>
              </View>
            </Card>
          )}

          {/* What's Next */}
          <Card padding="md" className="mb-8">
            <Text variant="body" weight="bold" className="mb-4">
              What's Next?
            </Text>

            {NEXT_STEPS.map((step, index) => (
              <View key={index} className="mb-4 flex-row last:mb-0">
                <View className="mr-3 items-center">
                  <View className="items-center justify-center rounded-full bg-primary-50 p-2">
                    <Ionicons name={step.icon} size={20} color={COLORS.primary[500]} />
                  </View>
                  {index < NEXT_STEPS.length - 1 && (
                    <View className="my-1 h-6 w-0.5 bg-neutral-100" />
                  )}
                </View>
                <View className="flex-1 pt-0.5">
                  <Text variant="label" weight="semibold" className="mb-0.5">
                    {step.title}
                  </Text>
                  <Text variant="caption" color={COLORS.neutral[400]}>
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </Card>

          {/* Action Buttons */}
          <Button
            title="View My Bookings"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleViewBookings}
            className="mb-3"
          />
          <Button
            title="Back to Explore"
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleBackToExplore}
          />
        </Animated.View>
      </View>
    </ScrollView>
  );
}
