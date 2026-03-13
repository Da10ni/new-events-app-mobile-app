import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import ListingCard from './ListingCard';
import { COLORS } from '../../theme/colors';
import { type Listing } from '../../types';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface ListingsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  listings: Listing[];
  favoriteIds: Set<string>;
  onListingPress: (listingId: string) => void;
  onFavoriteToggle: (listingId: string, isFavorite: boolean) => void;
}

const ListingsBottomSheet: React.FC<ListingsBottomSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  listings,
  favoriteIds,
  onListingPress,
  onFavoriteToggle,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 200,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const renderItem = ({ item, index }: { item: Listing; index: number }) => (
    <View className={index % 2 === 0 ? 'pr-2' : 'pl-2'} style={{ width: '50%' }}>
      <ListingCard
        listing={item}
        width={CARD_WIDTH}
        onPress={() => onListingPress(item._id)}
        isFavorite={favoriteIds.has(item._id)}
        onFavoriteToggle={(fav) => onFavoriteToggle(item._id, fav)}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <TouchableOpacity
          className="h-16"
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          className="flex-1 rounded-t-3xl bg-white"
          style={{
            transform: [{ translateY: slideAnim }],
            paddingTop: Platform.OS === 'ios' ? 8 : 8,
          }}
        >
          {/* Drag handle */}
          <View className="items-center py-3">
            <View className="h-1 w-10 rounded-full bg-neutral-200" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-neutral-100 px-5 pb-4">
            <View className="flex-1">
              <Text variant="h3" weight="bold" color={COLORS.neutral[600]}>
                {title}
              </Text>
              {subtitle && (
                <Text variant="caption" color={COLORS.neutral[400]} className="mt-0.5">
                  {subtitle}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleClose}
              className="items-center justify-center rounded-full bg-neutral-50"
              style={{ width: 36, height: 36 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={COLORS.neutral[500]} />
            </TouchableOpacity>
          </View>

          {/* Listings grid */}
          <FlatList
            data={listings}
            renderItem={renderItem}
            keyExtractor={(item) => `sheet-${item._id}`}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            columnWrapperStyle={{ marginBottom: 16 }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ListingsBottomSheet;
