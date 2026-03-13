import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAppDispatch } from '../../store/hooks';
import { clearAuth } from '../../store/slices/authSlice';
import { Text, Card, Divider } from '../../components/ui';
import { SectionHeader } from '../../components/layout';
import { ConfirmationModal, useSweetAlert } from '../../components/feedback';
import { COLORS } from '../../theme/colors';

interface SettingToggle {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: boolean;
}

export default function ProviderSettingsScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { showAlert } = useSweetAlert();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Notification preferences
  const [notificationSettings, setNotificationSettings] = useState<SettingToggle[]>([
    {
      key: 'newBooking',
      label: 'New Booking Notifications',
      description: 'Get notified when a client makes a booking',
      icon: 'calendar-outline',
      value: true,
    },
    {
      key: 'messages',
      label: 'Message Notifications',
      description: 'Get notified when you receive a message',
      icon: 'chatbubble-outline',
      value: true,
    },
    {
      key: 'reviews',
      label: 'Review Notifications',
      description: 'Get notified when a client leaves a review',
      icon: 'star-outline',
      value: true,
    },
    {
      key: 'promotions',
      label: 'Promotional Updates',
      description: 'Receive tips and promotional offers',
      icon: 'megaphone-outline',
      value: false,
    },
  ]);

  // Booking preferences
  const [bookingSettings, setBookingSettings] = useState<SettingToggle[]>([
    {
      key: 'autoAccept',
      label: 'Auto-Accept Bookings',
      description: 'Automatically accept incoming booking requests',
      icon: 'checkmark-circle-outline',
      value: false,
    },
  ]);

  const [responseTimeTarget, setResponseTimeTarget] = useState<string>('1h');

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState<SettingToggle[]>([
    {
      key: 'showPhone',
      label: 'Show Phone Number',
      description: 'Allow clients to see your phone number',
      icon: 'call-outline',
      value: true,
    },
    {
      key: 'showEmail',
      label: 'Show Email',
      description: 'Allow clients to see your email address',
      icon: 'mail-outline',
      value: true,
    },
    {
      key: 'showAddress',
      label: 'Show Exact Address',
      description: 'Show full address or just area on listings',
      icon: 'location-outline',
      value: false,
    },
  ]);

  const toggleNotification = (key: string) => {
    setNotificationSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: !s.value } : s))
    );
  };

  const toggleBooking = (key: string) => {
    setBookingSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: !s.value } : s))
    );
  };

  const togglePrivacy = (key: string) => {
    setPrivacySettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: !s.value } : s))
    );
  };

  const responseTimeOptions = [
    { key: '15m', label: '15 minutes' },
    { key: '30m', label: '30 minutes' },
    { key: '1h', label: '1 hour' },
    { key: '2h', label: '2 hours' },
    { key: '6h', label: '6 hours' },
    { key: '24h', label: '24 hours' },
  ];

  const handleDeleteAccount = () => {
    // In a real app, call an API to delete the account
    dispatch(clearAuth());
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' as any }],
      })
    );
  };

  const renderToggleItem = (
    item: SettingToggle,
    onToggle: (key: string) => void
  ) => (
    <View key={item.key} className="flex-row items-center justify-between py-3.5">
      <View className="flex-row items-center flex-1 mr-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-50">
          <Ionicons name={item.icon} size={18} color={COLORS.neutral[500]} />
        </View>
        <View className="ml-3 flex-1">
          <Text variant="label" weight="medium" className="text-neutral-600">
            {item.label}
          </Text>
          <Text variant="caption" color={COLORS.neutral[300]} className="mt-0.5">
            {item.description}
          </Text>
        </View>
      </View>
      <Switch
        value={item.value}
        onValueChange={() => onToggle(item.key)}
        trackColor={{ false: COLORS.neutral[200], true: COLORS.primary[500] }}
        thumbColor={COLORS.neutral[0]}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Notification Preferences */}
        <View className="px-4 pt-4">
          <SectionHeader title="Notification Preferences" />
          <Card padding="md" className="mb-6">
            {notificationSettings.map((item, index) => (
              <React.Fragment key={item.key}>
                {renderToggleItem(item, toggleNotification)}
                {index < notificationSettings.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Card>
        </View>

        {/* Booking Preferences */}
        <View className="px-4">
          <SectionHeader title="Booking Preferences" />
          <Card padding="md" className="mb-4">
            {bookingSettings.map((item) => renderToggleItem(item, toggleBooking))}
          </Card>

          {/* Response Time Target */}
          <Card padding="md" className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-50">
                <Ionicons name="timer-outline" size={18} color={COLORS.neutral[500]} />
              </View>
              <View className="ml-3">
                <Text variant="label" weight="medium" className="text-neutral-600">
                  Response Time Target
                </Text>
                <Text variant="caption" color={COLORS.neutral[300]}>
                  Your target time to respond to inquiries
                </Text>
              </View>
            </View>
            <View className="flex-row flex-wrap">
              {responseTimeOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setResponseTimeTarget(opt.key)}
                  className={`mr-2 mb-2 rounded-full border px-3.5 py-2 ${
                    responseTimeTarget === opt.key
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <Text
                    variant="caption"
                    weight={responseTimeTarget === opt.key ? 'semibold' : 'medium'}
                    color={responseTimeTarget === opt.key ? COLORS.neutral[0] : COLORS.neutral[500]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </View>

        {/* Privacy Settings */}
        <View className="px-4">
          <SectionHeader title="Privacy" />
          <Card padding="md" className="mb-6">
            {privacySettings.map((item, index) => (
              <React.Fragment key={item.key}>
                {renderToggleItem(item, togglePrivacy)}
                {index < privacySettings.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Card>
        </View>

        {/* Account Settings */}
        <View className="px-4">
          <SectionHeader title="Account" />
          <Card padding="none" className="mb-6 overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center px-4 py-4"
              onPress={() => showAlert({ type: 'info', title: 'Change Password', message: 'A password reset link will be sent to your email.' })}
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-50">
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.neutral[500]} />
              </View>
              <View className="ml-3 flex-1">
                <Text variant="label" weight="medium" className="text-neutral-600">
                  Change Password
                </Text>
                <Text variant="caption" color={COLORS.neutral[300]}>
                  Update your account password
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.neutral[300]} />
            </TouchableOpacity>

            <View className="ml-[60px]">
              <Divider />
            </View>

            <TouchableOpacity
              className="flex-row items-center px-4 py-4"
              onPress={() => showAlert({
                type: 'info',
                title: 'Export Data',
                message: 'We will email you a copy of all your data. This may take a few hours.',
                buttons: [
                  { text: 'Cancel' },
                  { text: 'Request Export', onPress: () => showAlert({ type: 'success', title: 'Requested', message: 'Data export has been requested.' }) },
                ],
              })}
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-50">
                <Ionicons name="download-outline" size={18} color={COLORS.neutral[500]} />
              </View>
              <View className="ml-3 flex-1">
                <Text variant="label" weight="medium" className="text-neutral-600">
                  Export Data
                </Text>
                <Text variant="caption" color={COLORS.neutral[300]}>
                  Download a copy of your data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.neutral[300]} />
            </TouchableOpacity>

            <View className="ml-[60px]">
              <Divider />
            </View>

            <TouchableOpacity
              className="flex-row items-center px-4 py-4"
              onPress={() => setShowDeleteModal(true)}
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-error-light">
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </View>
              <View className="ml-3 flex-1">
                <Text variant="label" weight="medium" color={COLORS.error}>
                  Delete Account
                </Text>
                <Text variant="caption" color={COLORS.neutral[300]}>
                  Permanently delete your account and all data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.neutral[300]} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* App Info */}
        <View className="items-center px-4 pt-4 pb-8">
          <Text variant="caption" color={COLORS.neutral[300]}>
            Events App v1.0.0
          </Text>
          <Text variant="caption" color={COLORS.neutral[300]} className="mt-0.5">
            Made with care in Pakistan
          </Text>
        </View>
      </ScrollView>

      {/* Delete Account Confirmation */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Account"
        message="This will permanently delete your account, all listings, bookings, and data. This action cannot be undone."
        confirmText="Delete Account"
        cancelText="Keep Account"
        destructive
        icon="warning-outline"
        onConfirm={() => {
          setShowDeleteModal(false);
          handleDeleteAccount();
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </SafeAreaView>
  );
}
