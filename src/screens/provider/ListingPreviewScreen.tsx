import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProviderListingsStackParamList } from '../../navigation/types';
import { listingApi } from '../../services/api/listingApi';
import { Text, Badge, Card, StarRating, Chip, Divider, Skeleton } from '../../components/ui';
import { SectionHeader } from '../../components/layout';
import type { Listing, ListingImage } from '../../types';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<ProviderListingsStackParamList, 'ListingPreviewScreen'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getStatusBadgeVariant = (
  status: string
): 'default' | 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'active':
      return 'success';
    case 'draft':
      return 'default';
    case 'inactive':
    case 'suspended':
      return 'error';
    default:
      return 'info';
  }
};

export default function ListingPreviewScreen({ route, navigation }: Props) {
  const { listingId } = route.params;

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await listingApi.getBySlug(listingId);
        setListing(res.data?.data?.listing || null);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [listingId]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
        <Skeleton variant="rect" width={SCREEN_WIDTH} height={300} />
        <View className="px-4 pt-4">
          <Skeleton variant="text" width="80%" height={28} className="mb-3" />
          <Skeleton variant="text" width="50%" height={18} className="mb-4" />
          <Skeleton variant="rect" height={80} className="mb-4" />
          <Skeleton variant="text" width="40%" height={22} className="mb-3" />
          <Skeleton variant="rect" height={120} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !listing) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['left', 'right']}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text variant="body" color={COLORS.error} className="mt-3">
          {error || 'Listing not found'}
        </Text>
      </SafeAreaView>
    );
  }

  const renderImageSlider = () => {
    if (!listing.images || listing.images.length === 0) {
      return (
        <View
          className="items-center justify-center bg-neutral-50"
          style={{ width: SCREEN_WIDTH, height: 300 }}
        >
          <Ionicons name="image-outline" size={48} color={COLORS.neutral[300]} />
          <Text variant="label" color={COLORS.neutral[300]} className="mt-2">No images</Text>
        </View>
      );
    }

    return (
      <View>
        <FlatList
          data={listing.images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setActiveImageIndex(index);
          }}
          renderItem={({ item }: { item: ListingImage }) => (
            <Image
              source={{ uri: item.url }}
              style={{ width: SCREEN_WIDTH, height: 300 }}
              resizeMode="cover"
            />
          )}
          keyExtractor={(item) => item._id}
        />
        {/* Pagination Dots */}
        {listing.images.length > 1 && (
          <View className="absolute bottom-4 left-0 right-0 flex-row items-center justify-center">
            {listing.images.map((_, index) => (
              <View
                key={index}
                className={`mx-1 h-2 rounded-full ${
                  index === activeImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/60'
                }`}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View className="flex-row items-center justify-between bg-neutral-50 px-4 py-2.5">
          <View className="flex-row items-center">
            <Ionicons name="eye-outline" size={18} color={COLORS.neutral[400]} />
            <Text variant="label" weight="medium" color={COLORS.neutral[400]} className="ml-2">
              Preview Mode
            </Text>
          </View>
          <Badge
            text={listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            variant={getStatusBadgeVariant(listing.status)}
          />
        </View>

        {/* Image Slider */}
        {renderImageSlider()}

        {/* Content */}
        <View className="px-4 pt-4 pb-8">
          {/* Title and Category */}
          <Text variant="caption" weight="medium" color={COLORS.primary[500]} className="mb-1">
            {listing.category?.name || 'Uncategorized'}
          </Text>
          <Text variant="h3" weight="bold" className="text-neutral-600">
            {listing.title}
          </Text>

          {/* Location */}
          <View className="flex-row items-center mt-2">
            <Ionicons name="location-outline" size={16} color={COLORS.neutral[400]} />
            <Text variant="label" color={COLORS.neutral[400]} className="ml-1">
              {[listing.address?.area, listing.address?.city].filter(Boolean).join(', ')}
            </Text>
          </View>

          {/* Rating */}
          <View className="flex-row items-center mt-2">
            <StarRating
              rating={listing.averageRating || 0}
              size={16}
              showValue
              reviewCount={listing.totalReviews}
            />
            <Text variant="caption" color={COLORS.neutral[400]} className="ml-3">
              {listing.totalBookings || 0} bookings
            </Text>
          </View>

          <Divider className="my-4" />

          {/* Pricing */}
          <SectionHeader title="Pricing" />
          <Card padding="md" className="mb-4">
            <View className="flex-row items-baseline">
              <Text variant="h3" weight="bold" color={COLORS.primary[500]}>
                PKR {listing.pricing?.basePrice?.toLocaleString()}
              </Text>
              <Text variant="label" color={COLORS.neutral[400]} className="ml-1">
                / {listing.pricing?.priceUnit || 'event'}
              </Text>
            </View>

            {listing.pricing?.packages && listing.pricing.packages.length > 0 && (
              <View className="mt-4">
                <Text variant="label" weight="semibold" className="mb-2 text-neutral-600">
                  Packages
                </Text>
                {listing.pricing.packages.map((pkg, index) => (
                  <View key={index} className="mb-2 rounded-lg bg-neutral-50 p-3">
                    <View className="flex-row items-center justify-between">
                      <Text variant="label" weight="semibold" className="text-neutral-600">
                        {pkg.name}
                      </Text>
                      <Text variant="label" weight="bold" color={COLORS.primary[500]}>
                        PKR {pkg.price.toLocaleString()}
                      </Text>
                    </View>
                    {pkg.description && (
                      <Text variant="caption" color={COLORS.neutral[400]} className="mt-1">
                        {pkg.description}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Description */}
          <SectionHeader title="About" />
          <Text variant="body" color={COLORS.neutral[500]} className="mb-4 leading-6">
            {listing.description}
          </Text>

          {/* Capacity */}
          {(listing.capacity?.min || listing.capacity?.max) && (
            <>
              <SectionHeader title="Capacity" />
              <Card padding="md" className="mb-4">
                <View className="flex-row items-center">
                  <Ionicons name="people-outline" size={22} color={COLORS.secondary[500]} />
                  <Text variant="body" weight="medium" className="ml-3 text-neutral-600">
                    {listing.capacity.min ? `${listing.capacity.min}` : '0'} - {listing.capacity.max ? `${listing.capacity.max}` : 'N/A'} guests
                  </Text>
                </View>
              </Card>
            </>
          )}

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <>
              <SectionHeader title="Amenities" />
              <View className="flex-row flex-wrap mb-4">
                {listing.amenities.map((amenity) => (
                  <Chip
                    key={amenity}
                    label={amenity}
                    icon="checkmark-circle"
                    variant="outlined"
                    className="mr-2 mb-2"
                  />
                ))}
              </View>
            </>
          )}

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <>
              <SectionHeader title="Tags" />
              <View className="flex-row flex-wrap mb-4">
                {listing.tags.map((tag) => (
                  <Chip key={tag} label={tag} className="mr-2 mb-2" />
                ))}
              </View>
            </>
          )}

          {/* Stats */}
          <SectionHeader title="Listing Stats" />
          <Card padding="md" className="mb-4">
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Ionicons name="eye-outline" size={22} color={COLORS.info} />
                <Text variant="h4" weight="bold" className="mt-1 text-neutral-600">
                  {listing.viewCount || 0}
                </Text>
                <Text variant="caption" color={COLORS.neutral[400]}>Views</Text>
              </View>
              <View className="items-center flex-1">
                <Ionicons name="calendar-outline" size={22} color={COLORS.success} />
                <Text variant="h4" weight="bold" className="mt-1 text-neutral-600">
                  {listing.totalBookings || 0}
                </Text>
                <Text variant="caption" color={COLORS.neutral[400]}>Bookings</Text>
              </View>
              <View className="items-center flex-1">
                <Ionicons name="star-outline" size={22} color={COLORS.warning} />
                <Text variant="h4" weight="bold" className="mt-1 text-neutral-600">
                  {listing.averageRating?.toFixed(1) || '0.0'}
                </Text>
                <Text variant="caption" color={COLORS.neutral[400]}>Rating</Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Bottom Edit Button */}
      <View className="border-t border-neutral-100 bg-white px-4 pb-6 pt-3">
        <TouchableOpacity
          onPress={() => navigation.navigate('EditListingScreen', { listingId: listing._id })}
          className="flex-row items-center justify-center rounded-xl bg-primary-500 py-4"
        >
          <Ionicons name="create-outline" size={20} color={COLORS.neutral[0]} />
          <Text variant="body" weight="semibold" color={COLORS.neutral[0]} className="ml-2">
            Edit Listing
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
