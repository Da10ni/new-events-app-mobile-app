import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProviderBookingsStackParamList } from '../../navigation/types';
import { vendorApi } from '../../services/api/vendorApi';
import { bookingApi } from '../../services/api/bookingApi';
import { Text, Badge, Card, Avatar, Skeleton } from '../../components/ui';
import { EmptyState } from '../../components/layout';
import { ConfirmationModal, useSweetAlert } from '../../components/feedback';
import type { Booking } from '../../types';
import { LAYOUT } from '../../config/constants';
import { COLORS } from '../../theme/colors';

type BookingsNav = NativeStackNavigationProp<ProviderBookingsStackParamList>;
type TabFilter = 'inquiries' | 'upcoming' | 'past' | 'all';

const TAB_OPTIONS: { key: TabFilter; label: string }[] = [
  { key: 'inquiries', label: 'New Inquiries' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'all', label: 'All' },
];

const getStatusBadgeVariant = (
  status: string
): 'default' | 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'pending':
    case 'inquiry':
      return 'warning';
    case 'cancelled':
    case 'rejected':
      return 'error';
    case 'completed':
      return 'info';
    default:
      return 'default';
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PK', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function ProviderBookingsScreen() {
  const navigation = useNavigation<BookingsNav>();
  const { showAlert } = useSweetAlert();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('inquiries');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    bookingId: string;
    action: 'accept' | 'reject';
    bookingNumber: string;
  } | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setError(null);
      const res = await vendorApi.getMyBookings({ limit: 100 });
      setBookings(res.data?.data?.bookings || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchBookings();
    });
    return unsubscribe;
  }, [navigation, fetchBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = bookings.filter((b) => {
    const now = new Date();
    const eventDate = new Date(b.eventDate);
    switch (activeTab) {
      case 'inquiries':
        return b.status === 'inquiry' || b.status === 'pending';
      case 'upcoming':
        return (
          (b.status === 'confirmed' || b.status === 'pending') &&
          eventDate >= now
        );
      case 'past':
        return (
          b.status === 'completed' ||
          b.status === 'cancelled' ||
          b.status === 'rejected' ||
          eventDate < now
        );
      case 'all':
      default:
        return true;
    }
  });

  const handleQuickAction = async (bookingId: string, action: 'accept' | 'reject') => {
    try {
      setActionLoading(bookingId);
      const newStatus = action === 'accept' ? 'confirmed' : 'rejected';
      await bookingApi.updateStatus(bookingId, {
        status: newStatus,
        vendorResponse: action === 'accept' ? 'Booking accepted' : 'Booking declined',
      });
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: newStatus } : b
        )
      );
      setConfirmAction(null);
    } catch (err: any) {
      showAlert({ type: 'error', title: 'Error', message: err?.response?.data?.message || `Failed to ${action} booking` });
    } finally {
      setActionLoading(null);
    }
  };

  const getEmptyState = () => {
    switch (activeTab) {
      case 'inquiries':
        return {
          icon: 'mail-outline' as keyof typeof Ionicons.glyphMap,
          title: 'No New Inquiries',
          description: 'New booking inquiries from clients will appear here.',
        };
      case 'upcoming':
        return {
          icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
          title: 'No Upcoming Bookings',
          description: 'Your confirmed upcoming bookings will appear here.',
        };
      case 'past':
        return {
          icon: 'time-outline' as keyof typeof Ionicons.glyphMap,
          title: 'No Past Bookings',
          description: 'Your completed and past bookings will appear here.',
        };
      default:
        return {
          icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
          title: 'No Bookings Yet',
          description: 'Bookings from clients will appear here.',
        };
    }
  };

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const isInquiry = item.status === 'inquiry' || item.status === 'pending';
    const isProcessing = actionLoading === item._id;

    return (
      <Card
        padding="md"
        className="mx-4 mb-3"
        onPress={() =>
          navigation.navigate('ProviderBookingDetailScreen', {
            bookingId: item._id,
          })
        }
      >
        {/* Client info */}
        <View className="flex-row items-center mb-3">
          <Avatar
            source={item.client?.avatar?.url}
            firstName={item.client?.firstName || ''}
            lastName={item.client?.lastName || ''}
            size="md"
          />
          <View className="ml-3 flex-1">
            <Text variant="label" weight="semibold" className="text-neutral-600">
              {item.client?.firstName} {item.client?.lastName}
            </Text>
            <Text variant="caption" color={COLORS.neutral[400]} numberOfLines={1}>
              {item.listing?.title}
            </Text>
          </View>
          <Badge
            text={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            variant={getStatusBadgeVariant(item.status)}
          />
        </View>

        {/* Event details */}
        <View className="flex-row items-center justify-between mb-3 bg-neutral-50 rounded-lg px-3 py-2.5">
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={16} color={COLORS.neutral[400]} />
            <Text variant="caption" weight="medium" color={COLORS.neutral[500]} className="ml-1.5">
              {formatDate(item.eventDate)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="cash-outline" size={16} color={COLORS.neutral[400]} />
            <Text variant="label" weight="bold" color={COLORS.neutral[600]} className="ml-1.5">
              PKR {item.pricingSnapshot?.totalAmount?.toLocaleString()}
            </Text>
            {item.paymentStatus === 'succeeded' && (
              <View className="ml-2 rounded-full bg-secondary-50 px-2 py-0.5">
                <Text variant="caption" weight="semibold" color={COLORS.success}>
                  Paid
                </Text>
              </View>
            )}
            {item.paymentStatus === 'refunded' && (
              <View className="ml-2 rounded-full bg-blue-50 px-2 py-0.5">
                <Text variant="caption" weight="semibold" color={COLORS.info}>
                  Refunded
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick actions for inquiries */}
        {isInquiry && (
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center rounded-lg border-2 border-error py-2.5"
              onPress={() =>
                setConfirmAction({
                  bookingId: item._id,
                  action: 'reject',
                  bookingNumber: item.bookingNumber || item._id.slice(-6),
                })
              }
              disabled={isProcessing}
            >
              <Ionicons name="close" size={18} color={COLORS.error} />
              <Text variant="label" weight="semibold" color={COLORS.error} className="ml-1">
                Decline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center rounded-lg bg-success py-2.5"
              onPress={() =>
                setConfirmAction({
                  bookingId: item._id,
                  action: 'accept',
                  bookingNumber: item.bookingNumber || item._id.slice(-6),
                })
              }
              disabled={isProcessing}
            >
              <Ionicons name="checkmark" size={18} color={COLORS.neutral[0]} />
              <Text variant="label" weight="semibold" color={COLORS.neutral[0]} className="ml-1">
                Accept
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
        <View className="px-4 pt-4">
          <View className="flex-row mb-4">
            {TAB_OPTIONS.map((tab) => (
              <Skeleton key={tab.key} variant="rect" width={80} height={36} className="mr-2" style={{ borderRadius: 18 }} />
            ))}
          </View>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rect" height={150} className="mb-3" />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
      {error && (
        <View className="mx-4 mt-2 rounded-xl bg-error-light px-4 py-3">
          <Text variant="label" color={COLORS.error}>{error}</Text>
        </View>
      )}

      {/* Tab Selector */}
      <View className="px-4 pt-2 pb-3">
        <ScrollViewTabs
          tabs={TAB_OPTIONS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: LAYOUT.SCREEN_BOTTOM_PADDING, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary[500]}
            colors={[COLORS.primary[500]]}
          />
        }
        ListEmptyComponent={() => {
          const empty = getEmptyState();
          return (
            <EmptyState
              icon={empty.icon}
              title={empty.title}
              description={empty.description}
            />
          );
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={!!confirmAction}
        title={confirmAction?.action === 'accept' ? 'Accept Booking' : 'Decline Booking'}
        message={
          confirmAction?.action === 'accept'
            ? `Are you sure you want to accept booking #${confirmAction?.bookingNumber}?`
            : `Are you sure you want to decline booking #${confirmAction?.bookingNumber}? This cannot be undone.`
        }
        confirmText={confirmAction?.action === 'accept' ? 'Accept' : 'Decline'}
        cancelText="Cancel"
        destructive={confirmAction?.action === 'reject'}
        icon={confirmAction?.action === 'accept' ? 'checkmark-circle' : 'close-circle'}
        onConfirm={() => {
          if (confirmAction) {
            handleQuickAction(confirmAction.bookingId, confirmAction.action);
          }
        }}
        onCancel={() => setConfirmAction(null)}
        loading={!!actionLoading}
      />
    </SafeAreaView>
  );
}

// Horizontal scrollable tabs sub-component
function ScrollViewTabs({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { key: TabFilter; label: string }[];
  activeTab: TabFilter;
  onTabChange: (tab: TabFilter) => void;
}) {
  return (
    <View className="flex-row">
      <View className="flex-row rounded-xl bg-neutral-50 p-1 flex-1">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            className={`flex-1 items-center rounded-lg py-2.5 ${
              activeTab === tab.key ? 'bg-white' : ''
            }`}
            style={
              activeTab === tab.key
                ? {
                    shadowColor: COLORS.neutral[700],
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 2,
                  }
                : undefined
            }
          >
            <Text
              variant="caption"
              weight={activeTab === tab.key ? 'semibold' : 'medium'}
              color={activeTab === tab.key ? COLORS.neutral[600] : COLORS.neutral[400]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
