import React from 'react';
import { View, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import WishlistHeart from './WishlistHeart';
import { COLORS } from '../../theme/colors';
import { type Listing } from '../../types';

interface ListingCardHorizontalProps {
  listing: Listing;
  onPress?: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (isFavorite: boolean) => void;
  className?: string;
}

const SHADOW = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
  default: {},
});

const ListingCardHorizontal: React.FC<ListingCardHorizontalProps> = ({
  listing,
  onPress,
  isFavorite = false,
  onFavoriteToggle,
  className = '',
}) => {
  const primaryImage = listing.images.find((img) => img.isPrimary) || listing.images[0];
  const priceText = `${listing.pricing.currency || 'PKR'} ${listing.pricing.basePrice.toLocaleString()}`;
  const priceUnit = listing.pricing.priceUnit || 'event';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className={`flex-row overflow-hidden rounded-2xl bg-white ${className}`}
      style={SHADOW}
    >
      {/* Image */}
      <View className="relative">
        {primaryImage ? (
          <Image
            source={{ uri: primaryImage.url }}
            style={{ width: 120, height: 130, borderRadius: 16 }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="items-center justify-center"
            style={{ width: 120, height: 130, borderRadius: 16, backgroundColor: COLORS.neutral[50] }}
          >
            <Ionicons name="image-outline" size={28} color={COLORS.neutral[200]} />
          </View>
        )}

        {/* Category pill */}
        {listing.category && (
          <View
            className="absolute bottom-2 left-2 rounded-full px-2 py-0.5"
            style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
          >
            <Text variant="caption" weight="semibold" color={COLORS.neutral[600]} style={{ fontSize: 10 }}>
              {listing.category.name}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 justify-between py-3 pl-3 pr-3">
        <View>
          <Text variant="label" weight="bold" numberOfLines={1} color={COLORS.neutral[600]}>
            {listing.title}
          </Text>

          <View className="mb-1.5 mt-1 flex-row items-center">
            <Ionicons name="location" size={12} color={COLORS.neutral[300]} />
            <Text variant="caption" color={COLORS.neutral[400]} className="ml-1" numberOfLines={1}>
              {listing.address.area
                ? `${listing.address.area}, ${listing.address.city}`
                : listing.address.city}
            </Text>
          </View>

          {listing.totalReviews > 0 ? (
            <View className="flex-row items-center">
              <Ionicons name="star" size={12} color="#FFB400" />
              <Text variant="caption" weight="bold" color={COLORS.neutral[600]} className="ml-1">
                {listing.averageRating.toFixed(1)}
              </Text>
              <Text variant="caption" color={COLORS.neutral[300]} className="ml-1">
                ({listing.totalReviews} reviews)
              </Text>
            </View>
          ) : (
            <View
              className="self-start rounded-full px-2 py-0.5"
              style={{ backgroundColor: COLORS.primary[50] }}
            >
              <Text variant="caption" weight="semibold" color={COLORS.primary[500]} style={{ fontSize: 10 }}>
                New
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-baseline">
          <Text variant="body" weight="bold" color={COLORS.primary[500]}>
            {priceText}
          </Text>
          <Text variant="caption" color={COLORS.neutral[300]} className="ml-1" style={{ fontSize: 10 }}>
            / {priceUnit}
          </Text>
        </View>
      </View>

      {/* Wishlist heart */}
      <View className="absolute right-3 top-3">
        <WishlistHeart
          listingId={listing._id}
          isFavorite={isFavorite}
          onToggle={onFavoriteToggle}
          size={20}
        />
      </View>
    </TouchableOpacity>
  );
};

export default ListingCardHorizontal;
