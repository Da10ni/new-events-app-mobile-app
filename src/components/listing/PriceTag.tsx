import React from 'react';
import { View } from 'react-native';
import Text from '../ui/Text';
import { COLORS } from '../../theme/colors';

interface PriceTagProps {
  price: number;
  currency?: string;
  prefix?: string;
  suffix?: string;
  highlighted?: boolean;
  className?: string;
}

const formatPrice = (amount: number): string => {
  return amount.toLocaleString();
};

const PriceTag: React.FC<PriceTagProps> = ({
  price,
  currency = 'PKR',
  prefix,
  suffix,
  highlighted = false,
  className = '',
}) => {
  if (highlighted) {
    return (
      <View
        className={`flex-row items-center self-start rounded-lg bg-primary-500 px-2.5 py-1 ${className}`}
      >
        {prefix && (
          <Text variant="caption" color={COLORS.neutral[0]} className="mr-1">
            {prefix}
          </Text>
        )}
        <Text variant="label" weight="bold" color={COLORS.neutral[0]}>
          {currency} {formatPrice(price)}
        </Text>
        {suffix && (
          <Text variant="caption" color="rgba(255,255,255,0.85)" className="ml-0.5">
            {' '}{suffix}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View className={`flex-row items-baseline ${className}`}>
      {prefix && (
        <Text variant="caption" color={COLORS.neutral[400]} className="mr-1">
          {prefix}
        </Text>
      )}
      <Text variant="body" weight="bold" color={COLORS.primary[500]}>
        {currency} {formatPrice(price)}
      </Text>
      {suffix && (
        <Text variant="caption" color={COLORS.neutral[400]} className="ml-0.5">
          {' '}{suffix}
        </Text>
      )}
    </View>
  );
};

export default PriceTag;
