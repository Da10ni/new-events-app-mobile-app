import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useAppDispatch } from '../../store/hooks';
import { clearAuth } from '../../store/slices/authSlice';
import { showToast } from '../../store/slices/uiSlice';
import { Text, Divider } from '../../components/ui';
import { ConfirmationModal, useSweetAlert } from '../../components/feedback';
import { APP_VERSION } from '../../config/constants';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<ProfileStackParamList, 'SettingsScreen'>;

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ar', name: 'Arabic' },
];

export default function SettingsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { showAlert } = useSweetAlert();

  // Notification preferences
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingUpdates, setBookingUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [messageNotifications, setMessageNotifications] = useState(true);

  // Language
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  // Privacy
  const [showProfile, setShowProfile] = useState(true);
  const [showActivity, setShowActivity] = useState(false);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = useCallback(async () => {
    try {
      setDeleting(true);
      // In production, call a delete account API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      dispatch(clearAuth());
      dispatch(showToast({ message: 'Account deleted', type: 'info' }));
    } catch {
      showAlert({ type: 'error', title: 'Error', message: 'Failed to delete account. Please contact support.' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }, [dispatch]);

  const renderToggleRow = (
    label: string,
    description: string,
    value: boolean,
    onValueChange: (val: boolean) => void
  ) => (
    <View className="flex-row items-center justify-between py-4">
      <View className="flex-1 pr-4">
        <Text variant="label" weight="medium" className="mb-0.5">
          {label}
        </Text>
        <Text variant="caption" color={COLORS.neutral[400]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.neutral[200], true: COLORS.primary[500] }}
        thumbColor={COLORS.neutral[0]}
        ios_backgroundColor={COLORS.neutral[200]}
      />
    </View>
  );

  const renderSectionTitle = (title: string, icon: keyof typeof Ionicons.glyphMap) => (
    <View className="mb-2 mt-6 flex-row items-center">
      <Ionicons name={icon} size={20} color={COLORS.primary[500]} />
      <Text variant="body" weight="bold" className="ml-2">
        {title}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-4">
          {/* Notification Preferences */}
          {renderSectionTitle('Notifications', 'notifications-outline')}

          {renderToggleRow(
            'Push Notifications',
            'Receive push notifications on your device',
            pushNotifications,
            setPushNotifications
          )}
          <View className="ml-4 h-[0.5px] bg-neutral-50" />

          {renderToggleRow(
            'Email Notifications',
            'Receive notifications via email',
            emailNotifications,
            setEmailNotifications
          )}
          <View className="ml-4 h-[0.5px] bg-neutral-50" />

          {renderToggleRow(
            'Booking Updates',
            'Get notified about booking status changes',
            bookingUpdates,
            setBookingUpdates
          )}
          <View className="ml-4 h-[0.5px] bg-neutral-50" />

          {renderToggleRow(
            'Messages',
            'Get notified about new messages',
            messageNotifications,
            setMessageNotifications
          )}
          <View className="ml-4 h-[0.5px] bg-neutral-50" />

          {renderToggleRow(
            'Promotions & Offers',
            'Receive promotional offers and deals',
            promotions,
            setPromotions
          )}

          <Divider className="my-4" />

          {/* Language */}
          {renderSectionTitle('Language', 'globe-outline')}

          <TouchableOpacity
            onPress={() => setShowLanguagePicker(!showLanguagePicker)}
            className="flex-row items-center justify-between py-4"
          >
            <View>
              <Text variant="label" weight="medium">
                App Language
              </Text>
              <Text variant="caption" color={COLORS.neutral[400]}>
                {LANGUAGES.find((l) => l.code === selectedLanguage)?.name || 'English'}
              </Text>
            </View>
            <Ionicons
              name={showLanguagePicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.neutral[400]}
            />
          </TouchableOpacity>

          {showLanguagePicker && (
            <View className="mb-3 rounded-xl bg-neutral-50 p-3">
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => {
                    setSelectedLanguage(lang.code);
                    setShowLanguagePicker(false);
                  }}
                  className="flex-row items-center justify-between py-2.5"
                >
                  <Text
                    variant="label"
                    weight={selectedLanguage === lang.code ? 'bold' : 'regular'}
                    color={selectedLanguage === lang.code ? COLORS.primary[500] : COLORS.neutral[600]}
                  >
                    {lang.name}
                  </Text>
                  {selectedLanguage === lang.code && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary[500]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Divider className="my-4" />

          {/* Privacy */}
          {renderSectionTitle('Privacy', 'lock-closed-outline')}

          {renderToggleRow(
            'Show Profile Publicly',
            'Allow other users to see your profile',
            showProfile,
            setShowProfile
          )}
          <View className="ml-4 h-[0.5px] bg-neutral-50" />

          {renderToggleRow(
            'Show Activity',
            'Allow others to see your booking activity',
            showActivity,
            setShowActivity
          )}

          <Divider className="my-4" />

          {/* Danger Zone */}
          {renderSectionTitle('Account', 'person-outline')}

          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            className="flex-row items-center py-4"
          >
            <View className="mr-3 items-center justify-center rounded-full bg-error-light p-2">
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </View>
            <View className="flex-1">
              <Text variant="label" weight="medium" color={COLORS.error}>
                Delete Account
              </Text>
              <Text variant="caption" color={COLORS.neutral[400]}>
                Permanently delete your account and all data
              </Text>
            </View>
          </TouchableOpacity>

          {/* App Info */}
          <View className="mt-8 items-center">
            <Text variant="caption" color={COLORS.neutral[300]}>
              Events Platform v{APP_VERSION}
            </Text>
            <Text variant="caption" color={COLORS.neutral[300]} className="mt-1">
              Made with care for event planning
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Account"
        message="This action is permanent and cannot be undone. All your data, bookings, and reviews will be permanently deleted."
        confirmText="Delete"
        cancelText="Keep Account"
        destructive
        icon="warning-outline"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
        loading={deleting}
      />
    </View>
  );
}
