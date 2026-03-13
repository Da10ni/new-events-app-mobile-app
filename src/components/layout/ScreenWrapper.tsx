import React from 'react';
import { View, ScrollView, ActivityIndicator, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, type StatusBarStyle } from 'expo-status-bar';
import Text from '../ui/Text';
import { COLORS } from '../../theme/colors';
import { LAYOUT } from '../../config/constants';

interface ScreenWrapperProps extends ViewProps {
  children: React.ReactNode;
  scroll?: boolean;
  loading?: boolean;
  loadingMessage?: string;
  backgroundColor?: string;
  statusBarStyle?: StatusBarStyle;
  padding?: boolean;
  tabScreen?: boolean;
  className?: string;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scroll = false,
  loading = false,
  loadingMessage,
  backgroundColor = COLORS.background.primary,
  statusBarStyle = 'dark',
  padding = true,
  tabScreen = false,
  className = '',
  style,
  ...rest
}) => {
  const bottomPadding = tabScreen ? LAYOUT.SCREEN_BOTTOM_PADDING : 0;

  const content = (
    <View className={`flex-1 ${padding ? 'px-4' : ''} ${className}`} {...rest}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={[{ backgroundColor }, style]}>
      <StatusBar style={statusBarStyle} />

      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomPadding }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}

      {loading && (
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <View className="items-center rounded-2xl bg-white px-8 py-6">
            <ActivityIndicator size="large" color={COLORS.primary[500]} />
            {loadingMessage && (
              <Text variant="label" weight="medium" className="mt-3" color={COLORS.neutral[500]}>
                {loadingMessage}
              </Text>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ScreenWrapper;
