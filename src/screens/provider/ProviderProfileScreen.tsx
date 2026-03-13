import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProviderProfileStackParamList } from '../../navigation/types';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { switchRole, clearAuth } from '../../store/slices/authSlice';
import { vendorApi } from '../../services/api/vendorApi';
import { Text, Avatar, Badge, Card, StarRating, Divider, Skeleton } from '../../components/ui';
import { SectionHeader } from '../../components/layout';
import { ConfirmationModal, useSweetAlert } from '../../components/feedback';
import type { Vendor } from '../../types';
import { LAYOUT } from '../../config/constants';
import { COLORS } from '../../theme/colors';

type ProfileNav = NativeStackNavigationProp<ProviderProfileStackParamList>;

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
  showChevron?: boolean;
}

export default function ProviderProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const dispatch = useAppDispatch();
  const { showAlert } = useSweetAlert();
  const { user, vendor } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendorProfile, setVendorProfile] = useState<Vendor | null>(vendor);
  const [isAvailable, setIsAvailable] = useState(vendor?.isAvailable ?? true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await vendorApi.getMyProfile();
      const profile = res.data?.data?.vendor;
      if (profile) {
        setVendorProfile(profile);
        setIsAvailable(profile.isAvailable);
      }
    } catch {
      // Use cached vendor data from redux
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfile();
    });
    return unsubscribe;
  }, [navigation, fetchProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, [fetchProfile]);

  const handleToggleAvailability = async () => {
    try {
      setTogglingAvailability(true);
      const res = await vendorApi.toggleAvailability();
      const updated = res.data?.data?.vendor;
      if (updated) {
        setIsAvailable(updated.isAvailable);
        setVendorProfile((prev) => (prev ? { ...prev, isAvailable: updated.isAvailable } : prev));
      } else {
        setIsAvailable(!isAvailable);
      }
    } catch (err: any) {
      showAlert({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to toggle availability' });
      setIsAvailable(isAvailable); // Revert
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handleSwitchToClient = () => {
    dispatch(switchRole());
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Client' as any }],
      })
    );
  };

  const handleLogout = () => {
    dispatch(clearAuth());
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' as any }],
      })
    );
  };

  const profile = vendorProfile || vendor;
  const verificationStatus = profile?.status || 'pending';
  const verificationBadgeVariant =
    verificationStatus === 'approved' ? 'success' : verificationStatus === 'rejected' ? 'error' : 'warning';
  const verificationLabel =
    verificationStatus === 'approved' ? 'Verified' : verificationStatus === 'rejected' ? 'Rejected' : 'Pending Verification';

  const menuItems: MenuItem[] = [
    {
      icon: 'create-outline',
      label: 'Edit Business Profile',
      subtitle: 'Update your business information',
      onPress: () => navigation.navigate('EditProviderProfileScreen'),
      showChevron: true,
    },
    {
      icon: 'notifications-outline',
      label: 'Notification Settings',
      subtitle: 'Manage push notifications',
      onPress: () => navigation.navigate('ProviderSettingsScreen'),
      showChevron: true,
    },
    {
      icon: 'settings-outline',
      label: 'Settings',
      subtitle: 'App preferences and account',
      onPress: () => navigation.navigate('ProviderSettingsScreen'),
      showChevron: true,
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      subtitle: 'FAQs and contact support',
      onPress: () => showAlert({ type: 'info', title: 'Help & Support', message: 'Contact us at support@example.com' }),
      showChevron: true,
    },
    {
      icon: 'swap-horizontal-outline',
      label: 'Switch to Client Mode',
      subtitle: 'Browse and book as a client',
      onPress: () => setShowSwitchModal(true),
      color: COLORS.secondary[500],
      showChevron: true,
    },
    {
      icon: 'log-out-outline',
      label: 'Log Out',
      onPress: () => setShowLogoutModal(true),
      color: COLORS.error,
      showChevron: false,
    },
  ];

  if (loading && !profile) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
        <View className="items-center pt-8 px-4">
          <Skeleton variant="circle" width={80} height={80} className="mb-4" />
          <Skeleton variant="text" width="50%" height={24} className="mb-2" />
          <Skeleton variant="text" width="30%" height={18} className="mb-6" />
          <View className="flex-row w-full mb-6">
            <Skeleton variant="rect" height={80} className="flex-1 mr-2" />
            <Skeleton variant="rect" height={80} className="flex-1 mr-2" />
            <Skeleton variant="rect" height={80} className="flex-1" />
          </View>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rect" height={56} className="w-full mb-2" />
          ))}
        </View>
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
        {/* Profile Header */}
        <View className="items-center pt-6 pb-4 px-4">
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProviderProfileScreen')}
            activeOpacity={0.8}
          >
            <Avatar
              source={user?.avatar?.url}
              firstName={user?.firstName || ''}
              lastName={user?.lastName || ''}
              size="xl"
              border
            />
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: COLORS.primary[500],
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }}
            >
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text variant="h3" weight="bold" className="mt-3 text-neutral-600">
            {profile?.businessName || 'Business Name'}
          </Text>

          <Text variant="label" color={COLORS.neutral[400]} className="mt-1">
            {profile?.categories?.[0]?.name || 'Service Provider'}
          </Text>

          <View className="flex-row items-center mt-2">
            <Badge
              text={verificationLabel}
              variant={verificationBadgeVariant}
              dot
            />
          </View>

          {/* Rating */}
          {(profile?.averageRating || 0) > 0 && (
            <View className="mt-3">
              <StarRating
                rating={profile?.averageRating || 0}
                size={18}
                showValue
                reviewCount={profile?.totalReviews}
              />
            </View>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row px-4 mb-4">
          <Card padding="md" className="flex-1 mx-1 items-center">
            <Text variant="h4" weight="bold" color={COLORS.primary[500]}>
              {profile?.totalListings || 0}
            </Text>
            <Text variant="caption" color={COLORS.neutral[400]} className="mt-0.5">
              Active Listings
            </Text>
          </Card>
          <Card padding="md" className="flex-1 mx-1 items-center">
            <Text variant="h4" weight="bold" color={COLORS.secondary[500]}>
              {profile?.totalBookings || 0}
            </Text>
            <Text variant="caption" color={COLORS.neutral[400]} className="mt-0.5">
              Bookings
            </Text>
          </Card>
          <Card padding="md" className="flex-1 mx-1 items-center">
            <Text variant="h4" weight="bold" color={COLORS.success}>
              95%
            </Text>
            <Text variant="caption" color={COLORS.neutral[400]} className="mt-0.5">
              Response Rate
            </Text>
          </Card>
        </View>

        {/* Availability Toggle */}
        <View className="mx-4 mb-4">
          <Card padding="md">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    isAvailable ? 'bg-secondary-50' : 'bg-neutral-50'
                  }`}
                >
                  <Ionicons
                    name={isAvailable ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isAvailable ? COLORS.success : COLORS.neutral[300]}
                  />
                </View>
                <View className="ml-3">
                  <Text variant="label" weight="semibold" className="text-neutral-600">
                    {isAvailable ? 'Accepting Bookings' : 'Not Accepting Bookings'}
                  </Text>
                  <Text variant="caption" color={COLORS.neutral[400]}>
                    {isAvailable
                      ? 'Clients can send you booking requests'
                      : 'Your listings are hidden from search'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={handleToggleAvailability}
                trackColor={{ false: COLORS.neutral[200], true: COLORS.success }}
                thumbColor={COLORS.neutral[0]}
                disabled={togglingAvailability}
              />
            </View>
          </Card>
        </View>

        {/* Menu Items */}
        <View className="px-4" style={{ paddingBottom: LAYOUT.SCREEN_BOTTOM_PADDING }}>
          <SectionHeader title="Account" />
          <Card padding="none" className="overflow-hidden">
            {menuItems.map((item, index) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  className="flex-row items-center px-4 py-4"
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: item.color
                        ? `${item.color}15`
                        : COLORS.neutral[50],
                    }}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.color || COLORS.neutral[500]}
                    />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text
                      variant="label"
                      weight="medium"
                      color={item.color || COLORS.neutral[600]}
                    >
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text variant="caption" color={COLORS.neutral[300]}>
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                  {item.showChevron && (
                    <Ionicons name="chevron-forward" size={18} color={COLORS.neutral[300]} />
                  )}
                </TouchableOpacity>
                {index < menuItems.length - 1 && (
                  <View className="ml-[60px]">
                    <Divider />
                  </View>
                )}
              </React.Fragment>
            ))}
          </Card>
        </View>
      </ScrollView>

      {/* Logout Confirmation */}
      <ConfirmationModal
        visible={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out? You will need to sign in again to access your account."
        confirmText="Log Out"
        cancelText="Cancel"
        destructive
        icon="log-out-outline"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Switch Mode Confirmation */}
      <ConfirmationModal
        visible={showSwitchModal}
        title="Switch to Client Mode"
        message="Switch to client mode to browse listings and make bookings. You can switch back anytime."
        confirmText="Switch"
        cancelText="Cancel"
        icon="swap-horizontal-outline"
        onConfirm={() => {
          setShowSwitchModal(false);
          handleSwitchToClient();
        }}
        onCancel={() => setShowSwitchModal(false)}
      />
    </SafeAreaView>
  );
}
