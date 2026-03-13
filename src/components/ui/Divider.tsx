import React from 'react';
import { View } from 'react-native';
import Text from './Text';
import { COLORS } from '../../theme/colors';

interface DividerProps {
  direction?: 'horizontal' | 'vertical';
  text?: string;
  color?: string;
  thickness?: number;
  className?: string;
}

const Divider: React.FC<DividerProps> = ({
  direction = 'horizontal',
  text,
  color = COLORS.neutral[100],
  thickness = 1,
  className = '',
}) => {
  if (direction === 'vertical') {
    return (
      <View
        className={`self-stretch ${className}`}
        style={{
          width: thickness,
          backgroundColor: color,
        }}
      />
    );
  }

  if (text) {
    return (
      <View className={`flex-row items-center ${className}`}>
        <View
          className="flex-1"
          style={{ height: thickness, backgroundColor: color }}
        />
        <Text variant="caption" color={COLORS.neutral[300]} className="mx-3">
          {text}
        </Text>
        <View
          className="flex-1"
          style={{ height: thickness, backgroundColor: color }}
        />
      </View>
    );
  }

  return (
    <View
      className={`w-full ${className}`}
      style={{ height: thickness, backgroundColor: color }}
    />
  );
};

export default Divider;
