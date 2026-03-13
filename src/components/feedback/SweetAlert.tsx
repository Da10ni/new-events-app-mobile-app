import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import { COLORS } from '../../theme/colors';

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'congrats';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  type: AlertType;
  title: string;
  message: string;
  buttons?: AlertButton[];
  dismissible?: boolean;
}

interface SweetAlertContextType {
  showAlert: (config: AlertConfig) => void;
  hideAlert: () => void;
}

const SweetAlertContext = createContext<SweetAlertContextType | undefined>(undefined);

const alertThemes: Record<AlertType, {
  iconName: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  accentColor: string;
}> = {
  success: {
    iconName: 'checkmark-circle',
    iconBg: '#E8F5E9',
    iconColor: '#43A047',
    accentColor: '#43A047',
  },
  error: {
    iconName: 'close-circle',
    iconBg: '#FFEBEE',
    iconColor: '#E53935',
    accentColor: '#E53935',
  },
  warning: {
    iconName: 'warning',
    iconBg: '#FFF8E1',
    iconColor: '#FB8C00',
    accentColor: '#FB8C00',
  },
  info: {
    iconName: 'information-circle',
    iconBg: '#E3F2FD',
    iconColor: '#1E88E5',
    accentColor: '#1E88E5',
  },
  congrats: {
    iconName: 'trophy',
    iconBg: '#FFF3E0',
    iconColor: '#FF9800',
    accentColor: COLORS.primary[500],
  },
};

function AlertModal({
  config,
  visible,
  hideAlert,
}: {
  config: AlertConfig;
  visible: boolean;
  hideAlert: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.6);
      opacityAnim.setValue(0);
      backdropAnim.setValue(0);
      iconBounce.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 12,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        Animated.spring(iconBounce, {
          toValue: 1,
          damping: 8,
          stiffness: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [visible, scaleAnim, opacityAnim, backdropAnim, iconBounce]);

  const handleButtonPress = useCallback(
    (button: AlertButton) => {
      hideAlert();
      setTimeout(() => button.onPress?.(), 250);
    },
    [hideAlert],
  );

  const theme = alertThemes[config.type];
  const buttons = config.buttons || [{ text: 'OK' }];
  const canDismiss = config.dismissible !== false;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={canDismiss ? hideAlert : undefined}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={canDismiss ? hideAlert : undefined}>
        <Animated.View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: backdropAnim,
            paddingHorizontal: 28,
          }}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={{
                width: '100%',
                maxWidth: 340,
                backgroundColor: '#FFFFFF',
                borderRadius: 28,
                overflow: 'hidden',
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
                elevation: 12,
              }}
            >
              {/* Top accent line */}
              <View style={{ height: 4, backgroundColor: theme.accentColor }} />

              {/* Content */}
              <View style={{ alignItems: 'center', paddingHorizontal: 28, paddingTop: 32, paddingBottom: 8 }}>
                {/* Animated Icon */}
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: iconBounce.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                      },
                    ],
                  }}
                >
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: theme.iconBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 20,
                    }}
                  >
                    <Ionicons name={theme.iconName} size={38} color={theme.iconColor} />
                  </View>
                </Animated.View>

                {/* Title */}
                <Text
                  variant="h4"
                  weight="bold"
                  color={COLORS.neutral[700]}
                  style={{ textAlign: 'center', marginBottom: 10 }}
                >
                  {config.title}
                </Text>

                {/* Message */}
                <Text
                  variant="body"
                  color={COLORS.neutral[400]}
                  style={{ textAlign: 'center', lineHeight: 22, marginBottom: 28 }}
                >
                  {config.message}
                </Text>
              </View>

              {/* Buttons */}
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingBottom: 24,
                  flexDirection: buttons.length > 1 ? 'row' : 'column',
                  gap: 10,
                }}
              >
                {buttons.map((btn, i) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';

                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleButtonPress(btn)}
                      activeOpacity={0.7}
                      style={{
                        flex: buttons.length > 1 ? 1 : undefined,
                        paddingVertical: 14,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isCancel
                          ? COLORS.neutral[100]
                          : isDestructive
                            ? '#E53935'
                            : theme.accentColor,
                      }}
                    >
                      <Text
                        variant="label"
                        weight="bold"
                        color={isCancel ? COLORS.neutral[500] : '#FFFFFF'}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export const SweetAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((alertConfig: AlertConfig) => {
    setConfig(alertConfig);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    setConfig(null);
  }, []);

  return (
    <SweetAlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {config != null && (
        <AlertModal config={config} visible={visible} hideAlert={hideAlert} />
      )}
    </SweetAlertContext.Provider>
  );
};

export const useSweetAlert = (): SweetAlertContextType => {
  const context = useContext(SweetAlertContext);
  if (!context) {
    throw new Error('useSweetAlert must be used within a SweetAlertProvider');
  }
  return context;
};

export default SweetAlertProvider;
