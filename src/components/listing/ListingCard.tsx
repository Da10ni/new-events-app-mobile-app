import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Platform,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import WishlistHeart from './WishlistHeart';
import { COLORS } from '../../theme/colors';
import { type Listing } from '../../types';

interface ListingCardProps {
  listing: Listing;
  onPress?: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (isFavorite: boolean) => void;
  width?: number;
  variant?: 'default' | 'featured';
  className?: string;
}

const SHADOW = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: { elevation: 3 },
  default: {},
});

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPress,
  isFavorite = false,
  onFavoriteToggle,
  width,
  variant = 'default',
  className = '',
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const cardWidth = width ?? Dimensions.get('window').width - 32;
  const imageHeight = variant === 'featured' ? cardWidth * 0.72 : cardWidth * 0.7;

  const primaryImage = listing.images.find((img) => img.isPrimary) || listing.images[0];
  const images = listing.images.length > 0 ? listing.images : [];

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
      setActiveImageIndex(index);
    },
    [cardWidth]
  );

  const priceText = `${listing.pricing.currency || 'PKR'} ${listing.pricing.basePrice.toLocaleString()}`;
  const priceUnit = listing.pricing.priceUnit || 'event';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className={`overflow-hidden rounded-2xl bg-white ${className}`}
      style={{ width: cardWidth, ...SHADOW }}
    >
      {/* Image section */}
      <View className="relative overflow-hidden rounded-2xl" style={{ height: imageHeight }}>
        {images.length > 1 ? (
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            bounces={false}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={{ width: cardWidth, height: imageHeight }}
                resizeMode="cover"
              />
            )}
          />
        ) : primaryImage ? (
          <Image
            source={{ uri: primaryImage.url }}
            style={{ width: cardWidth, height: imageHeight }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="items-center justify-center"
            style={{ width: cardWidth, height: imageHeight, backgroundColor: COLORS.neutral[50] }}
          >
            <Ionicons name="image-outline" size={40} color={COLORS.neutral[200]} />
          </View>
        )}

        {/* Bottom gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: imageHeight * 0.5,
          }}
        />

        {/* Wishlist heart */}
        <View className="absolute right-3 top-3">
          <WishlistHeart
            listingId={listing._id}
            isFavorite={isFavorite}
            onToggle={onFavoriteToggle}
          />
        </View>

        {/* Category badge - frosted glass */}
        {listing.category && (
          <View
            className="absolute left-3 top-3 rounded-full px-2.5 py-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
          >
            <Text variant="caption" weight="semibold" color={COLORS.neutral[600]} style={{ fontSize: 11 }}>
              {listing.category.name}
            </Text>
          </View>
        )}

        {/* Bottom overlay info */}
        <View className="absolute bottom-0 left-0 right-0 px-3 pb-3">
          {variant === 'featured' && (
            <View className="mb-1.5 flex-row items-baseline">
              <Text variant="body" weight="bold" color="#FFFFFF">
                {priceText}
              </Text>
              <Text variant="caption" color="rgba(255,255,255,0.8)" className="ml-1">
                / {priceUnit}
              </Text>
            </View>
          )}

          {images.length > 1 && (
            <View className="flex-row items-center justify-center">
              {images.slice(0, 5).map((_, index) => (
                <View
                  key={index}
                  className="mx-[3px] rounded-full"
                  style={{
                    width: index === activeImageIndex ? 7 : 5,
                    height: index === activeImageIndex ? 7 : 5,
                    backgroundColor:
                      index === activeImageIndex ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Content section */}
      <View className="px-3 pb-3 pt-2.5">
        <Text variant="body" weight="bold" numberOfLines={1} color={COLORS.neutral[600]}>
          {listing.title}
        </Text>

        <View className="mb-2 mt-1 flex-row items-center">
          <Ionicons name="location" size={12} color={COLORS.neutral[300]} />
          <Text variant="caption" color={COLORS.neutral[400]} className="ml-1" numberOfLines={1}>
            {listing.address.area
              ? `${listing.address.area}, ${listing.address.city}`
              : listing.address.city}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          {listing.totalReviews > 0 ? (
            <View className="flex-row items-center">
              <Ionicons name="star" size={13} color="#FFB400" />
              <Text variant="caption" weight="bold" color={COLORS.neutral[600]} className="ml-1">
                {listing.averageRating.toFixed(1)}
              </Text>
              <Text variant="caption" color={COLORS.neutral[300]} className="ml-1">
                ({listing.totalReviews})
              </Text>
            </View>
          ) : (
            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: COLORS.primary[50] }}>
              <Text variant="caption" weight="semibold" color={COLORS.primary[500]} style={{ fontSize: 10 }}>
                New
              </Text>
            </View>
          )}

          {variant !== 'featured' && (
            <View className="flex-row items-baseline">
              <Text variant="body" weight="bold" color={COLORS.primary[500]}>
                {priceText}
              </Text>
              <Text variant="caption" color={COLORS.neutral[300]} className="ml-0.5" style={{ fontSize: 10 }}>
                / {priceUnit}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ListingCard;
