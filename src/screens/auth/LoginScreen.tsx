import React, { useState } from 'react';
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
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import type { AuthStackParamList } from '../../navigation/types';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials, setLoading, setError } from '../../store/slices/authSlice';
import { authApi } from '../../services/api/authApi';
import { setTokens } from '../../services/storage/secureStorage';
import { useSweetAlert } from '../../components/feedback';
import { Text, TextInput, Button, Divider } from '../../components/ui';
import { COLORS } from '../../theme/colors';

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNav>();
  const dispatch = useAppDispatch();
  const { showAlert } = useSweetAlert();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;

    setIsSubmitting(true);
    dispatch(setLoading(true));

    try {
      const response = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
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
    } catch (err: any) {
      if (__DEV__) {
        console.log('[LOGIN ERROR]', JSON.stringify(err?.response?.data || err?.message || err, null, 2));
        console.log('[LOGIN URL]', err?.config?.baseURL, err?.config?.url);
      }
      const message =
        err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      dispatch(setError(message));
      showAlert({ type: 'error', title: 'Login Failed', message });
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
          <View className="flex-1 px-6 pt-20">
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(500)} className="mb-8">
              <Text variant="h3" weight="bold" className="mb-2" color={COLORS.primary[600]}>
                Welcome back
              </Text>
              <Text variant="body" color={COLORS.neutral[400]}>
                Log in to continue to EventsApp
              </Text>
            </Animated.View>

            {/* Email Input */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <TextInput
                label="Email"
                leftIcon="mail-outline"
                placeholder="your@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </Animated.View>

            {/* Password Input */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              <TextInput
                label="Password"
                leftIcon="lock-closed-outline"
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={errors.password}
                secureTextEntry={!showPassword}
                autoComplete="password"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                containerClassName="mb-1"
              />
            </Animated.View>

            {/* Forgot Password */}
            <Animated.View entering={FadeIn.delay(300).duration(400)}>
              <TouchableOpacity
                className="self-end mb-6"
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text variant="label" weight="medium" color={COLORS.primary[500]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Login Button */}
            <Animated.View entering={FadeInDown.delay(350).duration(500)}>
              <Button
                title="Log In"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting}
                onPress={handleLogin}
                className="mb-6"
              />
            </Animated.View>

            {/* Divider + Social */}
            <Animated.View entering={FadeIn.delay(450).duration(400)}>
              <Divider text="or" className="mb-6" />

              {/* Social Login Buttons */}
              <TouchableOpacity
                className="flex-row items-center justify-center rounded-xl py-4 border mb-3"
                style={{ borderColor: COLORS.neutral[200] }}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
                <Text variant="body" weight="medium" color={COLORS.neutral[600]}>
                  Continue with Google
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center justify-center rounded-xl py-4 border mb-6"
                style={{ borderColor: COLORS.neutral[200] }}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-apple" size={20} color="#000000" style={{ marginRight: 10 }} />
                <Text variant="body" weight="medium" color={COLORS.neutral[600]}>
                  Continue with Apple
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Sign Up Link */}
            <Animated.View entering={FadeIn.delay(550).duration(400)} className="items-center pb-6">
              <View className="flex-row justify-center mb-4">
                <Text variant="label" color={COLORS.neutral[400]}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text variant="label" weight="semibold" color={COLORS.primary[500]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Back to Home */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Welcome')}
                className="flex-row items-center py-2 px-4"
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
