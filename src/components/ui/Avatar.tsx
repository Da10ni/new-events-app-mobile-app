import React, { useState } from 'react';
import { View, Image } from 'react-native';
import Text from './Text';
import { COLORS } from '../../theme/colors';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string | null;
  firstName?: string;
  lastName?: string;
  size?: AvatarSize;
  border?: boolean;
  online?: boolean;
  className?: string;
}

const sizeMap: Record<AvatarSize, { container: number; text: 'caption' | 'caption' | 'label' | 'body' | 'h4'; dot: number }> = {
  xs: { container: 24, text: 'caption', dot: 8 },
  sm: { container: 32, text: 'caption', dot: 10 },
  md: { container: 40, text: 'label', dot: 12 },
  lg: { container: 56, text: 'body', dot: 14 },
  xl: { container: 80, text: 'h4', dot: 18 },
};

const bgColors = [
  COLORS.primary[500],
  COLORS.secondary[500],
  COLORS.success,
  COLORS.warning,
  COLORS.info,
  '#023012',
  '#085A45',
];

const getColorFromName = (firstName: string, lastName: string): string => {
  const combined = `${firstName}${lastName}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
};

const Avatar: React.FC<AvatarProps> = ({
  source,
  firstName = '',
  lastName = '',
  size = 'md',
  border = false,
  online = false,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const { container, text, dot } = sizeMap[size];
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const showImage = source && !imageError;
  const bgColor = getColorFromName(firstName, lastName);

  return (
    <View
      className={`items-center justify-center overflow-hidden rounded-full ${className}`}
      style={[
        {
          width: container,
          height: container,
          backgroundColor: showImage ? COLORS.neutral[100] : bgColor,
        },
        border && {
          borderWidth: 2,
          borderColor: COLORS.neutral[0],
        },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: source }}
          style={{ width: container, height: container }}
          onError={() => setImageError(true)}
          className="rounded-full"
        />
      ) : (
        <Text variant={text} weight="semibold" color={COLORS.neutral[0]}>
          {initials || '?'}
        </Text>
      )}

      {online && (
        <View
          className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-success"
          style={{
            width: dot,
            height: dot,
          }}
        />
      )}
    </View>
  );
};

export default Avatar;
