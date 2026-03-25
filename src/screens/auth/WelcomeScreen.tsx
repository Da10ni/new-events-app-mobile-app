import React from 'react';
import { View, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import type { AuthStackParamList } from '../../navigation/types';
import { Text, Button } from '../../components/ui';
import { COLORS } from '../../theme/colors';

type WelcomeNav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeNav>();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background.primary} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
      <View className="flex-1 px-6" style={{ justifyContent: 'space-between' }}>
        {/* Top Content */}
        <View>
          {/* Logo & Brand */}
          <View style={{ alignItems: 'center', marginTop: 48, marginBottom: 20 }}>
            <Animated.View entering={ZoomIn.duration(500)} style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  backgroundColor: COLORS.primary[500],
                  shadowColor: COLORS.primary[500],
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Ionicons name="calendar" size={44} color={COLORS.neutral[0]} />
              </View>
            </Animated.View>
            <Text variant="h2" weight="bold" color={COLORS.neutral[600]} style={{ textAlign: 'center' }}>
              EventsApp
            </Text>
          </View>

          {/* Hero Illustration Area */}
          <Animated.View
            entering={FadeIn.delay(200).duration(600)}
            className="rounded-3xl"
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.primary[50],
              maxHeight: 240,
              flex: 1,
              marginBottom: 20,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <View className="flex-row mb-4">
                <View
                  className="w-16 h-16 rounded-2xl items-center justify-center mx-2"
                  style={{ backgroundColor: COLORS.primary[100] }}
                >
                  <Ionicons name="musical-notes" size={28} color={COLORS.primary[500]} />
                </View>
                <View
                  className="w-16 h-16 rounded-2xl items-center justify-center mx-2"
                  style={{ backgroundColor: COLORS.secondary[100] }}
                >
                  <Ionicons name="camera" size={28} color={COLORS.secondary[500]} />
                </View>
                <View
                  className="w-16 h-16 rounded-2xl items-center justify-center mx-2"
                  style={{ backgroundColor: COLORS.primary[100] }}
                >
                  <Ionicons name="restaurant" size={28} color={COLORS.primary[500]} />
                </View>
              </View>
              <View className="flex-row">
                <View
                  className="w-16 h-16 rounded-2xl items-center justify-center mx-2"
                  style={{ backgroundColor: COLORS.secondary[100] }}
                >
                  <Ionicons name="flower" size={28} color={COLORS.secondary[500]} />
                </View>
                <View
                  className="w-16 h-16 rounded-2xl items-center justify-center mx-2"
                  style={{ backgroundColor: COLORS.primary[100] }}
                >
                  <Ionicons name="sparkles" size={28} color={COLORS.primary[500]} />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Headline & Description */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text variant="h3" weight="bold" style={{ textAlign: 'center', marginBottom: 8 }} color={COLORS.primary[600]}>
              Welcome to EventsApp
            </Text>
            <Text variant="body" style={{ textAlign: 'center', paddingHorizontal: 16 }} color={COLORS.neutral[400]}>
              Discover and book the best event services for your special occasions.
              From photographers to caterers, find everything you need.
            </Text>
          </Animated.View>
        </View>

        {/* Bottom: CTA Buttons + Terms */}
        <View style={{ paddingBottom: 16 }}>
          <Animated.View entering={FadeInDown.delay(600).duration(500)} style={{ marginBottom: 12 }}>
            <Button
              title="Continue with Email"
              variant="primary"
              size="lg"
              fullWidth
              leftIcon="mail-outline"
              onPress={() => navigation.navigate('Login')}
              className="mb-3"
            />
            <Button
              title="Create an Account"
              variant="outline"
              size="lg"
              fullWidth
              onPress={() => navigation.navigate('Register')}
            />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(800).duration(400)} style={{ alignItems: 'center' }}>
            <Text variant="caption" style={{ textAlign: 'center' }} color={COLORS.neutral[300]}>
              By continuing, you agree to our{' '}
              <Text variant="caption" color={COLORS.neutral[400]} style={{ textDecorationLine: 'underline' }}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text variant="caption" color={COLORS.neutral[400]} style={{ textDecorationLine: 'underline' }}>
                Privacy Policy
              </Text>
            </Text>
          </Animated.View>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
