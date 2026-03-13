import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import BottomSheet from '../feedback/BottomSheet';
import Text from '../ui/Text';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import StarRating from '../ui/StarRating';
import Divider from '../ui/Divider';
import TextInput from '../ui/TextInput';
import { COLORS } from '../../theme/colors';
import { type ListingFilter } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: ListingFilter;
  onApply: (filters: ListingFilter) => void;
  cities?: string[];
}

const CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Hyderabad',
];

const SORT_OPTIONS = [
  { label: 'Top Rated', value: '-averageRating' },
  { label: 'Newest', value: '-createdAt' },
  { label: 'Price: Low to High', value: 'pricing.basePrice' },
  { label: 'Price: High to Low', value: '-pricing.basePrice' },
  { label: 'Most Popular', value: '-totalBookings' },
];

const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  cities = CITIES,
}) => {
  const [localFilters, setLocalFilters] = useState<ListingFilter>(filters);

  // Sync local state when the sheet opens or filters prop changes
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const updateFilter = useCallback(
    <K extends keyof ListingFilter>(key: K, value: ListingFilter[K]) => {
      setLocalFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Multi-city helpers
  const selectedCities = (localFilters.city || '').split(',').filter(Boolean);

  const toggleCity = useCallback((city: string) => {
    setLocalFilters((prev) => {
      const current = (prev.city || '').split(',').filter(Boolean);
      const updated = current.includes(city)
        ? current.filter((c) => c !== city)
        : [...current, city];
      return { ...prev, city: updated.length > 0 ? updated.join(',') : undefined };
    });
  }, []);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClearAll = () => {
    setLocalFilters({});
  };

  const activeFilterCount = Object.entries(localFilters).filter(
    ([_, value]) => value !== undefined && value !== '' && value !== null
  ).length;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height={SCREEN_HEIGHT * 0.8}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-neutral-100 px-4 pb-3">
        <Text variant="h4" weight="bold" className="text-neutral-600">
          Filters
        </Text>
        {activeFilterCount > 0 && (
          <Button
            title="Clear All"
            variant="ghost"
            size="sm"
            onPress={handleClearAll}
          />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1 px-4"
      >
        {/* Sort By */}
        <View className="py-5">
          <Text variant="body" weight="bold" className="mb-3 text-neutral-600">
            Sort By
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SORT_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                variant="outlined"
                selected={localFilters.sort === option.value}
                onPress={() =>
                  updateFilter('sort', localFilters.sort === option.value ? undefined : option.value)
                }
              />
            ))}
          </View>
        </View>

        <Divider />

        {/* Price Range */}
        <View className="py-5">
          <Text variant="body" weight="bold" className="mb-3 text-neutral-600">
            Price Range (PKR)
          </Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <TextInput
                label="Min Price"
                placeholder="0"
                keyboardType="numeric"
                value={localFilters.minPrice?.toString() || ''}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  updateFilter('minPrice', isNaN(num) ? undefined : num);
                }}
                leftIcon="cash-outline"
                containerClassName="mb-0"
              />
            </View>
            <Text variant="body" color={COLORS.neutral[300]} className="mt-5">
              -
            </Text>
            <View className="flex-1">
              <TextInput
                label="Max Price"
                placeholder="500,000"
                keyboardType="numeric"
                value={localFilters.maxPrice?.toString() || ''}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  updateFilter('maxPrice', isNaN(num) ? undefined : num);
                }}
                leftIcon="cash-outline"
                containerClassName="mb-0"
              />
            </View>
          </View>
        </View>

        <Divider />

        {/* Minimum Rating */}
        <View className="py-5">
          <Text variant="body" weight="bold" className="mb-3 text-neutral-600">
            Minimum Rating
          </Text>
          <StarRating
            rating={localFilters.rating || 0}
            interactive
            onRatingChange={(rating) => updateFilter('rating', rating)}
            size={32}
            showValue
          />
        </View>

        <Divider />

        {/* City Selection - Multi */}
        <View className="py-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text variant="body" weight="bold" className="text-neutral-600">
              Cities
            </Text>
            {selectedCities.length > 0 && (
              <Text variant="caption" color={COLORS.primary[500]}>
                {selectedCities.length} selected
              </Text>
            )}
          </View>
          <View className="flex-row flex-wrap gap-2">
            {cities.map((city) => (
              <Chip
                key={city}
                label={city}
                variant="outlined"
                selected={selectedCities.includes(city)}
                onPress={() => toggleCity(city)}
              />
            ))}
          </View>
        </View>

        <Divider />

        {/* Capacity Range */}
        <View className="py-5">
          <Text variant="body" weight="bold" className="mb-3 text-neutral-600">
            Capacity (Guests)
          </Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <TextInput
                label="Min Guests"
                placeholder="0"
                keyboardType="numeric"
                value={localFilters.minCapacity?.toString() || ''}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  updateFilter('minCapacity', isNaN(num) ? undefined : num);
                }}
                leftIcon="people-outline"
                containerClassName="mb-0"
              />
            </View>
            <Text variant="body" color={COLORS.neutral[300]} className="mt-5">
              -
            </Text>
            <View className="flex-1">
              <TextInput
                label="Max Guests"
                placeholder="1,000"
                keyboardType="numeric"
                value={localFilters.maxCapacity?.toString() || ''}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  updateFilter('maxCapacity', isNaN(num) ? undefined : num);
                }}
                leftIcon="people-outline"
                containerClassName="mb-0"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Apply button */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-neutral-100 bg-white px-4 py-4">
        <Button
          title={`Apply Filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleApply}
        />
      </View>
    </BottomSheet>
  );
};

export default FilterBottomSheet;
