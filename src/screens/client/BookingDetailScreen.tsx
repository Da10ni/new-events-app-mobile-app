import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { BookingsStackParamList } from '../../navigation/types';
import { useAppDispatch } from '../../store/hooks';
import { showToast } from '../../store/slices/uiSlice';
import { updateBooking } from '../../store/slices/bookingSlice';
import { bookingApi } from '../../services/api/bookingApi';
import { reviewApi } from '../../services/api/reviewApi';
import { Text, Avatar, Badge, Card, Divider, Button } from '../../components/ui';
import { ConfirmationModal, useSweetAlert } from '../../components/feedback';
import type { Booking, Review } from '../../types';
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
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<Review | null>(null);

  const fetchBooking = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      setError(null);
      const res = await bookingApi.getById(bookingId);
      setBooking(res.data.data.booking);
    } catch {
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

  useFocusEffect(
    useCallback(() => {
      fetchBooking();
    }, [fetchBooking])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBooking();
  }, [fetchBooking]);

  const handleCancel = useCallback(async () => {
    if (!booking) return;
    try {
      setCancelling(true);
      await bookingApi.cancel(booking._id, 'Cancelled by client');
      const wasPaid = booking.paymentStatus === 'succeeded';
      const updated = {
        ...booking,
        status: 'cancelled',
        paymentStatus: wasPaid ? 'refunded' as const : booking.paymentStatus,
      };
      setBooking(updated);
      dispatch(updateBooking(updated));
      dispatch(showToast({
        message: wasPaid ? 'Booking cancelled & payment refunded' : 'Booking cancelled',
        type: 'info',
      }));
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

  // Fetch review when booking is reviewed
  useEffect(() => {
    if (booking?.isReviewed && bookingId) {
      reviewApi.getByBooking(bookingId)
        .then((res) => setReviewData(res.data?.data?.review || null))
        .catch(() => setReviewData(null));
    } else {
      setReviewData(null);
    }
  }, [booking?.isReviewed, bookingId]);

  const handleDeleteReview = useCallback(async () => {
    if (!reviewData || !booking) return;
    try {
      setDeletingReview(true);
      await reviewApi.delete(reviewData._id);
      setReviewData(null);
      setShowDeleteReviewModal(false);
      setBooking({ ...booking, isReviewed: false });
      dispatch(updateBooking({ ...booking, isReviewed: false }));
      dispatch(showToast({ message: 'Review deleted', type: 'info' }));
    } catch {
      showAlert({ type: 'error', title: 'Error', message: 'Failed to delete review.' });
    } finally {
      setDeletingReview(false);
    }
  }, [reviewData, booking, dispatch]);

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
  const canPay = ['inquiry', 'pending', 'confirmed'].includes(booking.status) && booking.paymentStatus !== 'succeeded';

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary[500]]}
            tintColor={COLORS.primary[500]}
          />
        }
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

          {/* Payment Status */}
          {booking.paymentStatus && booking.paymentStatus !== 'pending' && (
            <Card padding="md" className="mb-5">
              <Text variant="body" weight="bold" className="mb-3">
                Payment Status
              </Text>
              <View className="flex-row items-center">
                <View
                  style={{
                    height: 40,
                    width: 40,
                    borderRadius: 12,
                    backgroundColor:
                      booking.paymentStatus === 'succeeded'
                        ? COLORS.successLight
                        : booking.paymentStatus === 'refunded'
                        ? '#FFF3E0'
                        : booking.paymentStatus === 'failed'
                        ? COLORS.errorLight
                        : COLORS.neutral[50],
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons
                    name={
                      booking.paymentStatus === 'succeeded'
                        ? 'checkmark-circle'
                        : booking.paymentStatus === 'refunded'
                        ? 'refresh-circle'
                        : booking.paymentStatus === 'failed'
                        ? 'close-circle'
                        : 'time'
                    }
                    size={22}
                    color={
                      booking.paymentStatus === 'succeeded'
                        ? COLORS.success
                        : booking.paymentStatus === 'refunded'
                        ? '#F57C00'
                        : booking.paymentStatus === 'failed'
                        ? COLORS.error
                        : COLORS.neutral[400]
                    }
                  />
                </View>
                <View className="flex-1">
                  <Text variant="label" weight="semibold">
                    {booking.paymentStatus === 'succeeded'
                      ? 'Payment Successful'
                      : booking.paymentStatus === 'refunded'
                      ? 'Payment Refunded'
                      : booking.paymentStatus === 'failed'
                      ? 'Payment Failed'
                      : 'Processing Payment'}
                  </Text>
                  <Text variant="caption" color={COLORS.neutral[400]}>
                    {booking.paymentStatus === 'succeeded'
                      ? `${booking.pricingSnapshot.currency || 'PKR'} ${booking.pricingSnapshot.totalAmount.toLocaleString()} paid`
                      : booking.paymentStatus === 'refunded'
                      ? `${booking.pricingSnapshot.currency || 'PKR'} ${booking.pricingSnapshot.totalAmount.toLocaleString()} refunded to your account`
                      : booking.paymentStatus === 'failed'
                      ? 'Your payment could not be processed'
                      : 'Your payment is being processed'}
                  </Text>
                </View>
              </View>
            </Card>
          )}

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

          {/* Your Review */}
          {booking.isReviewed && reviewData && (
            <Card padding="md" className="mb-5">
              <View className="mb-3 flex-row items-center justify-between">
                <Text variant="body" weight="bold">
                  Your Review
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDeleteReviewModal(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>

              {/* Star Rating */}
              <View className="mb-2 flex-row items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= reviewData.rating ? 'star' : 'star-outline'}
                    size={18}
                    color={star <= reviewData.rating ? '#F59E0B' : COLORS.neutral[300]}
                    style={{ marginRight: 2 }}
                  />
                ))}
                <Text variant="caption" color={COLORS.neutral[400]} className="ml-2">
                  {new Date(reviewData.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              {/* Title */}
              {reviewData.title && (
                <Text variant="label" weight="semibold" className="mb-1">
                  {reviewData.title}
                </Text>
              )}

              {/* Comment */}
              <Text variant="label" color={COLORS.neutral[500]} className="mb-2">
                {reviewData.comment}
              </Text>

              {/* Detailed Ratings */}
              {reviewData.detailedRatings && (
                <View className="mb-2 flex-row flex-wrap" style={{ gap: 6 }}>
                  {reviewData.detailedRatings.quality != null && (
                    <Badge variant="info" text={`Quality: ${reviewData.detailedRatings.quality}/5`} />
                  )}
                  {reviewData.detailedRatings.communication != null && (
                    <Badge variant="info" text={`Communication: ${reviewData.detailedRatings.communication}/5`} />
                  )}
                  {reviewData.detailedRatings.valueForMoney != null && (
                    <Badge variant="info" text={`Value: ${reviewData.detailedRatings.valueForMoney}/5`} />
                  )}
                  {reviewData.detailedRatings.punctuality != null && (
                    <Badge variant="info" text={`Punctuality: ${reviewData.detailedRatings.punctuality}/5`} />
                  )}
                </View>
              )}

              {/* Vendor Reply */}
              {reviewData.vendorReply && (
                <View
                  className="mt-2 rounded-lg p-3"
                  style={{ backgroundColor: COLORS.neutral[50] }}
                >
                  <View className="mb-1 flex-row items-center">
                    <Ionicons name="business-outline" size={14} color={COLORS.neutral[500]} />
                    <Text variant="caption" weight="semibold" color={COLORS.neutral[600]} className="ml-1">
                      Vendor Reply
                    </Text>
                  </View>
                  <Text variant="caption" color={COLORS.neutral[500]}>
                    {reviewData.vendorReply.comment}
                  </Text>
                  <Text variant="caption" color={COLORS.neutral[300]} className="mt-1">
                    {new Date(reviewData.vendorReply.repliedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              )}
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
      {(canCancel || canReview || canPay) && (
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
          {canPay && (
            <View className="mb-3">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('PaymentScreen', { bookingId: booking._id })
                }
                style={{
                  backgroundColor: COLORS.primary[500],
                  borderRadius: 14,
                  paddingVertical: 15,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="lock-closed" size={15} color="rgba(255,255,255,0.85)" />
                  <Text variant="body" weight="bold" color="#fff" style={{ marginLeft: 8, fontSize: 17, letterSpacing: 0.3 }}>
                    Pay {booking.pricingSnapshot.currency || 'PKR'} {booking.pricingSnapshot.totalAmount.toLocaleString()}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                  <Text variant="caption" color="rgba(255,255,255,0.55)" style={{ fontSize: 10 }}>
                    Secured by{' '}
                  </Text>
                  <Svg width={33} height={14} viewBox="0 0 60 25" fill="none">
                    <Path d="M5 10.2c0-.7.6-1 1.5-1 1.4 0 3.1.4 4.5 1.2V6.3C9.5 5.7 8 5.3 6.5 5.3 2.7 5.3 0 7.4 0 10.5c0 4.8 6.6 4 6.6 6.1 0 .8-.7 1.1-1.7 1.1-1.5 0-3.4-.6-4.9-1.5v4.2c1.7.7 3.3 1 4.9 1 3.9 0 6.6-1.9 6.6-5.1C11.5 11.8 5 12.8 5 10.2z" fill="rgba(255,255,255,0.6)" />
                    <Path d="M16.2 2l-4.8 1v3.5l4.8-1V2zM11.4 6.8h4.8v13.5h-4.8V6.8z" fill="rgba(255,255,255,0.6)" />
                    <Path d="M22 6.4l-.3 1.8h-2.1v5.5c0 2.3 1.5 3.2 3.6 3.2 1.1 0 1.9-.2 2.5-.5v-3.5c-.5.2-3.1.9-3.1-1.4V11.6h3.1V8.2h-3.1V6.4H22z" fill="rgba(255,255,255,0.6)" />
                    <Path d="M31.6 11c0-.8.6-1.1 1.3-1.1.9 0 2 .3 2.9.9V7.2c-1-.4-2-.6-2.9-.6-2.9 0-5.1 1.6-5.1 4.4 0 4.3 5.4 3.6 5.4 5.5 0 .9-.8 1.2-1.6 1.2-1.4 0-3.1-.6-4.3-1.4v3.6c1.5.6 2.9.9 4.3.9 3 0 5.2-1.5 5.2-4.4C36.8 12.2 31.6 13 31.6 11z" fill="rgba(255,255,255,0.6)" />
                    <Path d="M43.4 5.3c-1.7 0-2.8.8-3.4 1.3l-.2-1h-4.3v17.9l4.8-1v-4.3c.6.5 1.6 1.1 3.1 1.1 3.1 0 6-2.5 6-8C49.4 7.5 46.5 5.3 43.4 5.3zm-1 11.9c-1 0-1.6-.4-2-.8v-6.4c.4-.5 1.1-.9 2-.9 1.6 0 2.6 1.7 2.6 4.1 0 2.3-1 4-2.6 4z" fill="rgba(255,255,255,0.6)" />
                    <Path d="M55.9 5.3c-3.2 0-5.5 2.8-5.5 7.9 0 5.5 2.6 7.5 6.1 7.5 1.7 0 3-.4 4-1v-3.5c-.9.5-2 .8-3.3.8-1.3 0-2.4-.5-2.6-2h6.6c0-.2 0-.9 0-1.2C61.2 8.3 59.6 5.3 55.9 5.3zm-1.3 6.3c0-1.5.9-2.1 1.7-2.1.8 0 1.6.6 1.6 2.1h-3.3z" fill="rgba(255,255,255,0.6)" />
                  </Svg>
                </View>
              </TouchableOpacity>
            </View>
          )}
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
        message={
          booking?.paymentStatus === 'succeeded'
            ? 'Are you sure you want to cancel this booking? Your payment will be refunded. This action cannot be undone.'
            : 'Are you sure you want to cancel this booking? This action cannot be undone.'
        }
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        destructive
        icon="close-circle"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
        loading={cancelling}
      />

      {/* Delete Review Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteReviewModal}
        title="Delete Review"
        message="Are you sure you want to delete your review? This action cannot be undone."
        confirmText="Delete Review"
        cancelText="Keep Review"
        destructive
        icon="trash"
        onConfirm={handleDeleteReview}
        onCancel={() => setShowDeleteReviewModal(false)}
        loading={deletingReview}
      />
    </View>
  );
}
