import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number;
  snapPoints?: number[];
  showHandle?: boolean;
  className?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  height = SCREEN_HEIGHT * 0.5,
  snapPoints,
  showHandle = true,
  className = '',
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const currentHeight = useRef(height);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeSheet();
        } else if (snapPoints && snapPoints.length > 0) {
          const currentPos = gestureState.dy;
          const closestSnap = snapPoints.reduce((prev, curr) => {
            const prevDist = Math.abs(SCREEN_HEIGHT - prev - (currentHeight.current - currentPos));
            const currDist = Math.abs(SCREEN_HEIGHT - curr - (currentHeight.current - currentPos));
            return currDist < prevDist ? curr : prev;
          });
          currentHeight.current = closestSnap;
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      openSheet();
    } else {
      closeSheet();
    }
  }, [visible]);

  const openSheet = () => {
    translateY.setValue(SCREEN_HEIGHT);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={closeSheet}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end">
          <TouchableWithoutFeedback onPress={closeSheet}>
            <Animated.View
              className="absolute inset-0 bg-black/50"
              style={{ opacity: backdropOpacity }}
            />
          </TouchableWithoutFeedback>

          <Animated.View
            className={`rounded-t-3xl bg-white ${className}`}
            style={[
              {
                height,
                transform: [{ translateY }],
              },
            ]}
          >
            {showHandle && (
              <View className="items-center pb-2 pt-3" {...panResponder.panHandlers}>
                <View className="h-1 w-10 rounded-full bg-neutral-200" />
              </View>
            )}

            <View className="flex-1">{children}</View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default BottomSheet;
