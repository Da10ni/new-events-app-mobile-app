import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput as RNTextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ExploreStackParamList } from '../../navigation/types';
import { useAppDispatch } from '../../store/hooks';
import { showToast } from '../../store/slices/uiSlice';
import { useSweetAlert } from '../../components/feedback';
import { listingApi } from '../../services/api/listingApi';
import { bookingApi } from '../../services/api/bookingApi';
import { Text, Card, Divider, Button } from '../../components/ui';
import { PriceTag } from '../../components/listing';
import { LoadingOverlay } from '../../components/feedback';
import type { Listing, CreateBookingRequest } from '../../types';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<ExploreStackParamList, 'BookingRequestScreen'>;

export default function BookingRequestScreen({ route, navigation }: Props) {
  const { listingId, vendorId } = route.params;
  const dispatch = useAppDispatch();
  const { showAlert } = useSweetAlert();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [guestCount, setGuestCount] = useState(1);
  const [selectedPackageIndex, setSelectedPackageIndex] = useState<number | null>(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await listingApi.getBySlug(listingId);
        const data = res.data.data.listing;
        setListing(data);
        if (data.capacity?.min) {
          setGuestCount(data.capacity.min);
        }
      } catch {
        dispatch(showToast({ message: 'Failed to load listing', type: 'error' }));
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [listingId, dispatch, navigation]);

  const capacityMin = listing?.capacity?.min || 1;
  const capacityMax = listing?.capacity?.max || 1000;

  const incrementGuests = useCallback(() => {
    if (listing && guestCount < capacityMax) {
      setGuestCount((prev) => prev + 1);
    }
  }, [listing, guestCount, capacityMax]);

  const decrementGuests = useCallback(() => {
    if (listing && guestCount > capacityMin) {
      setGuestCount((prev) => prev - 1);
    }
  }, [listing, guestCount, capacityMin]);

  const getBasePrice = useCallback((): number => {
    if (!listing) return 0;
    if (selectedPackageIndex !== null && listing.pricing.packages) {
      return listing.pricing.packages[selectedPackageIndex].price;
    }
    return listing.pricing.basePrice;
  }, [listing, selectedPackageIndex]);

  const getServiceFee = useCallback((): number => {
    return Math.round(getBasePrice() * 0.05);
  }, [getBasePrice]);

  const getTotal = useCallback((): number => {
    return getBasePrice() + getServiceFee();
  }, [getBasePrice, getServiceFee]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDateSelect = useCallback((daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    setSelectedDate(date);
    setShowDatePicker(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!listing) return;

    const bookingData: CreateBookingRequest = {
      listing: listing._id,
      eventDate: selectedDate.toISOString(),
      guestCount,
      specialRequests: specialRequests.trim() || undefined,
      packageName:
        selectedPackageIndex !== null && listing.pricing.packages
          ? listing.pricing.packages[selectedPackageIndex].name
          : undefined,
    };

    try {
      setSubmitting(true);
      const res = await bookingApi.create(bookingData);
      const bookingId = res.data.data.booking._id;
      dispatch(showToast({ message: 'Booking request sent!', type: 'success' }));
      navigation.replace('BookingConfirmationScreen', { bookingId });
    } catch (err: any) {
      console.log('Booking error:', JSON.stringify({
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      }));
      const message = err?.response?.data?.message || err?.message || 'Failed to submit booking';
      showAlert({ type: 'error', title: 'Booking Failed', message });
    } finally {
      setSubmitting(false);
    }
  }, [listing, selectedDate, guestCount, specialRequests, selectedPackageIndex, dispatch, navigation]);

  if (loading || !listing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </View>
    );
  }

  const primaryImage = listing.images?.find((img) => img.isPrimary) || listing.images?.[0];

  return (
    <View className="flex-1 bg-white">
      <LoadingOverlay visible={submitting} message="Sending request..." />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-4">
          {/* Listing Summary Card */}
          <Card padding="sm" className="mb-5 flex-row">
            {primaryImage ? (
              <Image
                source={{ uri: primaryImage.url }}
                className="rounded-lg"
                style={{ width: 80, height: 80 }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="items-center justify-center rounded-lg bg-neutral-50"
                style={{ width: 80, height: 80 }}
              >
                <Ionicons name="image-outline" size={24} color={COLORS.neutral[300]} />
              </View>
            )}
            <View className="ml-3 flex-1 justify-center">
              <Text variant="body" weight="semibold" numberOfLines={2} className="mb-1">
                {listing.title}
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={12} color={COLORS.neutral[400]} />
                <Text variant="caption" color={COLORS.neutral[400]} className="ml-0.5">
                  {listing.address.city}, {listing.address.country}
                </Text>
              </View>
              <PriceTag
                price={listing.pricing.basePrice}
                currency={listing.pricing.currency || 'PKR'}
                suffix={`/ ${listing.pricing.priceUnit || 'event'}`}
                className="mt-1"
              />
            </View>
          </Card>

          {/* Date Selection */}
          <Text variant="h4" weight="bold" className="mb-3">
            Event Date
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(!showDatePicker)}
            className="mb-2 flex-row items-center rounded-xl border-2 border-neutral-200 px-4 py-3.5"
          >
            <Ionicons name="calendar-outline" size={20} color={COLORS.neutral[400]} />
            <Text variant="body" color={COLORS.neutral[600]} className="ml-3 flex-1">
              {formatDate(selectedDate)}
            </Text>
            <Ionicons
              name={showDatePicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.neutral[400]}
            />
          </TouchableOpacity>

          {showDatePicker && (
            <Card padding="sm" className="mb-3">
              <Text variant="label" weight="semibold" className="mb-2">
                Select a date
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Array.from({ length: 30 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i + 1);
                  const isSelected = d.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleDateSelect(i + 1)}
                      className={`mr-2 items-center rounded-xl px-4 py-3 ${
                        isSelected ? 'bg-primary-500' : 'bg-neutral-50'
                      }`}
                    >
                      <Text
                        variant="caption"
                        weight="medium"
                        color={isSelected ? COLORS.neutral[0] : COLORS.neutral[400]}
                      >
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                      <Text
                        variant="h4"
                        weight="bold"
                        color={isSelected ? COLORS.neutral[0] : COLORS.neutral[600]}
                      >
                        {d.getDate()}
                      </Text>
                      <Text
                        variant="caption"
                        color={isSelected ? COLORS.neutral[0] : COLORS.neutral[400]}
                      >
                        {d.toLocaleDateString('en-US', { month: 'short' })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Card>
          )}

          <Divider className="my-5" />

          {/* Guest Count */}
          <Text variant="h4" weight="bold" className="mb-3">
            Number of Guests
          </Text>
          <View className="mb-1 flex-row items-center justify-between rounded-xl border-2 border-neutral-200 px-4 py-3">
            <View>
              <Text variant="body" color={COLORS.neutral[600]}>
                Guests
              </Text>
              <Text variant="caption" color={COLORS.neutral[400]}>
                Min {capacityMin} - Max {capacityMax}
              </Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={decrementGuests}
                disabled={guestCount <= capacityMin}
                className={`items-center justify-center rounded-full border border-neutral-200 ${
                  guestCount <= capacityMin ? 'opacity-30' : ''
                }`}
                style={{ width: 36, height: 36 }}
              >
                <Ionicons name="remove" size={20} color={COLORS.neutral[600]} />
              </TouchableOpacity>
              <Text variant="body" weight="bold" className="mx-5">
                {guestCount}
              </Text>
              <TouchableOpacity
                onPress={incrementGuests}
                disabled={guestCount >= capacityMax}
                className={`items-center justify-center rounded-full border border-neutral-200 ${
                  guestCount >= capacityMax ? 'opacity-30' : ''
                }`}
                style={{ width: 36, height: 36 }}
              >
                <Ionicons name="add" size={20} color={COLORS.neutral[600]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Package Selection */}
          {listing.pricing.packages && listing.pricing.packages.length > 0 && (
            <>
              <Divider className="my-5" />
              <Text variant="h4" weight="bold" className="mb-3">
                Select Package
              </Text>
              {listing.pricing.packages.map((pkg, index) => {
                const isSelected = selectedPackageIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedPackageIndex(isSelected ? null : index)}
                    className={`mb-3 rounded-xl border-2 p-4 ${
                      isSelected ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 pr-3">
                        <Text variant="body" weight="semibold">
                          {pkg.name}
                        </Text>
                        {pkg.description && (
                          <Text variant="caption" color={COLORS.neutral[400]} className="mt-0.5">
                            {pkg.description}
                          </Text>
                        )}
                      </View>
                      <View className="flex-row items-center">
                        <PriceTag
                          price={pkg.price}
                          currency={listing.pricing.currency || 'PKR'}
                        />
                        <View
                          className={`ml-3 items-center justify-center rounded-full border-2 ${
                            isSelected ? 'border-primary-500 bg-primary-500' : 'border-neutral-200'
                          }`}
                          style={{ width: 24, height: 24 }}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color={COLORS.neutral[0]} />
                          )}
                        </View>
                      </View>
                    </View>
                    {pkg.includes?.length > 0 && (
                      <View className="mt-2">
                        {pkg.includes.slice(0, 3).map((item, i) => (
                          <View key={i} className="mb-1 flex-row items-center">
                            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                            <Text variant="caption" color={COLORS.neutral[500]} className="ml-1.5">
                              {item}
                            </Text>
                          </View>
                        ))}
                        {(pkg.includes?.length || 0) > 3 && (
                          <Text variant="caption" color={COLORS.neutral[400]} className="ml-5">
                            +{pkg.includes.length - 3} more
                          </Text>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          <Divider className="my-5" />

          {/* Special Requests */}
          <Text variant="h4" weight="bold" className="mb-3">
            Special Requests
          </Text>
          <View className="rounded-xl border-2 border-neutral-200 px-4 py-3">
            <RNTextInput
              value={specialRequests}
              onChangeText={setSpecialRequests}
              placeholder="Any special requirements or notes for the vendor..."
              placeholderTextColor={COLORS.neutral[300]}
              multiline
              textAlignVertical="top"
              className="min-h-[100px] text-[16px] text-neutral-600"
              maxLength={500}
            />
          </View>
          <Text variant="caption" color={COLORS.neutral[300]} className="mt-1 text-right">
            {specialRequests.length}/500
          </Text>

          <Divider className="my-5" />

          {/* Price Breakdown */}
          <Text variant="h4" weight="bold" className="mb-3">
            Price Breakdown
          </Text>
          <Card padding="md">
            <View className="mb-3 flex-row items-center justify-between">
              <Text variant="body" color={COLORS.neutral[400]}>
                Base price
              </Text>
              <Text variant="body" color={COLORS.neutral[500]}>
                {listing.pricing.currency || 'PKR'} {getBasePrice().toLocaleString()}
              </Text>
            </View>
            {selectedPackageIndex !== null && listing.pricing.packages && (
              <View className="mb-3 flex-row items-center justify-between">
                <Text variant="caption" color={COLORS.neutral[400]}>
                  Package: {listing.pricing.packages[selectedPackageIndex].name}
                </Text>
              </View>
            )}
            <View className="mb-3 flex-row items-center justify-between">
              <Text variant="body" color={COLORS.neutral[400]}>
                Service fee
              </Text>
              <Text variant="body" color={COLORS.neutral[500]}>
                {listing.pricing.currency || 'PKR'} {getServiceFee().toLocaleString()}
              </Text>
            </View>
            <Divider className="my-3" />
            <View className="flex-row items-center justify-between">
              <Text variant="body" weight="bold">
                Total
              </Text>
              <Text variant="h4" weight="bold" color={COLORS.primary[500]}>
                {listing.pricing.currency || 'PKR'} {getTotal().toLocaleString()}
              </Text>
            </View>
          </Card>

          <View className="mt-6">
            <Button
              title="Request to Book"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
