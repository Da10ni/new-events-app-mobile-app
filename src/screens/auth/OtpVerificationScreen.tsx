import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import type { AuthStackParamList } from '../../navigation/types';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';
import { authApi } from '../../services/api/authApi';
import { setTokens } from '../../services/storage/secureStorage';
import { Text, Button } from '../../components/ui';
import { useSweetAlert } from '../../components/feedback';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function OtpVerificationScreen({ route, navigation }: Props) {
  const { email, flow } = route.params;
  const dispatch = useAppDispatch();
  const { showAlert } = useSweetAlert();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(RNTextInput | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < OTP_LENGTH) {
      inputRefs.current[index]?.focus();
    }
  }, []);

  function handleOtpChange(text: string, index: number) {
    if (text.length > 1) {
      const pasted = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pasted.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pasted.length, OTP_LENGTH - 1);
      focusInput(nextIndex);
      return;
    }

    const digit = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        focusInput(index - 1);
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  }

  async function handleVerify() {
    const code = otp.join('');

    if (code.length !== OTP_LENGTH) {
      showAlert({ type: 'warning', title: 'Invalid Code', message: 'Please enter the complete 6-digit verification code.' });
      return;
    }

    setIsSubmitting(true);

    try {
      if (flow === 'emailVerification') {
        const response = await authApi.verifyEmail({ email, otp: code });

        if (response.data?.data) {
          const { user, vendor, accessToken, refreshToken } = response.data.data as any;
          if (accessToken && refreshToken) {
            await setTokens(accessToken, refreshToken);
            dispatch(setCredentials({ user, vendor, accessToken, refreshToken }));
          }
        }

        navigation.navigate('RoleSelection');
      } else {
        await authApi.resetPassword({
          email,
          otp: code,
          newPassword: '',
        });

        showAlert({
          type: 'success',
          title: 'Password Reset',
          message: 'Your password has been reset successfully. Please log in with your new password.',
          buttons: [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
        });
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Verification failed. Please check the code and try again.';
      showAlert({ type: 'error', title: 'Verification Failed', message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;

    setCanResend(false);
    setCountdown(RESEND_COOLDOWN);
    setOtp(Array(OTP_LENGTH).fill(''));

    try {
      if (flow === 'emailVerification') {
        await authApi.forgotPassword(email);
      } else {
        await authApi.forgotPassword(email);
      }

      showAlert({ type: 'success', title: 'Code Sent', message: 'A new verification code has been sent to your email.' });
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to resend code. Please try again.';
      showAlert({ type: 'error', title: 'Error', message });
      setCanResend(true);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const isOtpComplete = otp.every((digit) => digit !== '');

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
                <Ionicons name="shield-checkmark-outline" size={36} color={COLORS.primary[500]} />
              </View>
            </Animated.View>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)} className="mb-8">
              <Text variant="h3" weight="bold" className="mb-2 text-center" color={COLORS.primary[600]}>
                Verify your email
              </Text>
              <Text variant="body" className="text-center" color={COLORS.neutral[400]}>
                We've sent a 6-digit verification code to{'\n'}
                <Text variant="body" weight="semibold" color={COLORS.neutral[500]}>
                  {email}
                </Text>
              </Text>
            </Animated.View>

            {/* OTP Input Boxes */}
            <View className="flex-row justify-center mb-8">
              {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(300 + index * 80).duration(400)}
                  className="mx-1.5"
                >
                  <RNTextInput
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    className="text-center text-xl font-bold rounded-xl"
                    style={{
                      width: 48,
                      height: 56,
                      borderWidth: 1.5,
                      borderColor: otp[index]
                        ? COLORS.primary[500]
                        : COLORS.neutral[200],
                      backgroundColor: otp[index]
                        ? COLORS.primary[50]
                        : COLORS.neutral[50],
                      color: COLORS.neutral[600],
                    }}
                    value={otp[index]}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    selectTextOnFocus
                  />
                </Animated.View>
              ))}
            </View>

            {/* Verify Button */}
            <Animated.View entering={FadeInDown.delay(700).duration(500)}>
              <Button
                title="Verify"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting || !isOtpComplete}
                onPress={handleVerify}
                className="mb-6"
              />
            </Animated.View>

            {/* Resend Code */}
            <Animated.View entering={FadeIn.delay(800).duration(400)} className="items-center">
              {canResend ? (
                <TouchableOpacity onPress={handleResend}>
                  <Text variant="label" weight="semibold" color={COLORS.primary[500]}>
                    Resend Code
                  </Text>
                </TouchableOpacity>
              ) : (
                <View className="flex-row items-center">
                  <Text variant="label" color={COLORS.neutral[400]}>
                    Resend code in{' '}
                  </Text>
                  <Text variant="label" weight="semibold" color={COLORS.neutral[500]}>
                    {formatTime(countdown)}
                  </Text>
                </View>
              )}
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
