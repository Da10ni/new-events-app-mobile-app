import React from 'react';
import { View, ActivityIndicator, Modal } from 'react-native';
import Text from '../ui/Text';
import { COLORS } from '../../theme/colors';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  useModal?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message,
  useModal = true,
}) => {
  if (!visible) return null;

  const content = (
    <View className="flex-1 items-center justify-center bg-black/50">
      <View className="items-center rounded-2xl bg-white px-10 py-8">
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
        {message && (
          <Text variant="label" weight="medium" className="mt-4 text-neutral-500">
            {message}
          </Text>
        )}
      </View>
    </View>
  );

  if (useModal) {
    return (
      <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
        {content}
      </Modal>
    );
  }

  return (
    <View className="absolute inset-0 z-50">
      {content}
    </View>
  );
};

export default LoadingOverlay;
