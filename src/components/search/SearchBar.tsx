import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import { COLORS } from '../../theme/colors';

const PLACEHOLDER_HINTS = [
  'Search "wedding venues"',
  'Search "catering in Lahore"',
  'Search "photographer"',
  'Search "decor services"',
  'Search "DJ & music"',
  'Search "marquee Karachi"',
];

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value?: string;
  onChangeText?: (text: string) => void;
  onClear?: () => void;
  onSubmit?: (text: string) => void;
  pressable?: boolean;
  onPressablePress?: () => void;
  placeholder?: string;
  animatePlaceholder?: boolean;
  rounded?: 'full' | 'xl';
  showShadow?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value = '',
  onChangeText,
  onClear,
  onSubmit,
  pressable = false,
  onPressablePress,
  placeholder,
  animatePlaceholder = false,
  rounded = 'full',
  showShadow = true,
  className = '',
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [hintIndex, setHintIndex] = useState(0);

  // Rotate placeholder hints when idle (no text and not focused)
  useEffect(() => {
    if (!animatePlaceholder || isFocused || value.length > 0) return;
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % PLACEHOLDER_HINTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [animatePlaceholder, isFocused, value]);

  const currentPlaceholder = animatePlaceholder && !isFocused && value.length === 0
    ? PLACEHOLDER_HINTS[hintIndex]
    : placeholder || 'Search events, venues...';

  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-xl';

  const shadowStyle = {};

  const borderColor = isFocused ? 'border-primary-500' : 'border-neutral-100';

  if (pressable) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPressablePress}
        className={`flex-row items-center border bg-white px-4 py-3.5 ${roundedClass} ${borderColor} ${className}`}
        style={shadowStyle}
      >
        <Ionicons name="search" size={20} color={COLORS.neutral[300]} />
        <Text variant="body" color={COLORS.neutral[300]} className="ml-3 flex-1">
          {currentPlaceholder}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      className={`flex-row items-center border bg-white px-4 ${roundedClass} ${borderColor} ${className}`}
      style={shadowStyle}
    >
      <Ionicons name="search" size={20} color={isFocused ? COLORS.primary[500] : COLORS.neutral[300]} />

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={currentPlaceholder}
        placeholderTextColor={COLORS.neutral[300]}
        returnKeyType="search"
        onSubmitEditing={() => onSubmit?.(value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="ml-3 flex-1 py-3.5 text-[16px] text-neutral-600"
        {...rest}
      />

      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onChangeText?.('');
            onClear?.();
            inputRef.current?.focus();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="ml-2"
        >
          <View className="items-center justify-center rounded-full bg-neutral-300 p-0.5">
            <Ionicons name="close" size={14} color={COLORS.neutral[0]} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;
