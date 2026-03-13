import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './Text';
import { COLORS } from '../../theme/colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-500 border-primary-500',
  secondary: 'bg-secondary-500 border-secondary-500',
  outline: 'bg-transparent border-neutral-600',
  ghost: 'bg-transparent border-transparent',
};

const variantTextColors: Record<ButtonVariant, string> = {
  primary: COLORS.neutral[0],
  secondary: COLORS.neutral[0],
  outline: COLORS.neutral[600],
  ghost: COLORS.neutral[600],
};

const variantLoadingColors: Record<ButtonVariant, string> = {
  primary: COLORS.neutral[0],
  secondary: COLORS.neutral[0],
  outline: COLORS.neutral[600],
  ghost: COLORS.neutral[600],
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2',
  md: 'px-6 py-3',
  lg: 'px-8 py-4',
};

const sizeTextVariants: Record<ButtonSize, 'caption' | 'body' | 'body'> = {
  sm: 'caption',
  md: 'body',
  lg: 'body',
};

const sizeIconSizes: Record<ButtonSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading;
  const textColor = variantTextColors[variant];
  const iconSize = sizeIconSizes[size];

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      className={`
        flex-row items-center justify-center rounded-xl border-2
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : 'self-start'}
        ${isDisabled ? 'opacity-50' : 'opacity-100'}
        ${className}
      `}
      style={style}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantLoadingColors[variant]}
        />
      ) : (
        <>
          {leftIcon && (
            <View className="mr-2">
              <Ionicons name={leftIcon} size={iconSize} color={textColor} />
            </View>
          )}
          <Text
            variant={sizeTextVariants[size]}
            weight="semibold"
            color={textColor}
          >
            {title}
          </Text>
          {rightIcon && (
            <View className="ml-2">
              <Ionicons name={rightIcon} size={iconSize} color={textColor} />
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
