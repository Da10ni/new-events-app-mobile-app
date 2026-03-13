import React, { useEffect, useRef } from 'react';
import { View, Animated, type ViewStyle } from 'react-native';
import { COLORS } from '../../theme/colors';

type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: ViewStyle;
}

const variantDefaults: Record<SkeletonVariant, { width: number | string; height: number | string; borderRadius: number }> = {
  text: { width: '100%', height: 16, borderRadius: 8 },
  circle: { width: 40, height: 40, borderRadius: 9999 },
  rect: { width: '100%', height: 120, borderRadius: 12 },
  card: { width: '100%', height: 200, borderRadius: 12 },
};

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  className = '',
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulseAnim]);

  const defaults = variantDefaults[variant];

  return (
    <View className={className}>
      <Animated.View
        style={[
          {
            width: width ?? defaults.width,
            height: height ?? defaults.height,
            borderRadius: defaults.borderRadius,
            backgroundColor: COLORS.neutral[100],
            opacity: pulseAnim,
          },
          style,
        ]}
      />
    </View>
  );
};

export default Skeleton;
