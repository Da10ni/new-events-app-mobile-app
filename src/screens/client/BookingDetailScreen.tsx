import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookingsStackParamList } from '../../navigation/types';
import { useAppDispatch } from '../../store/hooks';
import { showToast } from '../../store/slices/uiSlice';
import { updateBooking } from '../../store/slices/bookingSlice';
import { bookingApi } from '../../services/api/bookingApi';
import { Text, Avatar, Badge, Card, Divider, Button } from '../../components/ui';
import { ConfirmationModal, useSweetAlert } from '../../components/feedback';
import type { Booking } from '../../types';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<BookingsStackParamList, 'BookingDetailScreen'>;

const STATUS_BADGE_MAP: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; text: string }> = {
  inquiry: { variant: 'info', text: 'Inquiry' },
  pending: { variant: 'warning', text: 'Pending' },
  confirmed: { variant: 'success', text: 'Confirmed' },
  rejected: { variant: 'error', text: 'Rejected' },
  cancelled: { variant: 'error', text: 'Cancelled' },
  completed: { variant: 'default', text: 'Completed' },
};

const STATUS_TIMELINE: Record<string, string[]> = {
  inquiry: ['Inquiry Sent'],
  pending: ['Inquiry Sent', 'Under Review'],
  confirmed: ['Inquiry Sent', 'Under Review', 'Confirmed'],
  rejected: ['Inquiry Sent', 'Under Review', 'Rejected'],
  cancelled: ['Inquiry Sent', 'Cancelled'],
  completed: ['Inquiry Sent', 'Confirmed', 'Completed'],
};

