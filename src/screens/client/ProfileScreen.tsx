import React, { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { clearAuth, switchRole } from '../../store/slices/authSlice';
import { Text, Avatar, Divider } from '../../components/ui';
import { ConfirmationModal, useSweetAlert } from '../../components/feedback';
import { APP_VERSION, LAYOUT } from '../../config/constants';
import { COLORS } from '../../theme/colors';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  showDivider?: boolean;
}

const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  android: { elevation: 1 },
  default: {},
});

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { showAlert } = useSweetAlert();
  const user = useAppSelector((s) => s.auth.user);
  const vendor = useAppSelector((s) => s.auth.vendor);
  const { bookings } = useAppSelector((s) => s.booking);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const handleLogout = useCallback(() => {
    dispatch(clearAuth());
    setShowLogoutModal(false);
  }, [dispatch]);

  const handleSwitchToProvider = useCallback(() => {
    dispatch(switchRole());
    setShowSwitchModal(false);
  }, [dispatch]);

  const menuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'Edit Profile',
      onPress: () => navigation.navigate('EditProfileScreen'),
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      onPress: () => navigation.navigate('NotificationsScreen'),
    },
    {
      icon: 'settings-outline',
      label: 'Settings',
      onPress: () => navigation.navigate('SettingsScreen'),
      showDivider: true,
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      onPress: () => {
        showAlert({ type: 'info', title: 'Help & Support', message: 'Visit our help center or contact support@events.com' });
      },
    },
    {
      icon: 'information-circle-outline',
      label: 'About',
      onPress: () => {
        showAlert({ type: 'info', title: 'About', message: `Events Platform v${APP_VERSION}\nBuilt with love for event planning.` });
      },
      showDivider: true,
    },
    ...(vendor?.status === 'approved'
      ? [
          {
            icon: 'swap-horizontal-outline' as keyof typeof Ionicons.glyphMap,
            label: 'Switch to Provider Mode',
            onPress: () => setShowSwitchModal(true),
            color: COLORS.secondary[500],
          },
        ]
      : vendor
        ? [
            {
              icon: (vendor.status === 'pending' ? 'time-outline' : 'close-circle-outline') as keyof typeof Ionicons.glyphMap,
              label: vendor.status === 'pending' ? 'Provider: Pending Approval' : vendor.status === 'rejected' ? 'Provider: Rejected' : 'Provider: Suspended',
              onPress: () => {},
              color: vendor.status === 'pending' ? COLORS.warning : COLORS.error,
            },
          ]
        : []),
    {
      icon: 'log-out-outline',
      label: 'Log Out',
      onPress: () => setShowLogoutModal(true),
      color: COLORS.error,
    },
  ];

  const bookingCount = bookings.length;
  const reviewCount = bookings.filter((b) => b.isReviewed).length;

  return (
    <View className="flex-1 bg-neutral-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: LAYOUT.SCREEN_BOTTOM_PADDING }}
      >
        {/* Profile Header Card */}
        <View
          className="mx-4 mt-4 items-center rounded-3xl bg-white px-6 pb-6 pt-8"
          style={CARD_SHADOW}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfileScreen')}
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
          <Text variant="h3" weight="bold" className="mt-4" color={COLORS.neutral[600]}>
            {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`}
          </Text>
          <Text variant="label" color={COLORS.neutral[400]} className="mt-1">
            {user?.email || ''}
          </Text>

          {/* Stats Row */}
          <View className="mt-5 flex-row self-stretch">
            <View className="flex-1 items-center">
              <Text variant="h4" weight="bold" color={COLORS.primary[500]}>
                {bookingCount}
              </Text>
              <Text variant="caption" color={COLORS.neutral[300]} className="mt-0.5">
                Bookings
              </Text>
            </View>
            <View className="w-[1px] bg-neutral-100" />
            <View className="flex-1 items-center">
              <Text variant="h4" weight="bold" color={COLORS.primary[500]}>
                {reviewCount}
              </Text>
              <Text variant="caption" color={COLORS.neutral[300]} className="mt-0.5">
                Reviews
              </Text>
            </View>
            <View className="w-[1px] bg-neutral-100" />
            <View className="flex-1 items-center">
              <Text variant="h4" weight="bold" color={COLORS.primary[500]}>
                0
              </Text>
              <Text variant="caption" color={COLORS.neutral[300]} className="mt-0.5">
                Favorites
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="mx-4 mt-4 overflow-hidden rounded-2xl bg-white" style={CARD_SHADOW}>
          {menuItems.map((item, index) => (
            <View key={index}>
              <TouchableOpacity
                onPress={item.onPress}
                className="flex-row items-center px-4 py-4"
                activeOpacity={0.7}
              >
                <View
                  className="mr-4 items-center justify-center rounded-xl"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: item.color ? 'rgba(193,53,21,0.08)' : COLORS.neutral[50],
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.color || COLORS.neutral[500]}
                  />
                </View>
                <Text
                  variant="body"
                  weight="medium"
                  color={item.color || COLORS.neutral[600]}
                  className="flex-1"
                >
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.neutral[200]} />
              </TouchableOpacity>

              {item.showDivider ? (
                <Divider className="mx-4" />
              ) : index < menuItems.length - 1 ? (
                <View className="ml-16 mr-4 h-[0.5px] bg-neutral-50" />
              ) : null}
            </View>
          ))}
        </View>

        {/* Version */}
        <View className="items-center pt-8">
          <Text variant="caption" color={COLORS.neutral[300]}>
            Events Platform v{APP_VERSION}
          </Text>
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out of your account?"
        confirmText="Log Out"
        cancelText="Cancel"
        destructive
        icon="log-out-outline"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      <ConfirmationModal
        visible={showSwitchModal}
        title="Switch to Provider Mode"
        message="Switch to provider mode to manage your listings, bookings, and earnings. You can switch back anytime."
        confirmText="Switch"
        cancelText="Cancel"
        icon="swap-horizontal-outline"
        onConfirm={handleSwitchToProvider}
        onCancel={() => setShowSwitchModal(false)}
      />
    </View>
  );
}
