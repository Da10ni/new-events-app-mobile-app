import React, { useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import { COLORS } from '../../theme/colors';
import { type Category } from '../../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId?: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  className?: string;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  venues: 'business-outline',
  catering: 'restaurant-outline',
  photography: 'camera-outline',
  decoration: 'color-palette-outline',
  entertainment: 'musical-notes-outline',
  planning: 'calendar-outline',
  dj: 'disc-outline',
  makeup: 'sparkles-outline',
  transport: 'car-outline',
  flowers: 'flower-outline',
  cake: 'cafe-outline',
  invitation: 'mail-outline',
  lighting: 'bulb-outline',
  sound: 'volume-high-outline',
  security: 'shield-checkmark-outline',
};

const getCategoryIcon = (slug: string): keyof typeof Ionicons.glyphMap => {
  return CATEGORY_ICONS[slug] || 'grid-outline';
};

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  className = '',
}) => {
  const renderCategory = useCallback(
    ({ item }: { item: Category }) => {
      const isSelected = selectedCategoryId === item._id;

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onSelectCategory(isSelected ? null : item._id)}
          className="mr-2 items-center"
          style={{ minWidth: 72 }}
        >
          <View
            className="mb-2 items-center justify-center rounded-2xl"
            style={{
              width: 52,
              height: 52,
              backgroundColor: isSelected ? COLORS.primary[500] : COLORS.neutral[50],
              ...(isSelected
                ? Platform.select({
                    ios: { shadowColor: COLORS.primary[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
                    android: { elevation: 4 },
                  })
                : {}),
            }}
          >
            {item.icon?.url ? (
              <Image
                source={{ uri: item.icon.url }}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            ) : (
              <Ionicons
                name={getCategoryIcon(item.slug)}
                size={22}
                color={isSelected ? '#FFFFFF' : COLORS.neutral[400]}
              />
            )}
          </View>

          <Text
            variant="caption"
            weight={isSelected ? 'bold' : 'medium'}
            color={isSelected ? COLORS.primary[600] : COLORS.neutral[400]}
            numberOfLines={1}
            className="text-center"
            style={{ fontSize: 11 }}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedCategoryId, onSelectCategory]
  );

  return (
    <View className={className}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );
};

export default CategoryFilter;
