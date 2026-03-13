import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProviderProfileStackParamList } from '../../navigation/types';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setVendor } from '../../store/slices/authSlice';
import { vendorApi } from '../../services/api/vendorApi';
import { uploadApi } from '../../services/api/uploadApi';
import { categoryApi } from '../../services/api/categoryApi';
import { Text, Button, TextInput, Card, Chip, Avatar, Divider, Skeleton } from '../../components/ui';
import { SectionHeader } from '../../components/layout';
import { LoadingOverlay, useSweetAlert } from '../../components/feedback';
import { COLORS } from '../../theme/colors';
import type { Category, Vendor } from '../../types';

type ProfileNav = NativeStackNavigationProp<ProviderProfileStackParamList>;

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface OperatingHour {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface FormData {
  businessName: string;
  description: string;
  categoryId: string;
  phone: string;
  email: string;
  city: string;
  area: string;
  fullAddress: string;
  logoUri: string | null;
  operatingHours: OperatingHour[];
  socialLinks: {
    facebook: string;
    instagram: string;
    website: string;
  };
}

interface FormErrors {
  [key: string]: string;
}

export default function EditProviderProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const dispatch = useAppDispatch();
  const { showAlert } = useSweetAlert();
  const { user, vendor } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    description: '',
    categoryId: '',
    phone: '',
    email: '',
    city: '',
    area: '',
    fullAddress: '',
    logoUri: null,
    operatingHours: DAYS_OF_WEEK.map((day) => ({
      day,
      isOpen: !['Saturday', 'Sunday'].includes(day),
      openTime: '09:00',
      closeTime: '18:00',
    })),
    socialLinks: {
      facebook: '',
      instagram: '',
      website: '',
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, catRes] = await Promise.all([
          vendorApi.getMyProfile(),
          categoryApi.getAll(),
        ]);

        const profile: Vendor = profileRes.data?.data?.vendor;
        setCategories(catRes.data?.data?.categories || []);

        if (profile) {
          setFormData((prev) => ({
            ...prev,
            businessName: profile.businessName || '',
            description: profile.description || '',
            categoryId: profile.categories?.[0]?._id || '',
            phone: profile.businessPhone || user?.phone || '',
            email: profile.businessEmail || user?.email || '',
            city: profile.address?.city || '',
            area: profile.address?.state || '',
            fullAddress: profile.address?.street || '',
            logoUri: user?.avatar?.url || null,
          }));
        }
      } catch (err: any) {
        showAlert({ type: 'error', title: 'Error', message: 'Failed to load profile data' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const updateSocialLink = (key: keyof FormData['socialLinks'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }));
  };

  const toggleDayOpen = (dayIndex: number) => {
    const updated = [...formData.operatingHours];
    updated[dayIndex] = { ...updated[dayIndex], isOpen: !updated[dayIndex].isOpen };
    updateField('operatingHours', updated);
  };

  const updateDayTime = (dayIndex: number, field: 'openTime' | 'closeTime', value: string) => {
    const updated = [...formData.operatingHours];
    updated[dayIndex] = { ...updated[dayIndex], [field]: value };
    updateField('operatingHours', updated);
  };

  const handlePickLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateField('logoUri', result.assets[0].uri);
      }
    } catch {
      showAlert({ type: 'error', title: 'Error', message: 'Failed to pick image' });
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const updateData: Partial<Vendor> = {
        businessName: formData.businessName,
        description: formData.description,
        businessPhone: formData.phone,
        businessEmail: formData.email,
        address: {
          city: formData.city,
          state: formData.area,
          street: formData.fullAddress,
          country: 'Pakistan',
        },
      };

      if (formData.categoryId) {
        updateData.categories = [{ _id: formData.categoryId, name: '', slug: '' }] as any;
      }

      const res = await vendorApi.updateProfile(updateData);
      const updatedVendor = res.data?.data?.vendor;
      if (updatedVendor) {
        dispatch(setVendor(updatedVendor));
      }

      showAlert({ type: 'success', title: 'Success', message: 'Profile updated successfully', buttons: [
        { text: 'OK', onPress: () => navigation.goBack() },
      ] });
    } catch (err: any) {
      showAlert({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
        <View className="items-center pt-6 px-4">
          <Skeleton variant="circle" width={100} height={100} className="mb-4" />
          <Skeleton variant="rect" height={52} className="w-full mb-4" />
          <Skeleton variant="rect" height={100} className="w-full mb-4" />
          <Skeleton variant="rect" height={52} className="w-full mb-4" />
          <Skeleton variant="rect" height={52} className="w-full mb-4" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Upload */}
          <View className="items-center pt-6 pb-6">
            <TouchableOpacity onPress={handlePickLogo} className="relative">
              {formData.logoUri ? (
                <Image
                  source={{ uri: formData.logoUri }}
                  className="h-24 w-24 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <Avatar
                  firstName={user?.firstName || ''}
                  lastName={user?.lastName || ''}
                  size="xl"
                />
              )}
              <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-primary-500 border-2 border-white">
                <Ionicons name="camera" size={14} color={COLORS.neutral[0]} />
              </View>
            </TouchableOpacity>
            <Text variant="caption" color={COLORS.neutral[400]} className="mt-2">
              Tap to change business logo
            </Text>
          </View>

          {/* Business Info */}
          <View className="px-4">
            <SectionHeader title="Business Information" />

            <TextInput
              label="Business Name"
              placeholder="Your business name"
              value={formData.businessName}
              onChangeText={(t) => updateField('businessName', t)}
              error={errors.businessName}
              leftIcon="business"
            />

            <TextInput
              label="Business Description"
              placeholder="Describe your business and services..."
              value={formData.description}
              onChangeText={(t) => updateField('description', t)}
              multiline
            />

            {/* Category Selection */}
            <Text variant="label" weight="medium" className="mb-1.5 text-neutral-500">
              Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {categories.map((cat) => (
                <Chip
                  key={cat._id}
                  label={cat.name}
                  selected={formData.categoryId === cat._id}
                  onPress={() => updateField('categoryId', cat._id)}
                  className="mr-2"
                />
              ))}
            </ScrollView>

            <Divider className="my-4" />

            <SectionHeader title="Contact Information" />

            <TextInput
              label="Phone Number"
              placeholder="+92 300 1234567"
              value={formData.phone}
              onChangeText={(t) => updateField('phone', t)}
              keyboardType="phone-pad"
              leftIcon="call"
              error={errors.phone}
            />

            <TextInput
              label="Business Email"
              placeholder="business@example.com"
              value={formData.email}
              onChangeText={(t) => updateField('email', t)}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail"
            />

            <Divider className="my-4" />

            <SectionHeader title="Address" />

            <TextInput
              label="City"
              placeholder="e.g., Lahore"
              value={formData.city}
              onChangeText={(t) => updateField('city', t)}
              leftIcon="location"
              error={errors.city}
            />

            <TextInput
              label="Area"
              placeholder="e.g., Gulberg"
              value={formData.area}
              onChangeText={(t) => updateField('area', t)}
              leftIcon="navigate"
            />

            <TextInput
              label="Full Address"
              placeholder="Complete street address"
              value={formData.fullAddress}
              onChangeText={(t) => updateField('fullAddress', t)}
              leftIcon="map"
              multiline
            />

            <Divider className="my-4" />

            {/* Operating Hours */}
            <SectionHeader title="Operating Hours" />
            <Card padding="md" className="mb-4">
              {formData.operatingHours.map((day, index) => (
                <View key={day.day}>
                  <View className="flex-row items-center justify-between py-2.5">
                    <View className="flex-row items-center flex-1">
                      <TouchableOpacity
                        onPress={() => toggleDayOpen(index)}
                        className={`h-5 w-5 items-center justify-center rounded border ${
                          day.isOpen
                            ? 'bg-primary-500 border-primary-500'
                            : 'bg-white border-neutral-200'
                        }`}
                      >
                        {day.isOpen && (
                          <Ionicons name="checkmark" size={14} color={COLORS.neutral[0]} />
                        )}
                      </TouchableOpacity>
                      <Text
                        variant="label"
                        weight="medium"
                        color={day.isOpen ? COLORS.neutral[600] : COLORS.neutral[300]}
                        className="ml-3"
                      >
                        {day.day}
                      </Text>
                    </View>

                    {day.isOpen ? (
                      <View className="flex-row items-center">
                        <TouchableOpacity
                          className="rounded-lg bg-neutral-50 px-3 py-1.5"
                          onPress={() => {
                            // Simplified time picker - in production, use @react-native-community/datetimepicker
                            Alert.prompt?.(
                              'Open Time',
                              'Enter time (HH:MM)',
                              (text) => {
                                if (text && /^\d{2}:\d{2}$/.test(text)) {
                                  updateDayTime(index, 'openTime', text);
                                }
                              },
                              'plain-text',
                              day.openTime
                            );
                          }}
                        >
                          <Text variant="caption" weight="medium" className="text-neutral-600">
                            {day.openTime}
                          </Text>
                        </TouchableOpacity>
                        <Text variant="caption" color={COLORS.neutral[300]} className="mx-2">
                          to
                        </Text>
                        <TouchableOpacity
                          className="rounded-lg bg-neutral-50 px-3 py-1.5"
                          onPress={() => {
                            Alert.prompt?.(
                              'Close Time',
                              'Enter time (HH:MM)',
                              (text) => {
                                if (text && /^\d{2}:\d{2}$/.test(text)) {
                                  updateDayTime(index, 'closeTime', text);
                                }
                              },
                              'plain-text',
                              day.closeTime
                            );
                          }}
                        >
                          <Text variant="caption" weight="medium" className="text-neutral-600">
                            {day.closeTime}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text variant="caption" color={COLORS.neutral[300]}>
                        Closed
                      </Text>
                    )}
                  </View>
                  {index < formData.operatingHours.length - 1 && (
                    <Divider />
                  )}
                </View>
              ))}
            </Card>

            <Divider className="my-4" />

            {/* Social Links */}
            <SectionHeader title="Social Media Links" />

            <TextInput
              label="Facebook"
              placeholder="https://facebook.com/yourbusiness"
              value={formData.socialLinks.facebook}
              onChangeText={(t) => updateSocialLink('facebook', t)}
              autoCapitalize="none"
              leftIcon="logo-facebook"
            />

            <TextInput
              label="Instagram"
              placeholder="https://instagram.com/yourbusiness"
              value={formData.socialLinks.instagram}
              onChangeText={(t) => updateSocialLink('instagram', t)}
              autoCapitalize="none"
              leftIcon="logo-instagram"
            />

            <TextInput
              label="Website"
              placeholder="https://yourbusiness.com"
              value={formData.socialLinks.website}
              onChangeText={(t) => updateSocialLink('website', t)}
              autoCapitalize="none"
              leftIcon="globe-outline"
            />
          </View>
        </ScrollView>

        {/* Save Button */}
        <View className="absolute bottom-0 left-0 right-0 border-t border-neutral-100 bg-white px-4 pb-6 pt-3">
          <Button
            title="Save Changes"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSave}
            loading={submitting}
            leftIcon="checkmark-circle"
          />
        </View>

        <LoadingOverlay visible={submitting} message="Saving profile..." />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
