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
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import type { AuthStackParamList } from '../../navigation/types';
import { authApi } from '../../services/api/authApi';
import { Text, TextInput, Button } from '../../components/ui';
import { useSweetAlert } from '../../components/feedback';
import { COLORS } from '../../theme/colors';

type ForgotPasswordNav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordNav>();
  const { showAlert } = useSweetAlert();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  function validate(): boolean {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  }

  async function handleSendCode() {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await authApi.forgotPassword(email.trim().toLowerCase());

      navigation.navigate('OtpVerification', {
        email: email.trim().toLowerCase(),
        flow: 'passwordReset',
      });
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to send reset code. Please try again.';
      showAlert({ type: 'error', title: 'Error', message });
    } finally {
      setIsSubmitting(false);
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
            {/* Icon */}
            <Animated.View entering={ZoomIn.duration(500)} className="items-center mb-8">
              <View
                className="w-20 h-20 rounded-full items-center justify-center"
                style={{ backgroundColor: COLORS.primary[50] }}
              >
                <Ionicons name="lock-open-outline" size={36} color={COLORS.primary[500]} />
              </View>
            </Animated.View>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)} className="mb-6">
              <Text variant="h3" weight="bold" className="mb-2 text-center" color={COLORS.primary[600]}>
                Forgot your password?
              </Text>
              <Text variant="body" className="text-center" color={COLORS.neutral[400]}>
                No worries! Enter the email address associated with your account and
                we'll send you a verification code to reset your password.
              </Text>
            </Animated.View>

            {/* Email Input */}
            <Animated.View entering={FadeInDown.delay(350).duration(500)}>
              <TextInput
                label="Email Address"
                leftIcon="mail-outline"
                placeholder="your@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                containerClassName="mb-6"
              />
            </Animated.View>

            {/* Send Code Button */}
            <Animated.View entering={FadeInDown.delay(450).duration(500)}>
              <Button
                title="Send Reset Code"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting}
                onPress={handleSendCode}
                className="mb-6"
              />
            </Animated.View>

            {/* Back to Login */}
            <Animated.View entering={FadeIn.delay(550).duration(400)}>
              <TouchableOpacity
                className="flex-row items-center justify-center"
                onPress={() => navigation.navigate('Login')}
              >
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color={COLORS.neutral[400]}
                  style={{ marginRight: 6 }}
                />
                <Text variant="label" weight="medium" color={COLORS.neutral[400]}>
                  Back to Log In
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
