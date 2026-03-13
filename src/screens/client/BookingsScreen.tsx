import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BookingsStackParamList } from '../../navigation/types';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setBookings, setLoading } from '../../store/slices/bookingSlice';
import { bookingApi } from '../../services/api/bookingApi';
import { Text, Badge } from '../../components/ui';
import { EmptyState } from '../../components/layout';
import type { Booking } from '../../types';
import { LAYOUT } from '../../config/constants';
import { COLORS } from '../../theme/colors';

type NavigationProp = NativeStackNavigationProp<BookingsStackParamList>;
type TabType = 'upcoming' | 'past' | 'all';

const STATUS_BADGE_MAP: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; text: string }> = {
  inquiry: { variant: 'info', text: 'Inquiry' },
  pending: { variant: 'warning', text: 'Pending' },
  confirmed: { variant: 'success', text: 'Confirmed' },
  rejected: { variant: 'error', text: 'Rejected' },
  cancelled: { variant: 'error', text: 'Cancelled' },
  completed: { variant: 'default', text: 'Completed' },
};

const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
  default: {},
});

export default function BookingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { bookings, loading } = useAppSelector((s) => s.booking);

  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const res = await bookingApi.getMyBookings({ limit: 50 });
      dispatch(setBookings(res.data.data.bookings));
    } catch {
      // silent
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // Refetch every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const filteredBookings = bookings.filter((booking) => {
    const eventDate = new Date(booking.eventDate);
    const now = new Date();
    switch (activeTab) {
      case 'upcoming':
        return eventDate >= now && !['cancelled', 'rejected', 'completed'].includes(booking.status);
      case 'past':
        return eventDate < now || ['completed', 'cancelled', 'rejected'].includes(booking.status);
      case 'all':
      default:
        return true;
    }
  });

  const renderTab = (tab: TabType, label: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        key={tab}
        onPress={() => setActiveTab(tab)}
        className="mr-2 items-center rounded-full px-5 py-2.5"
        style={{
          backgroundColor: isActive ? COLORS.primary[500] : COLORS.neutral[50],
        }}
      >
        <Text
          variant="label"
          weight={isActive ? 'bold' : 'medium'}
          color={isActive ? '#FFFFFF' : COLORS.neutral[400]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBookingItem = useCallback(
    ({ item }: { item: Booking }) => {
      const statusInfo = STATUS_BADGE_MAP[item.status] || { variant: 'default' as const, text: item.status };
      const primaryImage = item.listing.images?.[0];

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('BookingDetailScreen', { bookingId: item._id })}
          className="mx-4 mb-4 overflow-hidden rounded-2xl bg-white"
          style={CARD_SHADOW}
        >
          <View className="flex-row">
            {primaryImage ? (
              <Image
                source={{ uri: primaryImage.url }}
                style={{ width: 110, height: 130, borderRadius: 16 }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="items-center justify-center"
                style={{ width: 110, height: 130, borderRadius: 16, backgroundColor: COLORS.neutral[50] }}
              >
                <Ionicons name="image-outline" size={28} color={COLORS.neutral[200]} />
              </View>
            )}

            <View className="flex-1 justify-between py-3 pl-3 pr-3">
              <View>
                <Text variant="label" weight="bold" numberOfLines={1} color={COLORS.neutral[600]}>
                  {item.listing.title}
                </Text>
                <View className="mb-1 mt-1 flex-row items-center">
                  <Ionicons name="calendar" size={12} color={COLORS.neutral[300]} />
                  <Text variant="caption" color={COLORS.neutral[400]} className="ml-1">
                    {new Date(item.eventDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="storefront" size={12} color={COLORS.neutral[300]} />
                  <Text variant="caption" color={COLORS.neutral[400]} className="ml-1" numberOfLines={1}>
                    {item.vendor.businessName}
                  </Text>
                </View>
              </View>

              <View className="mt-2 flex-row items-center justify-between">
                <Badge text={statusInfo.text} variant={statusInfo.variant} dot />
                <Text variant="label" weight="bold" color={COLORS.primary[500]}>
                  {item.pricingSnapshot.currency || 'PKR'}{' '}
                  {item.pricingSnapshot.totalAmount.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation]
  );

  const getEmptyStateForTab = (): { icon: keyof typeof Ionicons.glyphMap; title: string; description: string } => {
    switch (activeTab) {
      case 'upcoming':
        return { icon: 'calendar-outline', title: 'No upcoming bookings', description: 'Your upcoming event bookings will appear here.' };
      case 'past':
        return { icon: 'time-outline', title: 'No past bookings', description: 'Your completed bookings will appear here.' };
      default:
        return { icon: 'calendar-outline', title: 'No bookings yet', description: 'Start exploring and book your first event service.' };
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Pill Tab Bar */}
      <View className="flex-row px-4 pb-3 pt-3">
        {renderTab('upcoming', 'Upcoming')}
        {renderTab('past', 'Past')}
        {renderTab('all', 'All')}
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary[500]} />
        </View>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          {...getEmptyStateForTab()}
          actionTitle="Explore Services"
          onAction={() => {
            navigation.getParent()?.navigate('ExploreTab', { screen: 'ExploreScreen' });
          }}
        />
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: LAYOUT.SCREEN_BOTTOM_PADDING }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary[500]} />
          }
        />
      )}
    </View>
  );
}
