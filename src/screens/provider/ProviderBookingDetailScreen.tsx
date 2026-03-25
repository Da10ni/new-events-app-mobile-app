import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProviderBookingsStackParamList } from '../../navigation/types';
import { bookingApi } from '../../services/api/bookingApi';
import { reviewApi } from '../../services/api/reviewApi';
import { Text, Badge, Card, Avatar, Button, TextInput, Divider, Skeleton } from '../../components/ui';
import { SectionHeader } from '../../components/layout';
import { ConfirmationModal, LoadingOverlay, useSweetAlert } from '../../components/feedback';
import type { Booking, Review } from '../../types';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<ProviderBookingsStackParamList, 'ProviderBookingDetailScreen'>;

const getStatusBadgeVariant = (
  status: string
): 'default' | 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'confirmed': return 'success';
    case 'pending':
    case 'inquiry': return 'warning';
    case 'cancelled':
    case 'rejected': return 'error';
    case 'completed': return 'info';
    default: return 'default';
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PK', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

interface StatusTimelineItem {
  status: string;
  label: string;
  date?: string;
  isActive: boolean;
  isCompleted: boolean;
}

const getStatusTimeline = (booking: Booking): StatusTimelineItem[] => {
  const statusOrder = ['inquiry', 'pending', 'confirmed', 'completed'];
  const currentIndex = statusOrder.indexOf(booking.status);

  if (booking.status === 'cancelled' || booking.status === 'rejected') {
    return [
      { status: 'inquiry', label: 'Inquiry', isActive: false, isCompleted: true, date: booking.createdAt },
      {
        status: booking.status,
        label: booking.status === 'cancelled' ? 'Cancelled' : 'Rejected',
        isActive: true,
        isCompleted: false,
      },
    ];
  }

  return statusOrder.map((status, index) => ({
    status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    isActive: index === currentIndex,
    isCompleted: index < currentIndex,
    date: index <= currentIndex ? (index === 0 ? booking.createdAt : undefined) : undefined,
  }));
};

