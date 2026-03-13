import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import Badge from '../ui/Badge';
import { COLORS } from '../../theme/colors';

interface RatingDisplayProps {
  rating: number;
  reviewCount: number;
  size?: 'sm' | 'md';
  className?: string;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  reviewCount,
  size = 'sm',
  className = '',
}) => {
  if (reviewCount === 0) {
    return (
      <View className={`flex-row items-center ${className}`}>
        <Badge text="New" variant="success" />
      </View>
    );
  }

  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <View className={`flex-row items-center ${className}`}>
      <Ionicons name="star" size={iconSize} color={COLORS.primary[500]} />
      <Text
        variant={size === 'sm' ? 'caption' : 'label'}
        weight="semibold"
        className="ml-1 text-neutral-600"
      >
        {rating.toFixed(1)}
      </Text>
      <Text
        variant={size === 'sm' ? 'caption' : 'label'}
        color={COLORS.neutral[400]}
        className="ml-0.5"
      >
        ({reviewCount})
      </Text>
    </View>
  );
};

export default RatingDisplay;
