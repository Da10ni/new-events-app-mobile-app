import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store/hooks';
import Text from '../ui/Text';
import { COLORS } from '../../theme/colors';

interface NotificationBellProps {
  onPress: () => void;
  size?: number;
  color?: string;
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  onPress,
  size = 24,
  color = COLORS.neutral[600],
  className = '',
}) => {
  const unreadCount = useAppSelector((state) => state.notification.unreadCount);

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className={`relative ${className}`}
    >
      <Ionicons
        name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
        size={size}
        color={color}
      />

      {unreadCount > 0 && (
        <View className="absolute -right-1.5 -top-1.5 min-w-[18px] items-center justify-center rounded-full bg-primary-500 px-1 py-0.5">
          <Text
            variant="caption"
            weight="bold"
            color={COLORS.neutral[0]}
            style={{ fontSize: 10, lineHeight: 12 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default NotificationBell;
