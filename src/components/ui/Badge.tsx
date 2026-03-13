import React from 'react';
import { View } from 'react-native';
import Text from './Text';
import { COLORS } from '../../theme/colors';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  text?: string;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  default: { bg: 'bg-neutral-50', text: COLORS.neutral[500], dot: 'bg-neutral-500' },
  success: { bg: 'bg-secondary-50', text: COLORS.success, dot: 'bg-success' },
  warning: { bg: 'bg-warning-light', text: COLORS.warning, dot: 'bg-warning' },
  error: { bg: 'bg-error-light', text: COLORS.error, dot: 'bg-error' },
  info: { bg: 'bg-info-light', text: COLORS.info, dot: 'bg-info' },
};

const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  dot = false,
  className = '',
}) => {
  const styles = variantStyles[variant];

  return (
    <View
      className={`flex-row items-center self-start rounded-full px-2.5 py-1 ${styles.bg} ${className}`}
    >
      {dot && (
        <View className={`mr-1.5 h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      )}
      {text && (
        <Text variant="caption" weight="semibold" color={styles.text}>
          {text}
        </Text>
      )}
    </View>
  );
};

export default Badge;
