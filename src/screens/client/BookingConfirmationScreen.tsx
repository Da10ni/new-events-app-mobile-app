import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ExploreStackParamList } from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { bookingApi } from '../../services/api/bookingApi';
import { Text, Card, Divider, Button } from '../../components/ui';
import type { Booking } from '../../types';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<ExploreStackParamList, 'BookingConfirmationScreen'>;

function StripeLogo({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  const width = size * 2.4;
  return (
    <Svg width={width} height={size} viewBox="0 0 60 25" fill="none">
      <Path
        d="M5 10.2c0-.7.6-1 1.5-1 1.4 0 3.1.4 4.5 1.2V6.3C9.5 5.7 8 5.3 6.5 5.3 2.7 5.3 0 7.4 0 10.5c0 4.8 6.6 4 6.6 6.1 0 .8-.7 1.1-1.7 1.1-1.5 0-3.4-.6-4.9-1.5v4.2c1.7.7 3.3 1 4.9 1 3.9 0 6.6-1.9 6.6-5.1C11.5 11.8 5 12.8 5 10.2z"
        fill={color}
      />
      <Path
        d="M16.2 2l-4.8 1v3.5l4.8-1V2zM11.4 6.8h4.8v13.5h-4.8V6.8z"
        fill={color}
      />
      <Path
        d="M22 6.4l-.3 1.8h-2.1v5.5c0 2.3 1.5 3.2 3.6 3.2 1.1 0 1.9-.2 2.5-.5v-3.5c-.5.2-3.1.9-3.1-1.4V11.6h3.1V8.2h-3.1V6.4H22z"
        fill={color}
      />
      <Path
        d="M31.6 11c0-.8.6-1.1 1.3-1.1.9 0 2 .3 2.9.9V7.2c-1-.4-2-.6-2.9-.6-2.9 0-5.1 1.6-5.1 4.4 0 4.3 5.4 3.6 5.4 5.5 0 .9-.8 1.2-1.6 1.2-1.4 0-3.1-.6-4.3-1.4v3.6c1.5.6 2.9.9 4.3.9 3 0 5.2-1.5 5.2-4.4C36.8 12.2 31.6 13 31.6 11z"
        fill={color}
      />
      <Path
        d="M43.4 5.3c-1.7 0-2.8.8-3.4 1.3l-.2-1h-4.3v17.9l4.8-1v-4.3c.6.5 1.6 1.1 3.1 1.1 3.1 0 6-2.5 6-8C49.4 7.5 46.5 5.3 43.4 5.3zm-1 11.9c-1 0-1.6-.4-2-.8v-6.4c.4-.5 1.1-.9 2-.9 1.6 0 2.6 1.7 2.6 4.1 0 2.3-1 4-2.6 4z"
        fill={color}
      />
      <Path
        d="M55.9 5.3c-3.2 0-5.5 2.8-5.5 7.9 0 5.5 2.6 7.5 6.1 7.5 1.7 0 3-.4 4-1v-3.5c-.9.5-2 .8-3.3.8-1.3 0-2.4-.5-2.6-2h6.6c0-.2 0-.9 0-1.2C61.2 8.3 59.6 5.3 55.9 5.3zm-1.3 6.3c0-1.5.9-2.1 1.7-2.1.8 0 1.6.6 1.6 2.1h-3.3z"
        fill={color}
      />
    </Svg>
  );
}

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

          {/* Pay Now */}
          {booking && (
            <Card padding="md" className="mb-6">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text variant="caption" color={COLORS.neutral[400]}>
                    Amount Due
                  </Text>
                  <Text variant="h3" weight="bold" color={COLORS.primary[500]}>
                    {booking.pricingSnapshot.currency || 'PKR'}{' '}
                    {booking.pricingSnapshot.totalAmount.toLocaleString()}
                  </Text>
                </View>
                <View
                  className="items-center justify-center rounded-full"
                  style={{ width: 36, height: 36, backgroundColor: '#635BFF' }}
                >
                  <Ionicons name="card" size={18} color="#fff" />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('PaymentScreen', { bookingId: booking._id })
                }
                style={{
                  backgroundColor: '#635BFF',
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  marginTop: 14,
                  shadowColor: '#635BFF',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <View className="items-center">
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="lock-closed" size={15} color="rgba(255,255,255,0.8)" />
                    <Text
                      variant="body"
                      weight="bold"
                      color="#fff"
                      className="ml-2"
                      style={{ fontSize: 17, letterSpacing: 0.5 }}
                    >
                      Pay Now
                    </Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-center">
                    <Text
                      variant="caption"
                      color="rgba(255,255,255,0.6)"
                      style={{ fontSize: 10, letterSpacing: 0.3 }}
                    >
                      powered by{' '}
                    </Text>
                    <StripeLogo size={11} color="rgba(255,255,255,0.7)" />
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          )}

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
