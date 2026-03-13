import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ExploreStackParamList } from '../../navigation/types';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { showToast } from '../../store/slices/uiSlice';
import { listingApi } from '../../services/api/listingApi';
import { favoriteApi } from '../../services/api/favoriteApi';
import { Text, Avatar, Badge, Card, Divider, StarRating } from '../../components/ui';
import { ListingImageSlider, PriceTag, RatingDisplay, WishlistHeart } from '../../components/listing';
import { SectionHeader } from '../../components/layout';
import type { Listing, Review } from '../../types';
import { COLORS } from '../../theme/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

type Props = NativeStackScreenProps<ExploreStackParamList, 'ListingDetailScreen'>;

const AMENITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  wifi: 'wifi-outline',
  parking: 'car-outline',
  'air conditioning': 'snow-outline',
  catering: 'restaurant-outline',
  stage: 'easel-outline',
  sound: 'volume-high-outline',
  lighting: 'bulb-outline',
  generator: 'flash-outline',
  chairs: 'people-outline',
  tables: 'grid-outline',
  decoration: 'color-palette-outline',
  projector: 'tv-outline',
  security: 'shield-checkmark-outline',
  valet: 'key-outline',
  bridal: 'heart-outline',
  garden: 'leaf-outline',
  pool: 'water-outline',
  kitchen: 'restaurant-outline',
};

const getAmenityIcon = (amenity: string): keyof typeof Ionicons.glyphMap => {
  const lower = amenity.toLowerCase();
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return 'checkmark-circle-outline';
};

