import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TouchableOpacity,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './Text';
import { COLORS } from '../../theme/colors';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (
    {
      label,
      leftIcon,
      rightIcon,
      onRightIconPress,
      error,
      disabled = false,
      multiline = false,
      className = '',
      containerClassName = '',
      style,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const borderColor = error
      ? 'border-error'
      : isFocused
      ? 'border-primary-500'
      : 'border-neutral-200';

    const bgColor = disabled ? 'bg-neutral-50' : 'bg-white';

    return (
      <View className={`mb-4 ${containerClassName}`}>
        {label && (
          <Text variant="label" weight="medium" className="mb-1.5 text-neutral-500">
            {label}
          </Text>
        )}

        <View
          className={`
            flex-row items-center rounded-xl border-2
            ${borderColor}
            ${bgColor}
            ${multiline ? 'min-h-[100px] items-start' : 'h-[52px]'}
            px-4
          `}
        >
          {leftIcon && (
            <View className="mr-3">
              <Ionicons
                name={leftIcon}
                size={20}
                color={isFocused ? COLORS.primary[500] : COLORS.neutral[300]}
              />
            </View>
          )}

          <RNTextInput
            ref={ref}
            editable={!disabled}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
            placeholderTextColor={COLORS.neutral[300]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`
              flex-1 text-[16px] text-neutral-600
              ${multiline ? 'py-3' : ''}
              ${className}
            `}
            style={style}
            {...rest}
          />

          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
              className="ml-3"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={rightIcon}
                size={20}
                color={isFocused ? COLORS.primary[500] : COLORS.neutral[300]}
              />
            </TouchableOpacity>
          )}
        </View>

        {error && (
          <View className="mt-1.5 flex-row items-center">
            <Ionicons name="alert-circle" size={14} color={COLORS.error} />
            <Text variant="caption" color={COLORS.error} className="ml-1">
              {error}
            </Text>
          </View>
        )}
      </View>
    );
  }
);

TextInput.displayName = 'TextInput';

export default TextInput;
