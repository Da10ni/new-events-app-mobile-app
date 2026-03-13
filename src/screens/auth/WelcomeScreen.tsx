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
      <View className="flex-1 px-6">
        {/* Logo & Brand */}
        <Animated.View entering={ZoomIn.duration(500)} className="items-center mt-12 mb-8">
          <View
            className="w-24 h-24 rounded-3xl items-center justify-center mb-4"
            style={{
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
          <Text variant="h2" weight="bold" color={COLORS.neutral[600]}>
            EventsApp
          </Text>
        </Animated.View>

        {/* Hero Illustration Area */}
        <Animated.View
          entering={FadeIn.delay(200).duration(600)}
          className="flex-1 rounded-3xl items-center justify-center mb-8"
          style={{ backgroundColor: COLORS.primary[50], maxHeight: 280 }}
        >
          <View className="items-center">
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
        <Animated.View entering={FadeInDown.delay(400).duration(500)} className="items-center mb-8">
          <Text variant="h3" weight="bold" className="text-center mb-3" color={COLORS.primary[600]}>
            Welcome to EventsApp
          </Text>
          <Text variant="body" className="text-center px-4" color={COLORS.neutral[400]}>
            Discover and book the best event services for your special occasions.
            From photographers to caterers, find everything you need.
          </Text>
        </Animated.View>

        {/* CTA Buttons */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)} className="mb-4">
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

        {/* Terms */}
        <Animated.View entering={FadeIn.delay(800).duration(400)} className="items-center pb-4">
          <Text variant="caption" className="text-center" color={COLORS.neutral[300]}>
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
      </ScrollView>
    </SafeAreaView>
  );
}
