import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../ui/Text';
import { COLORS } from '../../theme/colors';

interface HeaderBarProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showMenu?: boolean;
  onMenuPress?: () => void;
  rightActions?: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    badge?: number;
  }>;
  transparent?: boolean;
  centerContent?: React.ReactNode;
  className?: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  showBack = false,
  onBackPress,
  showMenu = false,
  onMenuPress,
  rightActions = [],
  transparent = false,
  centerContent,
  className = '',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`flex-row items-center justify-between px-4 pb-2 ${
        transparent ? '' : 'bg-white border-b border-neutral-100'
      } ${className}`}
      style={{ paddingTop: insets.top + 8 }}
    >
      {/* Left section */}
      <View className="min-w-[40px] flex-row items-center">
        {showBack && (
          <TouchableOpacity
            onPress={onBackPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="items-center justify-center rounded-full bg-white/90 p-1.5"
            style={
              transparent
                ? {
                    shadowColor: COLORS.neutral[700],
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }
                : undefined
            }
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.neutral[600]} />
          </TouchableOpacity>
        )}

        {showMenu && (
          <TouchableOpacity
            onPress={onMenuPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="menu" size={26} color={COLORS.neutral[600]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Center section */}
      <View className="flex-1 items-center px-2">
        {centerContent || (
          title ? (
            <Text variant="body" weight="bold" numberOfLines={1} className="text-neutral-600">
              {title}
            </Text>
          ) : null
        )}
      </View>

      {/* Right section */}
      <View className="min-w-[40px] flex-row items-center justify-end gap-2">
        {rightActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={action.onPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="relative"
          >
            <Ionicons name={action.icon} size={24} color={COLORS.neutral[600]} />
            {action.badge !== undefined && action.badge > 0 && (
              <View className="absolute -right-1.5 -top-1.5 min-w-[16px] items-center justify-center rounded-full bg-primary-500 px-1">
                <Text variant="caption" weight="bold" color={COLORS.neutral[0]} style={{ fontSize: 10 }}>
                  {action.badge > 99 ? '99+' : action.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default HeaderBar;
