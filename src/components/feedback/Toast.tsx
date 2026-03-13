import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { View, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import { COLORS } from '../../theme/colors';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastConfig: Record<ToastType, { bg: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }> = {
  success: { bg: 'bg-success', icon: 'checkmark-circle', iconColor: COLORS.neutral[0] },
  error: { bg: 'bg-error', icon: 'alert-circle', iconColor: COLORS.neutral[0] },
  info: { bg: 'bg-info', icon: 'information-circle', iconColor: COLORS.neutral[0] },
  warning: { bg: 'bg-warning', icon: 'warning', iconColor: COLORS.neutral[0] },
};

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  topOffset: number;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss, topOffset }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const config = toastConfig[toast.type];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: topOffset,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      dismiss();
    }, toast.duration || 3000);

    return () => clearTimeout(timeout);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  return (
    <Animated.View
      className="absolute left-4 right-4 z-[9999]"
      style={{
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={dismiss}
        className={`flex-row items-center rounded-xl px-4 py-3.5 ${config.bg}`}
        style={{
          shadowColor: COLORS.neutral[700],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Ionicons name={config.icon} size={22} color={config.iconColor} />
        <Text
          variant="label"
          weight="medium"
          color={COLORS.neutral[0]}
          className="ml-3 flex-1"
          numberOfLines={2}
        >
          {toast.message}
        </Text>
        <View className="ml-2">
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const insets = useSafeAreaInsets();

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View className="absolute left-0 right-0 top-0 z-[9999]" pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
            topOffset={insets.top + 8 + index * 60}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