export default function ListingDetailScreen({ route, navigation }: Props) {
  const { listingId } = route.params;
  const dispatch = useAppDispatch();

  const { bookings } = useAppSelector((s) => s.booking);

  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [listingRes] = await Promise.all([
        listingApi.getBySlug(listingId),
      ]);

      const listingData = listingRes.data.data.listing;
      setListing(listingData);

      // Fetch reviews separately
      try {
        const reviewsRes = await listingApi.getReviews(listingData._id, { limit: 5 });
        setReviews(reviewsRes.data.data?.reviews || []);
      } catch {
        // Reviews are non-critical
      }

      // Check favorite status
      try {
        const favRes = await favoriteApi.check(listingData._id);
        setIsFavorite(favRes.data.data?.isFavorite || false);
      } catch {
        // Favorite check is non-critical
      }
    } catch {
      setError('Failed to load listing details');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const handleBookNow = useCallback(() => {
    if (!listing) return;
    navigation.navigate('BookingRequestScreen', {
      listingId: listing._id,
      vendorId: listing.vendor._id,
    });
  }, [listing, navigation]);

  const handleFavoriteToggle = useCallback(
    (fav: boolean) => {
      setIsFavorite(fav);
    },
    []
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.neutral[300]} />
        <Text variant="h4" weight="bold" className="mb-2 mt-4 text-center">
          {error || 'Listing not found'}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text variant="body" weight="semibold" color={COLORS.primary[500]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const descriptionLimit = 150;
  const isDescriptionLong = listing.description.length > descriptionLimit;
  const displayedDescription = descriptionExpanded
    ? listing.description
    : listing.description.slice(0, descriptionLimit);

  const formatAddress = () => {
    const parts = [listing.address.street, listing.address.area, listing.address.city, listing.address.state, listing.address.country].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Image Carousel */}
        <View className="relative">
          <ListingImageSlider
            images={listing.images}
            height={300}
            showCounter
            showDots
          />
          {/* Wishlist Heart */}
          <View className="absolute right-4 top-12">
            <WishlistHeart
              listingId={listing._id}
              isFavorite={isFavorite}
              onToggle={handleFavoriteToggle}
              size={28}
            />
          </View>
        </View>

        <View className="px-4 pb-32 pt-4">
          {/* Title */}
          <Text variant="h2" weight="bold" className="mb-1">
            {listing.title}
          </Text>

          {/* Location */}
          <View className="mb-3 flex-row items-center">
            <Ionicons name="location-outline" size={16} color={COLORS.neutral[400]} />
            <Text variant="label" color={COLORS.neutral[400]} className="ml-1 flex-1" numberOfLines={2}>
              {formatAddress()}
            </Text>
          </View>

          {/* Host/Vendor Info */}
          <TouchableOpacity className="mb-4 flex-row items-center rounded-xl bg-neutral-50 p-3">
            <Avatar
              firstName={listing.vendor.businessName}
              lastName=""
              size="md"
            />
            <View className="ml-3 flex-1">
              <Text variant="label" weight="semibold">
                {listing.vendor.businessName}
              </Text>
              <Text variant="caption" color={COLORS.neutral[400]}>
                Service Provider
              </Text>
            </View>
            <Text variant="label" weight="semibold" color={COLORS.primary[500]}>
              View Profile
            </Text>
          </TouchableOpacity>

          {/* Category & Rating */}
          <View className="mb-4 flex-row items-center">
            <Badge text={listing.category.name} variant="default" />
            <View className="ml-3">
              <RatingDisplay
                rating={listing.averageRating}
                reviewCount={listing.totalReviews}
                size="md"
              />
            </View>
          </View>

          <Divider className="my-4" />

          {/* Description */}
          <SectionHeader title="About this listing" />
          <Text variant="body" color={COLORS.neutral[500]} className="leading-6">
            {displayedDescription}
            {isDescriptionLong && !descriptionExpanded && '...'}
          </Text>
          {isDescriptionLong && (
            <TouchableOpacity
              onPress={() => setDescriptionExpanded(!descriptionExpanded)}
              className="mt-2"
            >
              <Text variant="label" weight="semibold" color={COLORS.neutral[600]} className="underline">
                {descriptionExpanded ? 'Show less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Amenities */}
          {listing.amenities.length > 0 && (
            <>
              <Divider className="my-5" />
              <SectionHeader title="What's included" />
              <View className="flex-row flex-wrap">
                {listing.amenities.map((amenity, index) => (
                  <View
                    key={index}
                    className="mb-3 w-1/2 flex-row items-center"
                  >
                    <View className="mr-3 items-center justify-center rounded-lg bg-neutral-50 p-2">
                      <Ionicons name={getAmenityIcon(amenity)} size={20} color={COLORS.neutral[500]} />
                    </View>
                    <Text variant="label" color={COLORS.neutral[500]} className="flex-1" numberOfLines={1}>
                      {amenity}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Packages & Pricing */}
          {listing.pricing.packages && listing.pricing.packages.length > 0 && (
            <>
              <Divider className="my-5" />
              <SectionHeader title="Packages & Pricing" />
              {listing.pricing.packages.map((pkg, index) => (
                <Card key={index} padding="md" className="mb-3">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text variant="body" weight="bold" className="mb-1">
                        {pkg.name}
                      </Text>
                      {pkg.description && (
                        <Text variant="caption" color={COLORS.neutral[400]} className="mb-2">
                          {pkg.description}
                        </Text>
                      )}
                    </View>
                    <PriceTag
                      price={pkg.price}
                      currency={listing.pricing.currency || 'PKR'}
                    />
                  </View>
                  {pkg.includes.length > 0 && (
                    <View className="mt-3 border-t border-neutral-100 pt-3">
                      {pkg.includes.map((item, i) => (
                        <View key={i} className="mb-1.5 flex-row items-center">
                          <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                          <Text variant="caption" color={COLORS.neutral[500]} className="ml-2">
                            {item}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              ))}
            </>
          )}

          {/* Availability */}
          <Divider className="my-5" />
          <SectionHeader title="Availability" />
          <Card padding="md" className="mb-4">
            <View className="flex-row items-center">
              <View className="mr-3 items-center justify-center rounded-full bg-secondary-50 p-3">
                <Ionicons name="calendar-outline" size={24} color={COLORS.success} />
              </View>
              <View className="flex-1">
                <Text variant="body" weight="semibold">
                  Contact for availability
                </Text>
                <Text variant="caption" color={COLORS.neutral[400]}>
                  Send an inquiry to check available dates
                </Text>
              </View>
            </View>
            <View className="mt-3 flex-row items-center">
              <Ionicons name="people-outline" size={16} color={COLORS.neutral[400]} />
              <Text variant="caption" color={COLORS.neutral[400]} className="ml-1.5">
                Capacity: {listing.capacity.min} - {listing.capacity.max} guests
              </Text>
            </View>
          </Card>

          {/* Reviews */}
          <Divider className="my-5" />
          <SectionHeader
            title="Reviews"
            subtitle={
              listing.totalReviews > 0
                ? `${listing.averageRating.toFixed(1)} average from ${listing.totalReviews} reviews`
                : undefined
            }
          />

          {reviews.length > 0 ? (
            <>
              {reviews.slice(0, 3).map((review) => (
                <Card key={review._id} padding="md" className="mb-3">
                  <View className="flex-row items-center">
                    <Avatar
                      source={review.client.avatar?.url}
                      firstName={review.client.firstName}
                      lastName={review.client.lastName}
                      size="sm"
                    />
                    <View className="ml-3 flex-1">
                      <Text variant="label" weight="semibold">
                        {review.client.firstName} {review.client.lastName}
                      </Text>
                      <Text variant="caption" color={COLORS.neutral[400]}>
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <StarRating rating={review.rating} size={14} />
                  </View>
                  <Text variant="body" color={COLORS.neutral[500]} className="mt-3">
                    {review.comment}
                  </Text>
                  {review.vendorReply && (
                    <View className="ml-4 mt-3 rounded-lg border-l-2 border-primary-500 bg-primary-50 p-3">
                      <Text variant="caption" weight="semibold" className="mb-1">
                        Response from host
                      </Text>
                      <Text variant="caption" color={COLORS.neutral[500]}>
                        {review.vendorReply.comment}
                      </Text>
                    </View>
                  )}
                </Card>
              ))}
              {listing.totalReviews > 3 && (
                <TouchableOpacity className="items-center rounded-xl border border-neutral-600 px-6 py-3">
                  <Text variant="label" weight="semibold">
                    See All {listing.totalReviews} Reviews
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View className="items-center py-6">
              <Ionicons name="chatbubble-outline" size={32} color={COLORS.neutral[300]} />
              <Text variant="body" color={COLORS.neutral[400]} className="mt-2">
                No reviews yet
              </Text>
            </View>
          )}

          {/* Location */}
          <Divider className="my-5" />
          <SectionHeader title="Location" />
          <View className="flex-row items-start">
            <Ionicons name="location" size={20} color={COLORS.primary[500]} />
            <Text variant="body" color={COLORS.neutral[500]} className="ml-2 flex-1">
              {formatAddress()}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      {(() => {
        const activeBooking = bookings.find(
          (b) =>
            b.listing._id === listing._id &&
            !['cancelled', 'rejected', 'completed'].includes(b.status)
        );
        const hasActiveBooking = !!activeBooking;
        const statusLabel =
          activeBooking?.status === 'confirmed'
            ? 'Confirmed'
            : activeBooking?.status === 'pending'
              ? 'Pending'
              : 'Requested';

        return (
          <View
            className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between border-t border-neutral-100 bg-white px-4 pb-8 pt-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <View>
              <PriceTag
                price={listing.pricing.basePrice}
                currency={listing.pricing.currency || 'PKR'}
                prefix={listing.pricing.maxPrice ? 'From' : undefined}
                suffix={`/ ${listing.pricing.priceUnit || 'event'}`}
              />
            </View>
            {hasActiveBooking ? (
              <View
                className="flex-row items-center rounded-xl px-6 py-3.5"
                style={{ backgroundColor: COLORS.neutral[100] }}
              >
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text variant="body" weight="bold" color={COLORS.neutral[500]} style={{ marginLeft: 6 }}>
                  {statusLabel}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleBookNow}
                className="rounded-xl bg-primary-500 px-6 py-3.5"
                activeOpacity={0.85}
              >
                <Text variant="body" weight="bold" color={COLORS.neutral[0]}>
                  Book Now
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })()}
    </View>
  );
}
