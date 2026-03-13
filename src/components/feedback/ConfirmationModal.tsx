import React from 'react';
import { View, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import Button from '../ui/Button';
import { COLORS } from '../../theme/colors';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  icon,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <TouchableWithoutFeedback>
            <View
              className="w-full max-w-[340px] rounded-2xl bg-white px-6 py-7"
              style={{
                shadowColor: COLORS.neutral[700],
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              {icon && (
                <View className="mb-4 items-center">
                  <View
                    className={`items-center justify-center rounded-full p-3 ${
                      destructive ? 'bg-error-light' : 'bg-primary-50'
                    }`}
                  >
                    <Ionicons
                      name={icon}
                      size={32}
                      color={destructive ? COLORS.error : COLORS.primary[500]}
                    />
                  </View>
                </View>
              )}

              <Text variant="h4" weight="bold" className="mb-2 text-center text-neutral-600">
                {title}
              </Text>

              <Text variant="body" color={COLORS.neutral[400]} className="mb-6 text-center">
                {message}
              </Text>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    title={cancelText}
                    variant="outline"
                    size="md"
                    fullWidth
                    onPress={onCancel}
                    disabled={loading}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    title={confirmText}
                    variant={destructive ? 'primary' : 'primary'}
                    size="md"
                    fullWidth
                    onPress={onConfirm}
                    loading={loading}
                    className={destructive ? 'bg-error border-error' : ''}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ConfirmationModal;
