import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { vendorApi } from '../../services/api/vendorApi';
import { Text, Card, Skeleton, Divider } from '../../components/ui';
import { SectionHeader, EmptyState } from '../../components/layout';
import type { Booking, Listing } from '../../types';
import { COLORS } from '../../theme/colors';

type PeriodFilter = 'week' | 'month' | 'year' | 'all';

interface EarningsByListing {
  listingId: string;
  listingTitle: string;
  amount: number;
}

interface MonthlyEarning {
  month: string;
  amount: number;
}

const formatCurrency = (amount: number): string => {
  return `PKR ${amount.toLocaleString()}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const PERIOD_OPTIONS: { key: PeriodFilter; label: string }[] = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

const isInPeriod = (dateString: string, period: PeriodFilter): boolean => {
  const date = new Date(dateString);
  const now = new Date();

  switch (period) {
    case 'week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }
    case 'month': {
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }
    case 'year': {
      return date.getFullYear() === now.getFullYear();
    }
    case 'all':
    default:
      return true;
  }
};

export default function EarningsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchEarningsData = useCallback(async () => {
    try {
      setError(null);
      const res = await vendorApi.getMyBookings({ limit: 500 });
      const bookings: Booking[] = res.data?.data?.bookings || [];
      setAllBookings(bookings);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load earnings data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEarningsData();
  }, [fetchEarningsData]);

  const completedBookings = allBookings.filter(
    (b) => b.status === 'completed' && b.paymentStatus === 'succeeded'
  );

  const filteredBookings = completedBookings.filter((b) =>
    isInPeriod(b.eventDate, period)
  );

  const totalEarnings = filteredBookings.reduce(
    (sum, b) => sum + (b.pricingSnapshot?.totalAmount || 0),
    0
  );

  // This month vs last month comparison
  const now = new Date();
  const thisMonthBookings = completedBookings.filter((b) => {
    const d = new Date(b.eventDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonthBookings = completedBookings.filter((b) => {
    const d = new Date(b.eventDate);
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });

  const thisMonthTotal = thisMonthBookings.reduce(
    (sum, b) => sum + (b.pricingSnapshot?.totalAmount || 0),
    0
  );
  const lastMonthTotal = lastMonthBookings.reduce(
    (sum, b) => sum + (b.pricingSnapshot?.totalAmount || 0),
    0
  );

  const monthChange =
    lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : thisMonthTotal > 0
      ? 100
      : 0;

  // Earnings by listing
  const earningsByListing: EarningsByListing[] = [];
  const listingMap = new Map<string, { title: string; amount: number }>();
  filteredBookings.forEach((b) => {
    const id = b.listing?._id || 'unknown';
    const existing = listingMap.get(id);
    if (existing) {
      existing.amount += b.pricingSnapshot?.totalAmount || 0;
    } else {
      listingMap.set(id, {
        title: b.listing?.title || 'Unknown Listing',
        amount: b.pricingSnapshot?.totalAmount || 0,
      });
    }
  });
  listingMap.forEach((val, key) => {
    earningsByListing.push({ listingId: key, listingTitle: val.title, amount: val.amount });
  });
  earningsByListing.sort((a, b) => b.amount - a.amount);

  // Monthly earnings (last 6 months)
  const monthlyEarnings: MonthlyEarning[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const monthBookings = completedBookings.filter((b) => {
      const bd = new Date(b.eventDate);
      return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
    });
    const amount = monthBookings.reduce(
      (sum, b) => sum + (b.pricingSnapshot?.totalAmount || 0),
      0
    );
    monthlyEarnings.push({ month: monthName, amount });
  }
  const maxMonthlyAmount = Math.max(...monthlyEarnings.map((m) => m.amount), 1);

  // Transaction history (filtered) — show bookings with any payment activity
  const transactionBookings = allBookings
    .filter((b) => isInPeriod(b.eventDate, period))
    .filter((b) => b.paymentStatus === 'succeeded' || b.paymentStatus === 'refunded' || b.status === 'completed' || b.status === 'confirmed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
        <ScrollView className="flex-1 px-4 pt-4">
          <Skeleton variant="rect" height={140} className="mb-4" />
          <Skeleton variant="rect" height={80} className="mb-4" />
          <Skeleton variant="text" width="40%" height={22} className="mb-3" />
          <Skeleton variant="rect" height={160} className="mb-4" />
          <Skeleton variant="text" width="40%" height={22} className="mb-3" />
          <Skeleton variant="rect" height={200} className="mb-4" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary[500]}
            colors={[COLORS.primary[500]]}
          />
        }
      >
        {error && (
          <View className="mx-4 mt-4 rounded-xl bg-error-light px-4 py-3">
            <Text variant="label" color={COLORS.error}>
              {error}
            </Text>
          </View>
        )}

        {/* Total Earnings */}
        <View className="mx-4 mt-4 rounded-2xl bg-primary-500 px-6 py-6">
          <Text variant="label" weight="medium" color="rgba(255,255,255,0.8)">
            Total Earnings
          </Text>
          <Text variant="h1" weight="bold" color={COLORS.neutral[0]} className="mt-1">
            {formatCurrency(totalEarnings)}
          </Text>
          <View className="mt-3 flex-row items-center">
            <View className="mr-4">
              <Text variant="caption" color="rgba(255,255,255,0.7)">
                This Month
              </Text>
              <Text variant="body" weight="semibold" color={COLORS.neutral[0]}>
                {formatCurrency(thisMonthTotal)}
              </Text>
            </View>
            <View className="h-8 w-px bg-white/30" />
            <View className="ml-4">
              <Text variant="caption" color="rgba(255,255,255,0.7)">
                Last Month
              </Text>
              <Text variant="body" weight="semibold" color={COLORS.neutral[0]}>
                {formatCurrency(lastMonthTotal)}
              </Text>
            </View>
            {monthChange !== 0 && (
              <View className="ml-auto flex-row items-center rounded-full bg-white/20 px-2 py-1">
                <Ionicons
                  name={monthChange > 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={COLORS.neutral[0]}
                />
                <Text variant="caption" weight="semibold" color={COLORS.neutral[0]} className="ml-1">
                  {monthChange > 0 ? '+' : ''}
                  {monthChange}%
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Period Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setPeriod(opt.key)}
              className={`mr-2 rounded-full border px-4 py-2 ${
                period === opt.key
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <Text
                variant="label"
                weight={period === opt.key ? 'semibold' : 'medium'}
                color={period === opt.key ? COLORS.neutral[0] : COLORS.neutral[500]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Earnings by Listing */}
        <View className="px-4">
          <SectionHeader title="Earnings by Listing" />
          {earningsByListing.length === 0 ? (
            <Card padding="lg" className="mb-4">
              <View className="items-center py-2">
                <Text variant="label" color={COLORS.neutral[400]}>
                  No earnings data for this period
                </Text>
              </View>
            </Card>
          ) : (
            <Card padding="md" className="mb-4">
              {earningsByListing.map((item, index) => (
                <View key={item.listingId}>
                  <View className="flex-row items-center justify-between py-3">
                    <View className="flex-1 mr-3">
                      <Text
                        variant="label"
                        weight="medium"
                        className="text-neutral-600"
                        numberOfLines={1}
                      >
                        {item.listingTitle}
                      </Text>
                      <View className="mt-1.5 h-2 rounded-full bg-neutral-50">
                        <View
                          className="h-2 rounded-full bg-primary-500"
                          style={{
                            width: `${Math.max(
                              (item.amount / totalEarnings) * 100,
                              5
                            )}%`,
                          }}
                        />
                      </View>
                    </View>
                    <Text variant="label" weight="semibold" className="text-neutral-600">
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                  {index < earningsByListing.length - 1 && (
                    <Divider />
                  )}
                </View>
              ))}
            </Card>
          )}
        </View>

        {/* Monthly Bar Chart */}
        <View className="px-4 mt-2">
          <SectionHeader title="Monthly Trend" />
          <Card padding="md" className="mb-4">
            <View className="flex-row items-end justify-between" style={{ height: 160 }}>
              {monthlyEarnings.map((item) => {
                const barHeight = Math.max(
                  (item.amount / maxMonthlyAmount) * 130,
                  4
                );
                return (
                  <View key={item.month} className="flex-1 items-center mx-1">
                    <Text variant="caption" weight="semibold" className="text-neutral-600 mb-1">
                      {item.amount > 0
                        ? item.amount >= 1000
                          ? `${Math.round(item.amount / 1000)}K`
                          : item.amount.toString()
                        : '0'}
                    </Text>
                    <View
                      className="w-full rounded-t-lg bg-primary-500"
                      style={{
                        height: barHeight,
                        maxWidth: 40,
                        opacity: item.amount > 0 ? 1 : 0.3,
                      }}
                    />
                    <Text variant="caption" color={COLORS.neutral[400]} className="mt-2">
                      {item.month}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Transaction History */}
        <View className="px-4 mt-2 pb-8">
          <SectionHeader title="Transaction History" />
          {transactionBookings.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No Transactions"
              description="Completed bookings will appear here as transactions."
            />
          ) : (
            transactionBookings.map((booking) => {
              const payStatus = booking.paymentStatus || 'pending';
              const iconName =
                payStatus === 'succeeded' ? 'checkmark-circle' :
                payStatus === 'refunded' ? 'arrow-undo-circle' :
                payStatus === 'failed' ? 'close-circle' : 'time';
              const iconColor =
                payStatus === 'succeeded' ? COLORS.success :
                payStatus === 'refunded' ? COLORS.info :
                payStatus === 'failed' ? COLORS.error : COLORS.warning;
              const iconBg =
                payStatus === 'succeeded' ? 'bg-secondary-50' :
                payStatus === 'refunded' ? 'bg-blue-50' :
                payStatus === 'failed' ? 'bg-error-light' : 'bg-warning-light';
              const statusLabel =
                payStatus === 'succeeded' ? 'Paid' :
                payStatus === 'refunded' ? 'Refunded' :
                payStatus === 'failed' ? 'Failed' :
                booking.status === 'completed' ? 'Completed' : 'Pending';

              return (
                <Card key={booking._id} padding="sm" className="mb-2">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${iconBg}`}
                      >
                        <Ionicons name={iconName} size={20} color={iconColor} />
                      </View>
                      <View className="flex-1">
                        <Text variant="label" weight="medium" className="text-neutral-600">
                          {booking.bookingNumber || `#${booking._id.slice(-6)}`}
                        </Text>
                        <Text variant="caption" color={COLORS.neutral[400]}>
                          {formatDate(booking.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text variant="label" weight="semibold" className="text-neutral-600">
                        {payStatus === 'refunded' ? '-' : ''}{formatCurrency(booking.pricingSnapshot?.totalAmount || 0)}
                      </Text>
                      <Text variant="caption" weight="medium" color={iconColor}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
