import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './Text';
import { COLORS } from '../../theme/colors';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
  reviewCount?: number;
  color?: string;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 18,
  interactive = false,
  onRatingChange,
  showValue = false,
  reviewCount,
  color = COLORS.primary[500],
  className = '',
}) => {
  const handlePress = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  const renderStar = (index: number) => {
    const diff = rating - index;
    let iconName: keyof typeof Ionicons.glyphMap;

    if (diff >= 1) {
      iconName = 'star';
    } else if (diff >= 0.5) {
      iconName = 'star-half';
    } else {
      iconName = 'star-outline';
    }

    const starElement = (
      <Ionicons
        key={index}
        name={iconName}
        size={size}
        color={diff > 0 ? color : COLORS.neutral[200]}
      />
    );

    if (interactive) {
      return (
        <TouchableOpacity
          key={index}
          onPress={() => handlePress(index)}
          hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
          className="mr-0.5"
        >
          {starElement}
        </TouchableOpacity>
      );
    }

    return (
      <View key={index} className="mr-0.5">
        {starElement}
      </View>
    );
  };

  const stars = Array.from({ length: maxRating }, (_, i) => i);

  return (
    <View className={`flex-row items-center ${className}`}>
      {stars.map(renderStar)}

      {showValue && (
        <Text variant="label" weight="semibold" className="ml-1.5 text-neutral-600">
          {rating.toFixed(1)}
        </Text>
      )}

      {reviewCount !== undefined && (
        <Text variant="caption" color={COLORS.neutral[400]} className="ml-1">
          ({reviewCount})
        </Text>
      )}
    </View>
  );
};

export default StarRating;
