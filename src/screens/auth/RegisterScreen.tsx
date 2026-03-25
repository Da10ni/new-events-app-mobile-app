import React, { useState, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { AuthStackParamList } from '../../navigation/types';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials, setLoading, setError } from '../../store/slices/authSlice';
import { authApi } from '../../services/api/authApi';
import { setTokens } from '../../services/storage/secureStorage';
import { useSweetAlert } from '../../components/feedback';
import { Text, TextInput, Button } from '../../components/ui';
import { COLORS } from '../../theme/colors';

type RegisterNav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: COLORS.neutral[200] };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: COLORS.error };
  if (score === 2) return { level: 2, label: 'Fair', color: COLORS.warning };
  if (score === 3) return { level: 3, label: 'Good', color: COLORS.info };
  return { level: 4, label: 'Strong', color: COLORS.success };
}

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterNav>();
  const dispatch = useAppDispatch();
  const { showAlert } = useSweetAlert();

  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{7,15}$/.test(form.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;

    if (!agreedToTerms) {
      showAlert({ type: 'warning', title: 'Terms Required', message: 'Please agree to the Terms of Service to continue.' });
      return;
    }

    setIsSubmitting(true);
    dispatch(setLoading(true));

    try {
      const response = await authApi.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      });

      const { user, vendor, accessToken, refreshToken } = response.data.data;

      await setTokens(accessToken, refreshToken);

      dispatch(
        setCredentials({
          user,
          vendor,
          accessToken,
          refreshToken,
        })
      );

      navigation.navigate('OtpVerification', {
        email: form.email.trim().toLowerCase(),
        flow: 'emailVerification',
      });
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
      dispatch(setError(message));
      showAlert({ type: 'error', title: 'Registration Failed', message });
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6" style={{ paddingTop: 56 }}>
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(400)} style={{ marginBottom: 28 }}>
              <Text variant="h3" weight="bold" style={{ marginBottom: 4 }} color={COLORS.primary[600]}>
                Create your account
              </Text>
              <Text variant="body" color={COLORS.neutral[400]}>
                Join EventsApp and start exploring services
              </Text>
            </Animated.View>

            {/* Section: Personal Information */}
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={{ marginBottom: 12 }}>
              <Text variant="caption" weight="semibold" color={COLORS.neutral[300]} style={{ letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Personal Information
              </Text>
            </Animated.View>

            {/* Name Row */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="First Name"
                  leftIcon="person-outline"
                  placeholder="John"
                  value={form.firstName}
                  onChangeText={(text) => updateField('firstName', text)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  error={errors.firstName}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Last Name"
                  leftIcon="person-outline"
                  placeholder="Doe"
                  value={form.lastName}
                  onChangeText={(text) => updateField('lastName', text)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  error={errors.lastName}
                />
              </View>
            </Animated.View>

            {/* Section: Contact Details */}
            <Animated.View entering={FadeInDown.delay(130).duration(400)} style={{ marginBottom: 12, marginTop: 8 }}>
              <Text variant="caption" weight="semibold" color={COLORS.neutral[300]} style={{ letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Contact Details
              </Text>
            </Animated.View>

            {/* Email */}
            <Animated.View entering={FadeInDown.delay(150).duration(400)}>
              <TextInput
                label="Email"
                leftIcon="mail-outline"
                placeholder="your@email.com"
                value={form.email}
                onChangeText={(text) => updateField('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
              />
            </Animated.View>

            {/* Phone */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <TextInput
                label="Phone Number"
                leftIcon="call-outline"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChangeText={(text) => updateField('phone', text)}
                keyboardType="phone-pad"
                autoCorrect={false}
                error={errors.phone}
              />
            </Animated.View>

            {/* Section: Create Password */}
            <Animated.View entering={FadeInDown.delay(230).duration(400)} style={{ marginBottom: 12, marginTop: 8 }}>
              <Text variant="caption" weight="semibold" color={COLORS.neutral[300]} style={{ letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Create Password
              </Text>
            </Animated.View>

            {/* Password + Strength + Confirm */}
            <Animated.View entering={FadeInDown.delay(250).duration(400)}>
              <TextInput
                label="Password"
                leftIcon="lock-closed-outline"
                placeholder="Create a strong password"
                value={form.password}
                onChangeText={(text) => updateField('password', text)}
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                error={errors.password}
                containerClassName="mb-1"
              />

              {/* Password Strength Indicator */}
              {form.password.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <View className="flex-row mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <View
                        key={level}
                        className="flex-1 h-1 rounded-full mx-0.5"
                        style={{
                          backgroundColor:
                            level <= passwordStrength.level
                              ? passwordStrength.color
                              : COLORS.neutral[200],
                        }}
                      />
                    ))}
                  </View>
                  <Text variant="caption" style={{ textAlign: 'right' }} color={passwordStrength.color}>
                    {passwordStrength.label}
                  </Text>
                </View>
              )}

              <TextInput
                label="Confirm Password"
                leftIcon="lock-closed-outline"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChangeText={(text) => updateField('confirmPassword', text)}
                secureTextEntry={!showConfirmPassword}
                rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                error={errors.confirmPassword}
              />
            </Animated.View>

            {/* Terms + Button + Login Link */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ marginTop: 4 }}>
              {/* Terms Checkbox */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 }}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                activeOpacity={0.7}
              >
                <View
                  className="w-5 h-5 rounded border items-center justify-center"
                  style={{
                    marginTop: 2,
                    marginRight: 12,
                    borderColor: agreedToTerms ? COLORS.primary[500] : COLORS.neutral[300],
                    backgroundColor: agreedToTerms ? COLORS.primary[500] : 'transparent',
                  }}
                >
                  {agreedToTerms && (
                    <Ionicons name="checkmark" size={14} color={COLORS.neutral[0]} />
                  )}
                </View>
                <Text variant="label" style={{ flex: 1, lineHeight: 20 }} color={COLORS.neutral[400]}>
                  By signing up, you agree to our{' '}
                  <Text variant="label" color={COLORS.primary[500]}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text variant="label" color={COLORS.primary[500]}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              {/* Register Button */}
              <Button
                title="Sign Up"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting || !agreedToTerms}
                onPress={handleRegister}
                className="mb-5"
              />

              {/* Login Link */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', paddingBottom: 8 }}>
                <Text variant="label" color={COLORS.neutral[400]}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text variant="label" weight="semibold" color={COLORS.primary[500]}>
                    Log In
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Back to Home */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Welcome')}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, marginBottom: 16 }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="arrow-back" size={14} color={COLORS.neutral[400]} style={{ marginRight: 6 }} />
                <Text variant="label" weight="medium" color={COLORS.neutral[400]}>
                  Back to Home
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
