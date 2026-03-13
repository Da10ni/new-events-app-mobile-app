import React from 'react';
import { View, ScrollView, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';

interface SafeAreaContainerProps extends ViewProps {
  children: React.ReactNode;
  scroll?: boolean;
  backgroundColor?: string;
  padding?: boolean;
  className?: string;
}

const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({
  children,
  scroll = false,
  backgroundColor = COLORS.neutral[0],
  padding = true,
  className = '',
  style,
  ...rest
}) => {
  const content = (
    <View className={`flex-1 ${padding ? 'px-4' : ''} ${className}`} {...rest}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={[{ backgroundColor }, style]}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
};

export default SafeAreaContainer;