export default function BookingDetailScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const dispatch = useAppDispatch();
  const { showAlert } = useSweetAlert();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await bookingApi.getById(bookingId);
      setBooking(res.data.data.booking);
    } catch {
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleCancel = useCallback(async () => {
    if (!booking) return;
    try {
      setCancelling(true);
      await bookingApi.cancel(booking._id, 'Cancelled by client');
      const updated = { ...booking, status: 'cancelled' };
      setBooking(updated);
      dispatch(updateBooking(updated));
      dispatch(showToast({ message: 'Booking cancelled', type: 'info' }));
      setShowCancelModal(false);
    } catch {
      showAlert({ type: 'error', title: 'Error', message: 'Failed to cancel booking. Please try again.' });
    } finally {
      setCancelling(false);
    }
  }, [booking, dispatch]);

  const handleLeaveReview = useCallback(() => {
    if (!booking) return;
    navigation.navigate('ReviewScreen', {
      bookingId: booking._id,
      listingId: booking.listing._id,
      vendorId: booking.vendor._id,
    });
  }, [booking, navigation]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.neutral[300]} />
        <Text variant="h4" weight="bold" className="mb-2 mt-4 text-center">
          {error || 'Booking not found'}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text variant="body" weight="semibold" color={COLORS.primary[500]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = STATUS_BADGE_MAP[booking.status] || {
    variant: 'default' as const,
    text: booking.status,
  };
  const timeline = STATUS_TIMELINE[booking.status] || ['Inquiry Sent'];
  const primaryImage = booking.listing.images?.[0];
  const canCancel = ['inquiry', 'pending', 'confirmed'].includes(booking.status);
  const canReview = booking.status === 'completed' && !booking.isReviewed;

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-4 pt-4">
          {/* Listing Info Card */}
          <Card padding="sm" className="mb-5 flex-row">
            {primaryImage ? (
              <Image
                source={{ uri: primaryImage.url }}
                className="rounded-lg"
                style={{ width: 80, height: 80 }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="items-center justify-center rounded-lg bg-neutral-50"
                style={{ width: 80, height: 80 }}
              >
                <Ionicons name="image-outline" size={24} color={COLORS.neutral[300]} />
              </View>
            )}
            <View className="ml-3 flex-1 justify-center">
              <Text variant="body" weight="semibold" numberOfLines={2} className="mb-1">
                {booking.listing.title}
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={12} color={COLORS.neutral[400]} />
                <Text variant="caption" color={COLORS.neutral[400]} className="ml-0.5">
                  {booking.listing.address.city}, {booking.listing.address.country}
                </Text>
              </View>
            </View>
          </Card>

          {/* Status Badge (Large) */}
          <View className="mb-5 items-center">
            <View
              className={`rounded-full px-6 py-3 ${
                statusInfo.variant === 'success'
                  ? 'bg-secondary-50'
                  : statusInfo.variant === 'warning'
                  ? 'bg-warning-light'
                  : statusInfo.variant === 'error'
                  ? 'bg-error-light'
                  : statusInfo.variant === 'info'
                  ? 'bg-info-light'
                  : 'bg-neutral-50'
              }`}
            >
              <Text
                variant="body"
                weight="bold"
                color={
                  statusInfo.variant === 'success'
                    ? COLORS.success
                    : statusInfo.variant === 'warning'
                    ? COLORS.warning
                    : statusInfo.variant === 'error'
                    ? COLORS.error
                    : statusInfo.variant === 'info'
                    ? COLORS.info
                    : COLORS.neutral[500]
                }
              >
                {statusInfo.text}
              </Text>
            </View>
          </View>

          {/* Status Timeline */}
          <Card padding="md" className="mb-5">
            <Text variant="body" weight="bold" className="mb-4">
              Booking Status
            </Text>
            {timeline.map((step, index) => {
              const isLast = index === timeline.length - 1;
              const isCompleted = true;
              return (
                <View key={index} className="flex-row">
                  <View className="mr-3 items-center">
                    <View
                      className={`items-center justify-center rounded-full ${
                        isCompleted ? 'bg-success' : 'bg-neutral-200'
                      }`}
                      style={{ width: 24, height: 24 }}
                    >
                      <Ionicons
                        name={isCompleted ? 'checkmark' : 'ellipse'}
                        size={isCompleted ? 14 : 8}
                        color={COLORS.neutral[0]}
                      />
                    </View>
                    {!isLast && (
                      <View
                        className={`my-0.5 w-0.5 ${
                          isCompleted ? 'bg-success' : 'bg-neutral-200'
                        }`}
                        style={{ height: 24 }}
                      />
                    )}
                  </View>
                  <View className="flex-1 pb-4">
                    <Text variant="label" weight={isLast ? 'bold' : 'medium'}>
                      {step}
                    </Text>
                    {isLast && (
                      <Text variant="caption" color={COLORS.neutral[400]} className="mt-0.5">
                        {new Date(booking.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </Card>

          {/* Booking Details */}
          <Card padding="md" className="mb-5">
            <Text variant="body" weight="bold" className="mb-3">
              Booking Details
            </Text>

            <View className="mb-3 flex-row items-center">
              <Ionicons name="calendar-outline" size={18} color={COLORS.neutral[400]} />
              <View className="ml-3">
                <Text variant="caption" color={COLORS.neutral[400]}>
                  Event Date
                </Text>
                <Text variant="label" weight="medium">
                  {new Date(booking.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {booking.guestCount && (
              <View className="mb-3 flex-row items-center">
                <Ionicons name="people-outline" size={18} color={COLORS.neutral[400]} />
                <View className="ml-3">
                  <Text variant="caption" color={COLORS.neutral[400]}>
                    Number of Guests
                  </Text>
                  <Text variant="label" weight="medium">
                    {booking.guestCount} guests
                  </Text>
                </View>
              </View>
            )}

            {booking.specialRequests && (
              <View className="flex-row items-start">
                <Ionicons name="chatbubble-outline" size={18} color={COLORS.neutral[400]} />
                <View className="ml-3 flex-1">
                  <Text variant="caption" color={COLORS.neutral[400]}>
                    Special Requests
                  </Text>
                  <Text variant="label" weight="medium">
                    {booking.specialRequests}
                  </Text>
                </View>
              </View>
            )}

            {booking.bookingNumber && (
              <View className="mt-3 flex-row items-center">
                <Ionicons name="receipt-outline" size={18} color={COLORS.neutral[400]} />
                <View className="ml-3">
                  <Text variant="caption" color={COLORS.neutral[400]}>
                    Booking Number
                  </Text>
                  <Text variant="label" weight="medium">
                    {booking.bookingNumber}
                  </Text>
                </View>
              </View>
            )}
          </Card>

          {/* Price Breakdown */}
          <Card padding="md" className="mb-5">
            <Text variant="body" weight="bold" className="mb-3">
              Price Breakdown
            </Text>

            <View className="mb-2 flex-row items-center justify-between">
              <Text variant="label" color={COLORS.neutral[400]}>
                Base price
              </Text>
              <Text variant="label" color={COLORS.neutral[500]}>
                {booking.pricingSnapshot.currency || 'PKR'}{' '}
                {booking.pricingSnapshot.basePrice.toLocaleString()}
              </Text>
            </View>

            {booking.pricingSnapshot.packageName && (
              <View className="mb-2 flex-row items-center justify-between">
                <Text variant="label" color={COLORS.neutral[400]}>
                  Package
                </Text>
                <Text variant="label" color={COLORS.neutral[500]}>
                  {booking.pricingSnapshot.packageName}
                </Text>
              </View>
            )}

            <Divider className="my-3" />

            <View className="flex-row items-center justify-between">
              <Text variant="body" weight="bold">
                Total
              </Text>
              <Text variant="body" weight="bold" color={COLORS.primary[500]}>
                {booking.pricingSnapshot.currency || 'PKR'}{' '}
                {booking.pricingSnapshot.totalAmount.toLocaleString()}
              </Text>
            </View>
          </Card>

          {/* Vendor Info */}
          <Card padding="md" className="mb-5">
            <Text variant="body" weight="bold" className="mb-3">
              Vendor
            </Text>
            <View className="flex-row items-center">
              <Avatar
                firstName={booking.vendor.businessName}
                lastName=""
                size="md"
              />
              <View className="ml-3 flex-1">
                <Text variant="label" weight="semibold">
                  {booking.vendor.businessName}
                </Text>
                <Text variant="caption" color={COLORS.neutral[400]}>
                  Service Provider
                </Text>
              </View>
              <TouchableOpacity className="rounded-full bg-neutral-50 p-2">
                <Ionicons name="chatbubble-outline" size={20} color={COLORS.neutral[600]} />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Vendor Response */}
          {booking.vendorResponse && (
            <Card padding="md" className="mb-5">
              <Text variant="body" weight="bold" className="mb-2">
                Vendor Response
              </Text>
              <Text variant="body" color={COLORS.neutral[500]}>
                {booking.vendorResponse}
              </Text>
            </Card>
          )}

          {/* Cancellation Reason */}
          {booking.cancellationReason && (
            <Card padding="md" className="mb-5">
              <Text variant="body" weight="bold" color={COLORS.error} className="mb-2">
                Cancellation Reason
              </Text>
              <Text variant="body" color={COLORS.neutral[500]}>
                {booking.cancellationReason}
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {(canCancel || canReview) && (
        <View
          className="border-t border-neutral-100 bg-white px-4 pb-8 pt-4"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {canReview && (
            <Button
              title="Leave a Review"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleLeaveReview}
              leftIcon="star-outline"
            />
          )}
          {canCancel && (
            <Button
              title="Cancel Booking"
              variant="outline"
              size="lg"
              fullWidth
              onPress={() => setShowCancelModal(true)}
              className={canReview ? 'mt-3' : ''}
            />
          )}
        </View>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        visible={showCancelModal}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        destructive
        icon="close-circle"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
        loading={cancelling}
      />
    </View>
  );
}
