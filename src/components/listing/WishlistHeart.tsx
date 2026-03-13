import React, { useRef, useCallback, useState } from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { favoriteApi } from '../../services/api/favoriteApi';
import { showToast } from '../../store/slices/uiSlice';
import { COLORS } from '../../theme/colors';

interface WishlistHeartProps {
  listingId: string;
  isFavorite?: boolean;
  onToggle?: (isFavorite: boolean) => void;
  size?: number;
  className?: string;
}

const WishlistHeart: React.FC<WishlistHeartProps> = ({
  listingId,
  isFavorite = false,
  onToggle,
  size = 24,
  className = '',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [busy, setBusy] = useState(false);

  const handlePress = useCallback(async () => {
    if (!isAuthenticated) {
      dispatch(showToast({ message: 'Please log in to save favorites', type: 'info' }));
      return;
    }

    if (busy) return;

    // Optimistic: toggle UI immediately
    const newState = !isFavorite;
    onToggle?.(newState);

    // Animate
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.4, useNativeDriver: true, speed: 50, bounciness: 12 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();

    // API call in background
    setBusy(true);
    try {
      if (isFavorite) {
        await favoriteApi.remove(listingId);
        dispatch(showToast({ message: 'Removed from wishlist', type: 'info' }));
      } else {
        await favoriteApi.add(listingId);
        dispatch(showToast({ message: 'Added to wishlist', type: 'success' }));
      }
    } catch {
      // Revert on failure
      onToggle?.(isFavorite);
      dispatch(showToast({ message: 'Failed to update wishlist', type: 'error' }));
    } finally {
      setBusy(false);
    }
  }, [listingId, isFavorite, isAuthenticated, dispatch, onToggle, scaleAnim, busy]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.7}
      className={className}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={size}
          color={isFavorite ? '#FF3B5C' : COLORS.neutral[0]}
          style={
            !isFavorite
              ? {
                  textShadowColor: 'rgba(0,0,0,0.6)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }
              : undefined
          }
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default WishlistHeart;
