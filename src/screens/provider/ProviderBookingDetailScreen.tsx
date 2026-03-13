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
import { Text, Badge, Card, Avatar, Button, TextInput, Divider, Skeleton } from '../../components/ui';
import { SectionHeader } from '../../components/layout';
import { ConfirmationModal, LoadingOverlay, useSweetAlert } from '../../components/feedback';
import type { Booking } from '../../types';
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

  const handleStatusUpdate = async (newStatus: string) => {
    if (!booking) return;
    try {
      setActionLoading(true);
      await bookingApi.updateStatus(booking._id, {
        status: newStatus,
        vendorResponse: notes.trim() || undefined,
      });
      setBooking((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setConfirmModal((prev) => ({ ...prev, visible: false }));
      showAlert({ type: 'success', title: 'Success', message: `Booking ${newStatus} successfully` });
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
                  'Are you sure you want to reject this booking? The client will be notified.',
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
                  'Are you sure you want to reject this booking?',
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
                  'Are you sure you want to cancel this confirmed booking? The client will be notified.',
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
