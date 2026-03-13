import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './Text';
import { COLORS } from '../../theme/colors';

type ChipVariant = 'filled' | 'outlined';

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  closable?: boolean;
  onPress?: () => void;
  onClose?: () => void;
  className?: string;
}

const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'filled',
  selected = false,
  icon,
  closable = false,
  onPress,
  onClose,
  className = '',
}) => {
  const getContainerClasses = (): string => {
    if (variant === 'filled') {
      return selected
        ? 'border-primary-500'
        : 'bg-neutral-50 border-neutral-50';
    }
    return selected
      ? 'bg-transparent border-primary-500'
      : 'bg-transparent border-neutral-200';
  };

  const getContainerStyle = () => {
    if (variant === 'filled' && selected) {
      return { backgroundColor: COLORS.primary[500], borderColor: COLORS.primary[500] };
    }
    if (variant === 'outlined' && selected) {
      return { backgroundColor: COLORS.primary[50], borderColor: COLORS.primary[500] };
    }
    return {};
  };

  const getTextColor = (): string => {
    if (variant === 'filled') {
      return selected ? COLORS.neutral[0] : COLORS.neutral[500];
    }
    return selected ? COLORS.primary[600] : COLORS.neutral[400];
  };

  const textColor = getTextColor();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={!onPress}
      className={`
        flex-row items-center self-start rounded-full border px-3.5 py-2
        ${getContainerClasses()}
        ${className}
      `}
      style={getContainerStyle()}
    >
      {icon && (
        <View className="mr-1.5">
          <Ionicons name={icon} size={16} color={textColor} />
        </View>
      )}

      <Text variant="label" weight={selected ? 'semibold' : 'medium'} color={textColor}>
        {label}
      </Text>

      {closable && (
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="ml-1.5"
        >
          <Ionicons name="close-circle" size={16} color={textColor} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default Chip;
