import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import { Text } from '../components/ui';
import { COLORS } from '../theme/colors';
import { getToken, getRefreshToken, clearTokens } from '../services/storage/secureStorage';
import { userApi } from '../services/api/userApi';

import AuthNavigator from './AuthNavigator';
import ClientNavigator from './ClientNavigator';
import ProviderNavigator from './ProviderNavigator';

function SplashScreen() {
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(10);
  const spinnerOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    textOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    textTranslateY.value = withDelay(400, withTiming(0, { duration: 400 }));

    spinnerOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: spinnerOpacity.value,
  }));

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <View className="items-center">
        <Animated.View
          style={[logoStyle]}
          className="w-24 h-24 rounded-3xl items-center justify-center mb-4"
        >
          <View
            className="w-24 h-24 rounded-3xl items-center justify-center"
            style={{
              backgroundColor: COLORS.primary[500],
              shadowColor: COLORS.primary[500],
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text variant="h1" weight="bold" color="#FFFFFF">E</Text>
          </View>
        </Animated.View>

        <Animated.View style={textStyle}>
          <Text variant="h3" weight="bold" color={COLORS.neutral[600]} className="mb-6">
            EventsApp
          </Text>
        </Animated.View>

        <Animated.View style={spinnerStyle}>
          <ActivityIndicator size="large" color={COLORS.primary[400]} />
        </Animated.View>
      </View>
    </View>
  );
}

export default function RootNavigator() {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const dispatch = useAppDispatch();
  const { isAuthenticated, role, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    async function bootstrap() {
      try {
        const accessToken = await getToken();
        if (!accessToken) {
          setIsBootstrapping(false);
          return;
        }

        const refreshToken = await getRefreshToken();
        const { data } = await userApi.getProfile();
        const user = data.data.user;

        dispatch(
          setCredentials({
            user,
            vendor: (data.data as any).vendor ?? null,
            accessToken,
            refreshToken: refreshToken || '',
          })
        );
      } catch {
        await clearTokens();
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrap();
  }, []);

  if (isBootstrapping || loading) {
    return <SplashScreen />;
  }

  function renderNavigator() {
    if (!isAuthenticated) {
      return <AuthNavigator />;
    }

    if (role === 'vendor') {
      return <ProviderNavigator />;
    }

    return <ClientNavigator />;
  }

  return (
    <NavigationContainer>
      {renderNavigator()}
    </NavigationContainer>
  );
}
