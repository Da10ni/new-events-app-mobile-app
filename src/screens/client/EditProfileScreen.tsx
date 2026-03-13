import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setUser } from '../../store/slices/authSlice';
import { showToast } from '../../store/slices/uiSlice';
import { userApi } from '../../services/api/userApi';
import { Text, Avatar, Button } from '../../components/ui';
import TextInput from '../../components/ui/TextInput';
import { LoadingOverlay, useSweetAlert } from '../../components/feedback';
import * as ExpoImagePicker from 'expo-image-picker';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfileScreen'>;

export default function EditProfileScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { showAlert } = useSweetAlert();
  const user = useAppSelector((s) => s.auth.user);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar?.url || null);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed =
      firstName !== (user?.firstName || '') ||
      lastName !== (user?.lastName || '') ||
      phone !== (user?.phone || '') ||
      avatarUri !== (user?.avatar?.url || null);
    setHasChanges(changed);
  }, [firstName, lastName, phone, avatarUri, user]);

  const handlePickAvatar = useCallback(async () => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert({ type: 'warning', title: 'Permission Required', message: 'Photo library access is needed to change your profile picture.' });
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!firstName.trim()) {
      showAlert({ type: 'warning', title: 'Validation', message: 'First name is required' });
      return;
    }
    if (!lastName.trim()) {
      showAlert({ type: 'warning', title: 'Validation', message: 'Last name is required' });
      return;
    }

    try {
      setLoading(true);
      const updateData: Record<string, unknown> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      };

      const res = await userApi.updateProfile(updateData as any);
      dispatch(setUser(res.data.data.user));
      dispatch(showToast({ message: 'Profile updated successfully', type: 'success' }));
      navigation.goBack();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update profile';
      showAlert({ type: 'error', title: 'Error', message });
    } finally {
      setLoading(false);
    }
  }, [firstName, lastName, phone, dispatch, navigation]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LoadingOverlay visible={loading} message="Saving changes..." />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-6">
          {/* Avatar with Camera Icon */}
          <View className="mb-8 items-center">
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8}>
              <Avatar
                source={avatarUri}
                firstName={firstName}
                lastName={lastName}
                size="xl"
              />
              <View
                className="absolute bottom-0 right-0 items-center justify-center rounded-full border-2 border-white bg-primary-500"
                style={{ width: 32, height: 32 }}
              >
                <Ionicons name="camera" size={16} color={COLORS.neutral[0]} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePickAvatar} className="mt-2">
              <Text variant="label" weight="semibold" color={COLORS.primary[500]}>
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <TextInput
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
            leftIcon="person-outline"
            autoCapitalize="words"
          />

          <TextInput
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter your last name"
            leftIcon="person-outline"
            autoCapitalize="words"
          />

          <TextInput
            label="Email"
            value={email}
            placeholder="Email address"
            leftIcon="mail-outline"
            disabled
          />
          <Text variant="caption" color={COLORS.neutral[300]} className="-mt-2 mb-4 ml-1">
            Email cannot be changed
          </Text>

          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            leftIcon="call-outline"
            keyboardType="phone-pad"
          />

          {/* Save Button */}
          <View className="mt-4">
            <Button
              title="Save Changes"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleSave}
              disabled={!hasChanges || loading}
              loading={loading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
