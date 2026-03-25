import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProviderDashboardStackParamList } from '../../navigation/types';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { clearAuth, switchRole } from '../../store/slices/authSlice';
import { vendorApi } from '../../services/api/vendorApi';
import { Text, Badge, Card, Avatar, Skeleton } from '../../components/ui';
import { SectionHeader, EmptyState } from '../../components/layout';
import type { Booking, Listing } from '../../types';
import { LAYOUT } from '../../config/constants';
import { COLORS } from '../../theme/colors';

type DashboardNav = NativeStackNavigationProp<ProviderDashboardStackParamList>;

interface DashboardStats {
  totalBookings: number;
  pendingInquiries: number;
  activeListings: number;
  totalEarnings: number;
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconBg,
  iconColor,
  value,
  label,
  onPress,
}) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.7 : 1}
    onPress={onPress}
    style={{
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    }}
  >
    <View
      style={{
        height: 40,
        width: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
        marginBottom: 10,
      }}
    >
      <Ionicons name={icon} size={18} color={COLORS.neutral[0]} />
    </View>
    <Text variant="h4" weight="bold" color={COLORS.neutral[0]}>
      {value}
    </Text>
    <Text variant="caption" color="rgba(255,255,255,0.65)" numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `PKR ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `PKR ${(amount / 1000).toFixed(1)}K`;
  }
  return `PKR ${amount.toLocaleString()}`;
};

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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNav>();
  const dispatch = useAppDispatch();
  const { user, vendor, isAuthenticated } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sidebar drawer
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openSidebar = useCallback(() => {
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, backdropAnim]);

  const closeSidebar = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SCREEN_WIDTH, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setMenuVisible(false));
  }, [slideAnim, backdropAnim]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingInquiries: 0,
    activeListings: 0,
    totalEarnings: 0,
  });
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);

      const [bookingsRes, listingsRes] = await Promise.all([
        vendorApi.getMyBookings({ limit: 20 }),
        vendorApi.getMyListings({ limit: 100 }),
      ]);

      const allBookings: Booking[] = bookingsRes.data?.data?.bookings || [];
      const allListings: Listing[] = listingsRes.data?.data?.listings || [];

      const pending = allBookings.filter(
        (b) => b.status === 'inquiry' || b.status === 'pending'
      );
      const activeListings = allListings.filter(
        (l) => l.status === 'active'
      );
      const completedBookings = allBookings.filter(
        (b) => b.status === 'completed'
      );
      const paidBookings = completedBookings.filter(
        (b) => b.paymentStatus === 'succeeded'
      );
      const totalEarnings = paidBookings.reduce(
        (sum, b) => sum + (b.pricingSnapshot?.totalAmount || 0),
        0
      );

      setStats({
        totalBookings: allBookings.length,
        pendingInquiries: pending.length,
        activeListings: activeListings.length,
        totalEarnings,
      });

      setPendingBookings(pending.slice(0, 5));
      setRecentBookings(allBookings.slice(0, 5));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName =
    vendor?.businessName || user?.firstName || 'there';

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.primary[500] }} edges={['top', 'left', 'right']}>
        <View className="flex-1 bg-white">
          <ScrollView className="flex-1 px-4 pt-4">
            <Skeleton variant="text" width="70%" height={28} className="mb-2" />
            <Skeleton variant="text" width="50%" height={18} className="mb-6" />
            <View className="flex-row mb-6">
              <Skeleton variant="rect" width={155} height={120} className="mr-3" />
              <Skeleton variant="rect" width={155} height={120} />
            </View>
            <Skeleton variant="text" width="40%" height={22} className="mb-3" />
            <Skeleton variant="rect" height={80} className="mb-3" />
            <Skeleton variant="rect" height={80} className="mb-3" />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.primary[500] }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary[500]} />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: COLORS.neutral[50] }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.neutral[0]}
            colors={[COLORS.primary[500]]}
          />
        }
      >
        {/* Modern Gradient Header */}
        <LinearGradient
          colors={[COLORS.primary[500], COLORS.primary[600], COLORS.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 28,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        >
          {/* Top row: Greeting + Profile */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text variant="label" color="rgba(255,255,255,0.65)">
                {getGreeting()}
              </Text>
              <Text variant="h3" weight="bold" color={COLORS.neutral[0]} numberOfLines={1}>
                {displayName}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openSidebar}
              style={{
                height: 44,
                width: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.25)',
              }}
            >
              <Ionicons name="menu" size={22} color={COLORS.neutral[0]} />
            </TouchableOpacity>
          </View>

          {/* Stats Grid - 2x2 glassmorphism cards */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <StatCard
              icon="calendar"
              iconBg={COLORS.primary[50]}
              iconColor={COLORS.primary[500]}
              value={stats.totalBookings.toString()}
              label="Bookings"
            />
            <StatCard
              icon="time"
              iconBg={COLORS.warningLight}
              iconColor={COLORS.warning}
              value={stats.pendingInquiries.toString()}
              label="Pending"
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCard
              icon="list"
              iconBg={COLORS.infoLight}
              iconColor={COLORS.info}
              value={stats.activeListings.toString()}
              label="Listings"
            />
            <StatCard
              icon="wallet"
              iconBg={COLORS.successLight}
              iconColor={COLORS.success}
              value={formatCurrency(stats.totalEarnings)}
              label="Earnings"
              onPress={() => navigation.navigate('EarningsScreen')}
            />
          </View>
        </LinearGradient>

        {error && (
          <View style={{ marginHorizontal: 16, marginTop: 12, borderRadius: 14, backgroundColor: COLORS.errorLight, paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text variant="label" color={COLORS.error}>
              {error}
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                navigation
                  .getParent()
                  ?.navigate('ListingsTab', { screen: 'AddListingScreen' })
              }
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.neutral[0],
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: COLORS.neutral[100],
              }}
            >
              <View
                style={{
                  height: 38,
                  width: 38,
                  borderRadius: 12,
                  backgroundColor: COLORS.primary[50],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Ionicons name="add" size={20} color={COLORS.primary[500]} />
              </View>
              <Text variant="label" weight="semibold" color={COLORS.neutral[600]}>
                Add Listing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                navigation
                  .getParent()
                  ?.navigate('ProviderBookingsTab', { screen: 'ProviderBookingsScreen' })
              }
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.neutral[0],
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: COLORS.neutral[100],
              }}
            >
              <View
                style={{
                  height: 38,
                  width: 38,
                  borderRadius: 12,
                  backgroundColor: COLORS.secondary[50],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Ionicons name="calendar" size={20} color={COLORS.secondary[500]} />
              </View>
              <Text variant="label" weight="semibold" color={COLORS.neutral[600]}>
                Bookings
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Actions */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <SectionHeader
            title="Pending Actions"
            subtitle={`${pendingBookings.length} booking${pendingBookings.length !== 1 ? 's' : ''} need your response`}
          />

          {pendingBookings.length === 0 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.successLight,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: 8,
              }}
            >
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text variant="label" weight="medium" color={COLORS.success} style={{ marginLeft: 10 }}>
                All caught up! No pending actions.
              </Text>
            </View>
          ) : (
            pendingBookings.map((booking) => (
              <Card
                key={booking._id}
                padding="md"
                className="mb-3"
                onPress={() =>
                  navigation
                    .getParent()
                    ?.navigate('ProviderBookingsTab', {
                      screen: 'ProviderBookingDetailScreen',
                      params: { bookingId: booking._id },
                    })
                }
              >
                <View className="flex-row items-center">
                  <Avatar
                    source={booking.client?.avatar?.url}
                    firstName={booking.client?.firstName || ''}
                    lastName={booking.client?.lastName || ''}
                    size="md"
                  />
                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text variant="label" weight="semibold" color={COLORS.neutral[600]} className="flex-1">
                        {booking.client?.firstName} {booking.client?.lastName}
                      </Text>
                      <Badge
                        text={booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        variant={getStatusBadgeVariant(booking.status)}
                      />
                    </View>
                    <Text variant="caption" color={COLORS.neutral[400]} className="mt-0.5">
                      {booking.listing?.title}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <Text variant="caption" color={COLORS.neutral[400]}>
                        {formatDate(booking.eventDate)} - PKR{' '}
                        {booking.pricingSnapshot?.totalAmount?.toLocaleString()}
                      </Text>
                      {booking.paymentStatus === 'refunded' ? (
                        <Badge text="Refunded" variant="warning" className="ml-2" />
                      ) : booking.paymentStatus === 'succeeded' ? (
                        <Badge text="Paid" variant="success" className="ml-2" />
                      ) : null}
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Recent Bookings */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: LAYOUT.SCREEN_BOTTOM_PADDING }}>
          <SectionHeader
            title="Recent Bookings"
            actionText="View All"
            onActionPress={() =>
              navigation
                .getParent()
                ?.navigate('ProviderBookingsTab', {
                  screen: 'ProviderBookingsScreen',
                })
            }
          />

          {recentBookings.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No Bookings Yet"
              description="Your bookings will appear here once clients start booking your services."
            />
          ) : (
            recentBookings.map((booking) => (
              <Card
                key={booking._id}
                padding="sm"
                className="mb-2"
                onPress={() =>
                  navigation
                    .getParent()
                    ?.navigate('ProviderBookingsTab', {
                      screen: 'ProviderBookingDetailScreen',
                      params: { bookingId: booking._id },
                    })
                }
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center">
                    <View
                      style={{
                        marginRight: 10,
                        height: 38,
                        width: 38,
                        borderRadius: 10,
                        backgroundColor: COLORS.neutral[50],
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="receipt-outline" size={18} color={COLORS.neutral[400]} />
                    </View>
                    <View className="flex-1">
                      <Text variant="label" weight="medium" color={COLORS.neutral[600]}>
                        {booking.bookingNumber || `#${booking._id.slice(-6)}`}
                      </Text>
                      <Text variant="caption" color={COLORS.neutral[400]}>
                        {booking.listing?.title} - {formatDate(booking.eventDate)}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end ml-2">
                    <Text variant="label" weight="semibold" color={COLORS.neutral[600]}>
                      PKR {booking.pricingSnapshot?.totalAmount?.toLocaleString()}
                    </Text>
                    <View className="flex-row items-center mt-1 gap-1">
                      {booking.paymentStatus === 'succeeded' && (
                        <Badge text="Paid" variant="success" />
                      )}
                      {booking.paymentStatus === 'refunded' && (
                        <Badge text="Refunded" variant="warning" />
                      )}
                      <Badge
                        text={booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        variant={getStatusBadgeVariant(booking.status)}
                      />
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Sidebar Drawer */}
      <Modal visible={menuVisible} transparent animationType="none" onRequestClose={closeSidebar}>
        <View style={{ flex: 1 }}>
          <Animated.View
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', opacity: backdropAnim,
            }}
          >
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeSidebar} />
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute', top: 0, bottom: 0, right: 0,
              width: SCREEN_WIDTH * 0.82, backgroundColor: '#FFFFFF',
              transform: [{ translateX: slideAnim }],
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: -6, height: 0 }, shadowOpacity: 0.18, shadowRadius: 24 },
                android: { elevation: 24 },
                default: {},
              }),
            }}
          >
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
              {/* Green Header */}
              <View
                style={{
                  backgroundColor: COLORS.primary[500],
                  paddingHorizontal: 20,
                  paddingTop: Platform.OS === 'ios' ? 8 : 16,
                  paddingBottom: 24,
                  borderBottomLeftRadius: 24,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <TouchableOpacity
                    onPress={closeSidebar}
                    activeOpacity={0.7}
                    style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* User Info */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 54, height: 54, borderRadius: 27,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <Text variant="h4" weight="bold" color="#FFFFFF">
                      {(user?.firstName?.[0] || '').toUpperCase()}
                      {(user?.lastName?.[0] || '').toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text variant="body" weight="bold" color="#FFFFFF" numberOfLines={1}>
                      {vendor?.businessName || user?.firstName || ''}
                    </Text>
                    <Text variant="caption" color={COLORS.primary[200]} numberOfLines={1} style={{ marginTop: 3 }}>
                      {user?.email || ''}
                    </Text>
                  </View>
                </View>

                {/* Client / Provider Toggle */}
                <View
                  style={{
                    flexDirection: 'row', marginTop: 20, borderRadius: 12,
                    backgroundColor: 'rgba(0,0,0,0.15)', padding: 3,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flex: 1, flexDirection: 'row', paddingVertical: 9, borderRadius: 10,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                    onPress={() => { closeSidebar(); dispatch(switchRole()); }}
                  >
                    <Ionicons name="person-outline" size={14} color="rgba(255,255,255,0.7)" style={{ marginRight: 6 }} />
                    <Text variant="label" weight="semibold" color="rgba(255,255,255,0.7)">Client</Text>
                  </TouchableOpacity>
                  <View
                    style={{
                      flex: 1, flexDirection: 'row', paddingVertical: 9, borderRadius: 10,
                      backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="storefront" size={14} color={COLORS.primary[500]} style={{ marginRight: 6 }} />
                    <Text variant="label" weight="bold" color={COLORS.primary[500]}>Provider</Text>
                  </View>
                </View>
              </View>

              {/* Menu Items */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 10 }}
                showsVerticalScrollIndicator={false}
              >
                <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
                  <Text variant="caption" weight="semibold" color={COLORS.neutral[300]} style={{ marginBottom: 10, letterSpacing: 0.8 }}>
                    MANAGE
                  </Text>
                </View>
                {[
                  { icon: 'grid-outline' as const, label: 'Dashboard', desc: 'Overview & stats', action: () => { closeSidebar(); } },
                  { icon: 'list-outline' as const, label: 'My Listings', desc: 'Manage your services', action: () => { closeSidebar(); navigation.getParent()?.navigate('ListingsTab'); } },
                  { icon: 'calendar-outline' as const, label: 'Bookings', desc: 'Client reservations', action: () => { closeSidebar(); navigation.getParent()?.navigate('ProviderBookingsTab'); } },
                  { icon: 'wallet-outline' as const, label: 'Earnings', desc: 'Revenue & payouts', action: () => { closeSidebar(); navigation.navigate('EarningsScreen'); } },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    onPress={item.action}
                    activeOpacity={0.6}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 20 }}
                  >
                    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.neutral[50], alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                      <Ionicons name={item.icon} size={20} color={COLORS.neutral[500]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="body" weight="semibold" color={COLORS.neutral[600]}>{item.label}</Text>
                      <Text variant="caption" color={COLORS.neutral[300]} style={{ marginTop: 1 }}>{item.desc}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.neutral[200]} />
                  </TouchableOpacity>
                ))}

                <View style={{ height: 1, backgroundColor: COLORS.neutral[50], marginHorizontal: 20, marginVertical: 14 }} />

                <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
                  <Text variant="caption" weight="semibold" color={COLORS.neutral[300]} style={{ marginBottom: 10, letterSpacing: 0.8 }}>
                    ACCOUNT
                  </Text>
                </View>
                {[
                  { icon: 'person-outline' as const, label: 'Business Profile', action: () => { closeSidebar(); navigation.getParent()?.navigate('ProviderProfileTab'); } },
                  { icon: 'settings-outline' as const, label: 'Settings', action: () => { closeSidebar(); navigation.getParent()?.navigate('ProviderProfileTab', { screen: 'ProviderSettingsScreen' }); } },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    onPress={item.action}
                    activeOpacity={0.6}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 20 }}
                  >
                    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.neutral[50], alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                      <Ionicons name={item.icon} size={20} color={COLORS.neutral[500]} />
                    </View>
                    <Text variant="body" weight="semibold" color={COLORS.neutral[600]} style={{ flex: 1 }}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.neutral[200]} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Bottom — Switch to Client + Logout */}
              <View style={{ paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 8 : 16 }}>
                <TouchableOpacity
                  onPress={() => { closeSidebar(); dispatch(switchRole()); }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    paddingVertical: 13, borderRadius: 14,
                    backgroundColor: COLORS.primary[50], marginBottom: 10,
                  }}
                >
                  <Ionicons name="swap-horizontal-outline" size={18} color={COLORS.primary[500]} />
                  <Text variant="label" weight="bold" color={COLORS.primary[500]} style={{ marginLeft: 8 }}>
                    Switch to Client
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { closeSidebar(); dispatch(clearAuth()); }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    paddingVertical: 13, borderRadius: 14,
                    backgroundColor: COLORS.errorLight, marginBottom: 12,
                  }}
                >
                  <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
                  <Text variant="label" weight="bold" color={COLORS.error} style={{ marginLeft: 8 }}>Log Out</Text>
                </TouchableOpacity>
                <Text variant="caption" color={COLORS.neutral[200]} style={{ textAlign: 'center' }}>
                  Events Platform v1.0
                </Text>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
