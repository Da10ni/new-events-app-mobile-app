import React from 'react';
import { View, TouchableOpacity, type ViewProps } from 'react-native';
import { COLORS } from '../../theme/colors';

type PaddingVariant = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: PaddingVariant;
  onPress?: () => void;
  className?: string;
}

const paddingClasses: Record<PaddingVariant, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  onPress,
  className = '',
  style,
  ...rest
}) => {
  const baseClasses = `
    rounded-xl bg-white
    ${paddingClasses[padding]}
    ${className}
  `;

  const cardStyle = {
    borderWidth: 1,
    borderColor: COLORS.neutral[100],
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        className={baseClasses}
        style={[cardStyle, style]}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseClasses} style={[cardStyle, style]} {...rest}>
      {children}
    </View>
  );
};

export default Card;
