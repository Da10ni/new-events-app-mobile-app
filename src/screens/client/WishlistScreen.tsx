import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { WishlistStackParamList } from '../../navigation/types';
import { favoriteApi } from '../../services/api/favoriteApi';
import { ListingCard } from '../../components/listing';
import { Text } from '../../components/ui';
import { EmptyState } from '../../components/layout';
import type { Listing } from '../../types';
import { LAYOUT } from '../../config/constants';
import { COLORS } from '../../theme/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

type NavigationProp = NativeStackNavigationProp<WishlistStackParamList>;

interface FavoriteItem {
  _id: string;
  listing: Listing;
}

export default function WishlistScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await favoriteApi.getAll();
      const favs: FavoriteItem[] = res.data.data?.favorites || [];
      const listings = favs.map((f) => f.listing).filter(Boolean);
      setFavorites(listings);
      setFavoriteIds(new Set(listings.map((l) => l._id)));
    } catch {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }, [fetchFavorites]);

  const handleFavoriteToggle = useCallback(
    (listingId: string, isFavorite: boolean) => {
      if (!isFavorite) {
        setFavorites((prev) => prev.filter((l) => l._id !== listingId));
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
      }
    },
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Listing; index: number }) => (
      <View className={index % 2 === 0 ? 'pr-2' : 'pl-2'} style={{ width: '50%' }}>
        <ListingCard
          listing={item}
          width={CARD_WIDTH}
          onPress={() => navigation.navigate('ListingDetailScreen', { listingId: item._id })}
          isFavorite={favoriteIds.has(item._id)}
          onFavoriteToggle={(fav) => handleFavoriteToggle(item._id, fav)}
        />
      </View>
    ),
    [navigation, favoriteIds, handleFavoriteToggle]
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <EmptyState
          icon="heart-outline"
          title="No saved listings yet"
          description="Start exploring and tap the heart icon to save your favorite event services."
          actionTitle="Start Exploring"
          onAction={() => {
            navigation.getParent()?.navigate('ExploreTab', { screen: 'ExploreScreen' });
          }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Count header */}
      <View className="px-4 pb-2 pt-3">
        <Text variant="caption" color={COLORS.neutral[400]}>
          {favorites.length} saved listing{favorites.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 16, marginBottom: 16 }}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: LAYOUT.SCREEN_BOTTOM_PADDING }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary[500]} />
        }
      />
    </View>
  );
}
