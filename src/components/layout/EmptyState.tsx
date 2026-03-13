import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import Button from '../ui/Button';
import { COLORS } from '../../theme/colors';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  iconSize = 48,
  title,
  description,
  actionTitle,
  onAction,
  className = '',
}) => {
  return (
    <View className={`flex-1 items-center justify-center px-10 py-16 ${className}`}>
      <View
        className="mb-6 items-center justify-center rounded-3xl"
        style={{
          width: 88,
          height: 88,
          backgroundColor: COLORS.neutral[50],
        }}
      >
        <Ionicons name={icon} size={iconSize} color={COLORS.neutral[300]} />
      </View>

      <Text variant="h4" weight="bold" className="mb-2 text-center" color={COLORS.neutral[600]}>
        {title}
      </Text>

      {description && (
        <Text
          variant="body"
          color={COLORS.neutral[400]}
          className="mb-8 text-center"
          style={{ lineHeight: 22 }}
        >
          {description}
        </Text>
      )}

      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          variant="primary"
          size="md"
          onPress={onAction}
        />
      )}
    </View>
  );
};

export default EmptyState;
