import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import { COLORS } from '../../theme/colors';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText = 'See All',
  onActionPress,
  className = '',
}) => {
  return (
    <View className={`mb-3 ${className}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text variant="h4" weight="bold" color={COLORS.neutral[600]}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="caption" color={COLORS.neutral[300]} className="mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>

        {onActionPress && (
          <TouchableOpacity
            onPress={onActionPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="flex-row items-center rounded-full px-3 py-1.5"
            style={{ backgroundColor: COLORS.primary[50] }}
          >
            <Text variant="caption" weight="bold" color={COLORS.primary[500]}>
              {actionText}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={COLORS.primary[500]}
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default SectionHeader;