export default function ProviderBookingDetailScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const { showAlert } = useSweetAlert();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewData, setReviewData] = useState<Review | null>(null);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    action: string;
    destructive: boolean;
  }>({
    visible: false,
    title: '',
    message: '',
    action: '',
    destructive: false,
  });

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await bookingApi.getById(bookingId);
        setBooking(res.data?.data?.booking || null);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

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

  const handleReply = async () => {
    if (!replyText.trim() || !reviewData) return;
    try {
      setReplyLoading(true);
      const res = await reviewApi.addReply(reviewData._id, replyText.trim());
      setReviewData(res.data?.data?.review || { ...reviewData, vendorReply: { comment: replyText.trim(), repliedAt: new Date().toISOString() } });
      setShowReplyInput(false);
      setReplyText('');
      showAlert({ type: 'success', title: 'Success', message: 'Reply posted successfully' });
    } catch {
      showAlert({ type: 'error', title: 'Error', message: 'Failed to post reply' });
    } finally {
      setReplyLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!booking) return;
    try {
      setActionLoading(true);
      const wasPaid = booking.paymentStatus === 'succeeded';
      await bookingApi.updateStatus(booking._id, {
        status: newStatus,
        vendorResponse: notes.trim() || undefined,
      });

      const wasRefunded = (newStatus === 'rejected' || newStatus === 'cancelled') && wasPaid;
      const updatedPaymentStatus = wasRefunded ? 'refunded' as const : booking.paymentStatus;
      setBooking((prev) => (prev ? { ...prev, status: newStatus, paymentStatus: updatedPaymentStatus } : prev));
      setConfirmModal((prev) => ({ ...prev, visible: false }));

      const refundMsg = wasRefunded ? ' Payment has been refunded to the client.' : '';
      showAlert({ type: 'success', title: 'Success', message: `Booking ${newStatus} successfully.${refundMsg}` });
    } catch (err: any) {
      showAlert({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to update booking' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!booking) return;
    try {
      setActionLoading(true);
      await bookingApi.complete(booking._id);
      setBooking((prev) => (prev ? { ...prev, status: 'completed' } : prev));
      setConfirmModal((prev) => ({ ...prev, visible: false }));
      showAlert({ type: 'success', title: 'Success', message: 'Booking marked as completed' });
    } catch (err: any) {
      showAlert({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to complete booking' });
    } finally {
      setActionLoading(false);
    }
  };

  const showConfirmation = (action: string, title: string, message: string, destructive: boolean) => {
    setConfirmModal({ visible: true, title, message, action, destructive });
  };

  const handleConfirm = () => {
    switch (confirmModal.action) {
      case 'accept':
        handleStatusUpdate('confirmed');
        break;
      case 'reject':
        handleStatusUpdate('rejected');
        break;
      case 'confirm':
        handleStatusUpdate('confirmed');
        break;
      case 'cancel':
        handleStatusUpdate('cancelled');
        break;
      case 'complete':
        handleMarkComplete();
        break;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
        <ScrollView className="flex-1 px-4 pt-4">
          <Skeleton variant="rect" height={100} className="mb-4" />
          <Skeleton variant="rect" height={80} className="mb-4" />
          <Skeleton variant="text" width="40%" height={22} className="mb-3" />
          <Skeleton variant="rect" height={120} className="mb-4" />
          <Skeleton variant="rect" height={160} className="mb-4" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['left', 'right']}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text variant="body" color={COLORS.error} className="mt-3">
          {error || 'Booking not found'}
        </Text>
      </SafeAreaView>
    );
  }

  const timeline = getStatusTimeline(booking);

  const renderActionButtons = () => {
    const { status } = booking;

    switch (status) {
      case 'inquiry':
        return (
          <View className="flex-row gap-3">
            <Button
              title="Reject"
              variant="outline"
              size="lg"
              fullWidth
              className="flex-1 border-error"
              onPress={() =>
                showConfirmation(
                  'reject',
                  'Reject Booking',
                  booking.paymentStatus === 'succeeded'
                    ? 'Are you sure you want to reject this booking? The client\'s payment will be refunded and they will be notified.'
                    : 'Are you sure you want to reject this booking? The client will be notified.',
                  true
                )
              }
            />
            <Button
              title="Accept"
              variant="secondary"
              size="lg"
              fullWidth
              className="flex-1"
              onPress={() =>
                showConfirmation(
                  'accept',
                  'Accept Booking',
                  'Accept this booking? The client will be notified of the confirmation.',
                  false
                )
              }
            />
          </View>
        );
      case 'pending':
        return (
          <View className="flex-row gap-3">
            <Button
              title="Reject"
              variant="outline"
              size="lg"
              fullWidth
              className="flex-1 border-error"
              onPress={() =>
                showConfirmation(
                  'reject',
                  'Reject Booking',
                  booking.paymentStatus === 'succeeded'
                    ? 'Are you sure you want to reject this booking? The client\'s payment will be refunded and they will be notified.'
                    : 'Are you sure you want to reject this booking?',
                  true
                )
              }
            />
            <Button
              title="Confirm"
              variant="secondary"
              size="lg"
              fullWidth
              className="flex-1"
              onPress={() =>
                showConfirmation(
                  'confirm',
                  'Confirm Booking',
                  'Confirm this booking? The client will be notified.',
                  false
                )
              }
            />
          </View>
        );
      case 'confirmed':
        return (
          <View className="flex-row gap-3">
            <Button
              title="Cancel"
              variant="outline"
              size="lg"
              fullWidth
              className="flex-1 border-error"
              onPress={() =>
                showConfirmation(
                  'cancel',
                  'Cancel Booking',
                  booking.paymentStatus === 'succeeded'
                    ? 'Are you sure you want to cancel this confirmed booking? The client\'s payment will be refunded and they will be notified.'
                    : 'Are you sure you want to cancel this confirmed booking? The client will be notified.',
                  true
                )
              }
            />
            <Button
              title="Mark Complete"
              variant="primary"
              size="lg"
              fullWidth
              className="flex-1"
              onPress={() =>
                showConfirmation(
                  'complete',
                  'Complete Booking',
                  'Mark this booking as completed?',
                  false
                )
              }
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Client Info Section */}
        <Card padding="lg" className="mx-4 mt-4">
          <View className="flex-row items-center">
            <Avatar
              source={booking.client?.avatar?.url}
              firstName={booking.client?.firstName || ''}
              lastName={booking.client?.lastName || ''}
              size="lg"
            />
            <View className="ml-4 flex-1">
              <Text variant="h4" weight="bold" className="text-neutral-600">
                {booking.client?.firstName} {booking.client?.lastName}
              </Text>
              {booking.client?.email && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`mailto:${booking.client.email}`)}
                  className="flex-row items-center mt-1"
                >
                  <Ionicons name="mail-outline" size={14} color={COLORS.neutral[400]} />
                  <Text variant="caption" color={COLORS.neutral[400]} className="ml-1">
                    {booking.client.email}
                  </Text>
                </TouchableOpacity>
              )}
              {booking.client?.phone && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${booking.client.phone}`)}
                  className="flex-row items-center mt-0.5"
                >
                  <Ionicons name="call-outline" size={14} color={COLORS.neutral[400]} />
                  <Text variant="caption" color={COLORS.neutral[400]} className="ml-1">
                    {booking.client.phone}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Badge
              text={booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              variant={getStatusBadgeVariant(booking.status)}
            />
          </View>
        </Card>

        {/* Listing Info */}
        <View className="px-4 mt-4">
          <SectionHeader title="Listing" />
          <Card padding="md" className="mb-4">
            <View className="flex-row items-center">
              {booking.listing?.images?.[0]?.url ? (
                <Image
                  source={{ uri: booking.listing.images[0].url }}
                  className="h-16 w-16 rounded-lg"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-16 w-16 items-center justify-center rounded-lg bg-neutral-50">
                  <Ionicons name="image-outline" size={24} color={COLORS.neutral[300]} />
                </View>
              )}
              <View className="ml-3 flex-1">
                <Text variant="label" weight="semibold" className="text-neutral-600">
                  {booking.listing?.title}
                </Text>
                <Text variant="caption" color={COLORS.neutral[400]}>
                  {booking.listing?.address?.city}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Booking Details */}
        <View className="px-4">
          <SectionHeader title="Booking Details" />
          <Card padding="md" className="mb-4">
            <View className="flex-row items-center mb-3">
              <View className="flex-row items-center flex-1">
                <Ionicons name="document-text-outline" size={18} color={COLORS.neutral[400]} />
                <Text variant="caption" color={COLORS.neutral[400]} className="ml-2">
                  Booking #
                </Text>
              </View>
              <Text variant="label" weight="semibold" className="text-neutral-600">
                {booking.bookingNumber || booking._id.slice(-8)}
              </Text>
            </View>

            <View className="flex-row items-center mb-3">
              <View className="flex-row items-center flex-1">
                <Ionicons name="calendar-outline" size={18} color={COLORS.neutral[400]} />
                <Text variant="caption" color={COLORS.neutral[400]} className="ml-2">
                  Event Date
                </Text>
              </View>
              <Text variant="label" weight="semibold" className="text-neutral-600">
                {formatDate(booking.eventDate)}
              </Text>
            </View>

            {booking.guestCount && (
              <View className="flex-row items-center mb-3">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="people-outline" size={18} color={COLORS.neutral[400]} />
                  <Text variant="caption" color={COLORS.neutral[400]} className="ml-2">
                    Guests
                  </Text>
                </View>
                <Text variant="label" weight="semibold" className="text-neutral-600">
                  {booking.guestCount}
                </Text>
              </View>
            )}

            {booking.eventType && (
              <View className="flex-row items-center mb-3">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="sparkles-outline" size={18} color={COLORS.neutral[400]} />
                  <Text variant="caption" color={COLORS.neutral[400]} className="ml-2">
                    Event Type
                  </Text>
                </View>
                <Text variant="label" weight="semibold" className="text-neutral-600">
                  {booking.eventType}
                </Text>
              </View>
            )}

            {booking.timeSlot && (
              <View className="flex-row items-center mb-3">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="time-outline" size={18} color={COLORS.neutral[400]} />
                  <Text variant="caption" color={COLORS.neutral[400]} className="ml-2">
                    Time Slot
                  </Text>
                </View>
                <Text variant="label" weight="semibold" className="text-neutral-600">
                  {booking.timeSlot.startTime} - {booking.timeSlot.endTime}
                </Text>
              </View>
            )}

            {booking.specialRequests && (
              <View className="mt-2 rounded-lg bg-neutral-50 p-3">
                <Text variant="caption" weight="semibold" color={COLORS.neutral[500]} className="mb-1">
                  Special Requests
                </Text>
                <Text variant="caption" color={COLORS.neutral[400]}>
                  {booking.specialRequests}
                </Text>
              </View>
            )}

            {booking.clientMessage && (
              <View className="mt-2 rounded-lg bg-neutral-50 p-3">
                <Text variant="caption" weight="semibold" color={COLORS.neutral[500]} className="mb-1">
                  Client Message
                </Text>
                <Text variant="caption" color={COLORS.neutral[400]}>
                  {booking.clientMessage}
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* Price Breakdown */}
        <View className="px-4">
          <SectionHeader title="Price Breakdown" />
          <Card padding="md" className="mb-4">
            {booking.pricingSnapshot?.packageName && (
              <View className="flex-row items-center justify-between mb-2">
                <Text variant="label" color={COLORS.neutral[400]}>
                  Package
                </Text>
                <Text variant="label" weight="medium" className="text-neutral-600">
                  {booking.pricingSnapshot.packageName}
                </Text>
              </View>
            )}

            <View className="flex-row items-center justify-between mb-2">
              <Text variant="label" color={COLORS.neutral[400]}>
                Base Price
              </Text>
              <Text variant="label" weight="medium" className="text-neutral-600">
                PKR {booking.pricingSnapshot?.basePrice?.toLocaleString()}
              </Text>
            </View>

            <Divider className="my-2" />

            <View className="flex-row items-center justify-between">
              <Text variant="body" weight="bold" className="text-neutral-600">
                Total
              </Text>
              <Text variant="h4" weight="bold" color={COLORS.primary[500]}>
                PKR {booking.pricingSnapshot?.totalAmount?.toLocaleString()}
              </Text>
            </View>
          </Card>
        </View>

        {/* Payment Status */}
        <View className="px-4">
          <SectionHeader title="Payment" />
          <Card padding="md" className="mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons
                  name={
                    booking.paymentStatus === 'succeeded'
                      ? 'checkmark-circle'
                      : booking.paymentStatus === 'refunded'
                      ? 'arrow-undo-circle'
                      : booking.paymentStatus === 'failed'
                      ? 'close-circle'
                      : booking.paymentStatus === 'processing'
                      ? 'time'
                      : 'card-outline'
                  }
                  size={22}
                  color={
                    booking.paymentStatus === 'succeeded'
                      ? COLORS.success
                      : booking.paymentStatus === 'refunded'
                      ? COLORS.info
                      : booking.paymentStatus === 'failed'
                      ? COLORS.error
                      : booking.paymentStatus === 'processing'
                      ? COLORS.warning
                      : COLORS.neutral[400]
                  }
                />
                <Text variant="label" weight="medium" color={COLORS.neutral[600]} className="ml-2">
                  Payment Status
                </Text>
              </View>
              <Badge
                text={
                  booking.paymentStatus === 'succeeded'
                    ? 'Paid'
                    : booking.paymentStatus === 'refunded'
                    ? 'Refunded'
                    : booking.paymentStatus === 'failed'
                    ? 'Failed'
                    : booking.paymentStatus === 'processing'
                    ? 'Processing'
                    : 'Unpaid'
                }
                variant={
                  booking.paymentStatus === 'succeeded'
                    ? 'success'
                    : booking.paymentStatus === 'refunded'
                    ? 'info'
                    : booking.paymentStatus === 'failed'
                    ? 'error'
                    : booking.paymentStatus === 'processing'
                    ? 'warning'
                    : 'default'
                }
              />
            </View>
          </Card>
        </View>

        {/* Status Timeline */}
        <View className="px-4">
          <SectionHeader title="Status Timeline" />
          <Card padding="md" className="mb-4">
            {timeline.map((item, index) => (
              <View key={item.status} className="flex-row">
                <View className="items-center mr-4">
                  <View
                    className={`h-8 w-8 items-center justify-center rounded-full ${
                      item.isCompleted
                        ? 'bg-success'
                        : item.isActive
                        ? item.status === 'cancelled' || item.status === 'rejected'
                          ? 'bg-error'
                          : 'bg-primary-500'
                        : 'bg-neutral-100'
                    }`}
                  >
                    {item.isCompleted ? (
                      <Ionicons name="checkmark" size={16} color={COLORS.neutral[0]} />
                    ) : item.isActive ? (
                      <View className="h-3 w-3 rounded-full bg-white" />
                    ) : (
                      <View className="h-3 w-3 rounded-full bg-neutral-300" />
                    )}
                  </View>
                  {index < timeline.length - 1 && (
                    <View
                      className={`w-0.5 flex-1 min-h-[24px] ${
                        item.isCompleted ? 'bg-success' : 'bg-neutral-100'
                      }`}
                    />
                  )}
                </View>
                <View className="flex-1 pb-4">
                  <Text
                    variant="label"
                    weight={item.isActive ? 'bold' : 'medium'}
                    color={item.isActive ? COLORS.neutral[600] : COLORS.neutral[400]}
                  >
                    {item.label}
                  </Text>
                  {item.date && (
                    <Text variant="caption" color={COLORS.neutral[300]}>
                      {formatShortDate(item.date)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card>
        </View>

        {/* Internal Notes */}
        <View className="px-4">
          <SectionHeader title="Vendor Notes" />
          <TextInput
            placeholder="Add internal notes about this booking..."
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        {/* Cancellation Reason */}
        {booking.cancellationReason && (
          <View className="px-4">
            <SectionHeader title="Cancellation Reason" />
            <Card padding="md" className="mb-4 bg-error-light">
              <Text variant="body" color={COLORS.error}>
                {booking.cancellationReason}
              </Text>
            </Card>
          </View>
        )}

        {/* Client Review */}
        {booking.isReviewed && reviewData && (
          <View className="px-4">
            <SectionHeader title="Client Review" />
            <Card padding="md" className="mb-4">
              {/* Client info & date */}
              <View className="mb-3 flex-row items-center">
                <Avatar
                  firstName={booking.client?.firstName || ''}
                  lastName={booking.client?.lastName || ''}
                  source={booking.client?.avatar?.url}
                  size="sm"
                />
                <View className="ml-2 flex-1">
                  <Text variant="label" weight="semibold">
                    {booking.client?.firstName} {booking.client?.lastName}
                  </Text>
                  <Text variant="caption" color={COLORS.neutral[400]}>
                    {new Date(reviewData.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
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
                <Text variant="caption" weight="semibold" color={COLORS.neutral[500]} className="ml-1">
                  {reviewData.rating}/5
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

              {/* Vendor Reply (already replied) */}
              {reviewData.vendorReply ? (
                <View
                  className="mt-2 rounded-lg p-3"
                  style={{ backgroundColor: COLORS.neutral[50] }}
                >
                  <View className="mb-1 flex-row items-center">
                    <Ionicons name="chatbubble-outline" size={14} color={COLORS.primary[500]} />
                    <Text variant="caption" weight="semibold" color={COLORS.primary[600]} className="ml-1">
                      Your Reply
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
              ) : (
                <View className="mt-3">
                  {showReplyInput ? (
                    <View>
                      <TextInput
                        placeholder="Write your reply..."
                        value={replyText}
                        onChangeText={setReplyText}
                        multiline
                      />
                      <View className="mt-2 flex-row justify-end" style={{ gap: 8 }}>
                        <Button
                          title="Cancel"
                          variant="outline"
                          size="sm"
                          onPress={() => {
                            setShowReplyInput(false);
                            setReplyText('');
                          }}
                        />
                        <Button
                          title="Reply"
                          variant="primary"
                          size="sm"
                          loading={replyLoading}
                          disabled={!replyText.trim() || replyLoading}
                          onPress={handleReply}
                          leftIcon="send-outline"
                        />
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setShowReplyInput(true)}
                      className="flex-row items-center"
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary[500]} />
                      <Text variant="label" weight="medium" color={COLORS.primary[500]} className="ml-1">
                        Reply to this review
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {renderActionButtons() && (
        <View className="border-t border-neutral-100 bg-white px-4 pb-6 pt-3">
          {renderActionButtons()}
        </View>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.action === 'reject' || confirmModal.action === 'cancel' ? 'Yes, proceed' : 'Confirm'}
        cancelText="Go Back"
        destructive={confirmModal.destructive}
        icon={
          confirmModal.destructive
            ? 'warning-outline'
            : 'checkmark-circle-outline'
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
        loading={actionLoading}
      />

      <LoadingOverlay visible={actionLoading} message="Processing..." />
    </SafeAreaView>
  );
}
