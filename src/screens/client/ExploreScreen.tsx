import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExploreStackParamList } from '../../navigation/types';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { clearAuth, switchRole, setVendor } from '../../store/slices/authSlice';
import { LAYOUT } from '../../config/constants';
import {
  setListings,
  setFeaturedListings,
  setLoading as setListingLoading,
} from '../../store/slices/listingSlice';
import {
  setCategories,
  setSelectedCategory,
  setLoading as setCategoryLoading,
} from '../../store/slices/categorySlice';
import { listingApi } from '../../services/api/listingApi';
import { categoryApi } from '../../services/api/categoryApi';
import { favoriteApi } from '../../services/api/favoriteApi';
import { vendorApi } from '../../services/api/vendorApi';
import { Text, Skeleton } from '../../components/ui';
import { ListingCard, ListingCardHorizontal, ListingsBottomSheet } from '../../components/listing';
import { SearchBar, CategoryFilter, FilterBottomSheet } from '../../components/search';
import { SectionHeader, EmptyState } from '../../components/layout';
import BecomeProviderModal from '../../components/provider/BecomeProviderModal';
import { useSweetAlert } from '../../components/feedback';
import type { Listing, ListingFilter } from '../../types';
import { COLORS } from '../../theme/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.72;

type NavigationProp = NativeStackNavigationProp<ExploreStackParamList>;

const POPULAR_PREVIEW_COUNT = 4;
const RECENT_PREVIEW_COUNT = 5;

type BottomSheetType = 'popular' | 'featured' | 'recent' | null;

export default function ExploreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { listings, featuredListings, loading: listingsLoading } = useAppSelector((s) => s.listing);
  const { categories, selectedCategory, loading: categoriesLoading } = useAppSelector((s) => s.category);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const user = useAppSelector((s) => s.auth.user);
  const vendor = useAppSelector((s) => s.auth.vendor);
  const { showAlert } = useSweetAlert();

  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeSheet, setActiveSheet] = useState<BottomSheetType>(null);

  // Become Provider modal
  const [providerModalVisible, setProviderModalVisible] = useState(false);

  // Sidebar drawer animation
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openSidebar = useCallback(() => {
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();

    // Fetch vendor profile if user is authenticated but vendor is null (e.g. app restart)
    if (isAuthenticated && !vendor) {
      vendorApi.getMyProfile().then((res) => {
        const fetched = res.data.data.vendor;
        if (fetched) dispatch(setVendor(fetched));
      }).catch(() => {});
    }

    // Refresh vendor status if pending — check if admin approved
    if (vendor && vendor.status === 'pending') {
      vendorApi.getMyProfile().then((res) => {
        const updated = res.data.data.vendor;
        if (updated.status !== vendor.status) {
          dispatch(setVendor(updated));
          if (updated.status === 'approved') {
            showAlert({
              type: 'congrats',
              title: 'Congratulations!',
              message: 'Your provider account has been approved! You can now switch to Provider mode, create listings, and start receiving bookings.',
              buttons: [{ text: "Let's Go!" }],
            });
          }
        }
      }).catch(() => {});
    }
  }, [slideAnim, backdropAnim, vendor, isAuthenticated, dispatch, showAlert]);

  const closeSidebar = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SCREEN_WIDTH, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setMenuVisible(false));
  }, [slideAnim, backdropAnim]);

  // Search & filter state
  const [searchText, setSearchText] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [bottomSheetFilters, setBottomSheetFilters] = useState<ListingFilter>({});
  const [searchResults, setSearchResults] = useState<Listing[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFilterActive = useCallback((key: string, value: unknown) => {
    if (value === undefined || value === null || value === '') return false;
    if (key === 'rating' && value === 0) return false;
    return true;
  }, []);

  const isSearchMode = useMemo(() => {
    const hasSearchText = searchText.trim().length > 0;
    const hasFilters = Object.entries(bottomSheetFilters).some(
      ([k, v]) => isFilterActive(k, v)
    );
    return hasSearchText || hasFilters;
  }, [searchText, bottomSheetFilters, isFilterActive]);

  const activeFilterCount = useMemo(() => {
    const keys: (keyof ListingFilter)[] = ['city', 'minPrice', 'maxPrice', 'minCapacity', 'maxCapacity', 'rating', 'sort'];
    return keys.filter((k) => isFilterActive(k, bottomSheetFilters[k])).length;
  }, [bottomSheetFilters, isFilterActive]);

  const fetchData = useCallback(async () => {
    try {
      dispatch(setListingLoading(true));
      dispatch(setCategoryLoading(true));

      const [catRes, featuredRes, listingsRes, recentRes] = await Promise.all([
        categoryApi.getAll(),
        listingApi.getFeatured(),
        listingApi.getAll({ limit: 10, sort: '-averageRating' }),
        listingApi.getAll({ limit: 10, sort: '-createdAt' }),
      ]);

      dispatch(setCategories(catRes.data.data.categories));
      dispatch(setFeaturedListings(featuredRes.data.data.listings));
      dispatch(setListings({ listings: listingsRes.data.data.listings, hasMore: true }));
      setRecentListings(recentRes.data.data.listings);

      if (isAuthenticated) {
        try {
          const favRes = await favoriteApi.getAll();
          const favIds = new Set<string>(
            (favRes.data.data?.favorites || []).map((f: { listing: string | { _id: string } }) =>
              typeof f.listing === 'string' ? f.listing : f.listing._id
            )
          );
          setFavoriteIds(favIds);
        } catch {
          // Favorites are non-critical
        }
      }
    } catch {
      // Error handling silently
    } finally {
      dispatch(setListingLoading(false));
      dispatch(setCategoryLoading(false));
      setInitialLoading(false);
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const performSearch = useCallback(
    async (text: string, category: string | null, sheetFilters: ListingFilter) => {
      const combinedFilters: ListingFilter = {
        ...sheetFilters,
        limit: 20,
      };
      // Only use default sort if user hasn't chosen one
      if (!combinedFilters.sort) {
        combinedFilters.sort = '-averageRating';
      }
      if (text.trim()) combinedFilters.search = text.trim();
      if (category) combinedFilters.category = category;

      // Clean out empty/null/undefined values, and rating=0 (means no filter)
      const cleanFilters = Object.fromEntries(
        Object.entries(combinedFilters).filter(([key, v]) => {
          if (v === undefined || v === null || v === '') return false;
          if (key === 'rating' && v === 0) return false;
          return true;
        })
      ) as ListingFilter;

      setSearchLoading(true);
      try {
        const res = await listingApi.getAll(cleanFilters);
        setSearchResults(res.data.data.listings);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    []
  );

  const handleSearchTextChange = useCallback(
    (text: string) => {
      setSearchText(text);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        const hasFilters = Object.entries(bottomSheetFilters).some(
          ([k, v]) => isFilterActive(k, v)
        );
        if (text.trim().length > 0 || hasFilters) {
          performSearch(text, selectedCategory, bottomSheetFilters);
        } else {
          setSearchResults([]);
        }
      }, 400);
    },
    [selectedCategory, bottomSheetFilters, performSearch, isFilterActive]
  );

  const handleSearchClear = useCallback(() => {
    setSearchText('');
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    const hasFilters = Object.entries(bottomSheetFilters).some(
      ([k, v]) => isFilterActive(k, v)
    );
    if (hasFilters) {
      performSearch('', selectedCategory, bottomSheetFilters);
    } else {
      setSearchResults([]);
    }
  }, [bottomSheetFilters, selectedCategory, performSearch, isFilterActive]);

  const handleSearchSubmit = useCallback(
    (text: string) => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (text.trim()) performSearch(text, selectedCategory, bottomSheetFilters);
    },
    [selectedCategory, bottomSheetFilters, performSearch]
  );

  const handleFilterApply = useCallback(
    (newFilters: ListingFilter) => {
      setBottomSheetFilters(newFilters);
      performSearch(searchText, selectedCategory, newFilters);
    },
    [searchText, selectedCategory, performSearch]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleCategorySelect = useCallback(
    async (categoryId: string | null) => {
      dispatch(setSelectedCategory(categoryId));

      const hasSearchText = searchText.trim().length > 0;
      const hasFilters = Object.entries(bottomSheetFilters).some(
        ([k, v]) => isFilterActive(k, v)
      );

      if (hasSearchText || hasFilters) {
        performSearch(searchText, categoryId, bottomSheetFilters);
        return;
      }

      if (categoryId) {
        try {
          dispatch(setListingLoading(true));
          const res = await listingApi.getAll({ category: categoryId, limit: 10 });
          dispatch(setListings({ listings: res.data.data.listings, hasMore: true }));
        } catch {
          // silent
        } finally {
          dispatch(setListingLoading(false));
        }
      } else {
        try {
          dispatch(setListingLoading(true));
          const res = await listingApi.getAll({ limit: 10, sort: '-averageRating' });
          dispatch(setListings({ listings: res.data.data.listings, hasMore: true }));
        } catch {
          // silent
        } finally {
          dispatch(setListingLoading(false));
        }
      }
    },
    [dispatch, searchText, bottomSheetFilters, performSearch, isFilterActive]
  );

  const navigateToListing = useCallback(
    (listingId: string) => {
      navigation.navigate('ListingDetailScreen', { listingId });
    },
    [navigation]
  );

  const handleFavoriteToggle = useCallback(
    (listingId: string, isFavorite: boolean) => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFavorite) {
          next.add(listingId);
        } else {
          next.delete(listingId);
        }
        return next;
      });
    },
    []
  );

  // Bottom sheet data
  const getSheetData = () => {
    switch (activeSheet) {
      case 'popular':
        return { title: 'Popular Near You', subtitle: 'Top-rated event services', listings };
      case 'featured':
        return { title: 'Featured', subtitle: 'Hand-picked event services', listings: featuredListings };
      case 'recent':
        return { title: 'Recently Added', subtitle: 'Fresh new listings', listings: recentListings };
      default:
        return { title: '', subtitle: '', listings: [] };
    }
  };

  const renderFeaturedItem = useCallback(
    ({ item }: { item: Listing }) => (
      <View className="mr-3">
        <ListingCard
          listing={item}
          width={FEATURED_CARD_WIDTH}
          variant="featured"
          onPress={() => navigateToListing(item._id)}
          isFavorite={favoriteIds.has(item._id)}
          onFavoriteToggle={(fav) => handleFavoriteToggle(item._id, fav)}
        />
      </View>
    ),
    [navigateToListing, favoriteIds, handleFavoriteToggle]
  );

  const renderGridItem = useCallback(
    ({ item, index }: { item: Listing; index: number }) => (
      <View className={index % 2 === 0 ? 'pr-2' : 'pl-2'} style={{ width: '50%' }}>
        <ListingCard
          listing={item}
          width={CARD_WIDTH}
          onPress={() => navigateToListing(item._id)}
          isFavorite={favoriteIds.has(item._id)}
          onFavoriteToggle={(fav) => handleFavoriteToggle(item._id, fav)}
        />
      </View>
    ),
    [navigateToListing, favoriteIds, handleFavoriteToggle]
  );

  const renderRecentItem = useCallback(
    ({ item }: { item: Listing }) => (
      <View className="mr-3" style={{ width: SCREEN_WIDTH * 0.75 }}>
        <ListingCardHorizontal
          listing={item}
          onPress={() => navigateToListing(item._id)}
          isFavorite={favoriteIds.has(item._id)}
          onFavoriteToggle={(fav) => handleFavoriteToggle(item._id, fav)}
        />
      </View>
    ),
    [navigateToListing, favoriteIds, handleFavoriteToggle]
  );

  const renderSkeletons = () => (
    <View className="px-4">
      {/* Greeting skeleton */}
      <View className="mb-4 mt-2">
        <Skeleton variant="text" width={180} height={28} className="mb-1" />
        <Skeleton variant="text" width={220} height={16} />
      </View>
      {/* Search skeleton */}
      <Skeleton variant="rect" height={52} className="mb-4 rounded-full" />
      {/* Category skeleton */}
      <View className="mb-6 flex-row">
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} className="mr-3 items-center">
            <Skeleton variant="rect" width={48} height={48} className="mb-2 rounded-xl" />
            <Skeleton variant="text" width={50} height={12} />
          </View>
        ))}
      </View>
      {/* Featured skeleton */}
      <Skeleton variant="text" width={120} height={22} className="mb-3" />
      <View className="flex-row">
        <Skeleton variant="card" width={FEATURED_CARD_WIDTH} height={240} className="mr-4 rounded-2xl" />
        <Skeleton variant="card" width={FEATURED_CARD_WIDTH} height={240} className="rounded-2xl" />
      </View>
      {/* Grid skeleton */}
      <Skeleton variant="text" width={150} height={22} className="mb-3 mt-6" />
      <View className="flex-row">
        <Skeleton variant="card" width={CARD_WIDTH} height={200} className="mr-2 rounded-2xl" />
        <Skeleton variant="card" width={CARD_WIDTH} height={200} className="rounded-2xl" />
      </View>
    </View>
  );

  if (initialLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="pt-2">{renderSkeletons()}</View>
      </SafeAreaView>
    );
  }

  const sheetData = getSheetData();
  const popularPreview = listings.slice(0, POPULAR_PREVIEW_COUNT);
  const recentPreview = recentListings.slice(0, RECENT_PREVIEW_COUNT);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: LAYOUT.SCREEN_BOTTOM_PADDING }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary[500]} />
        }
      >
        {/* Greeting Header */}
        <View className="flex-row items-start justify-between px-5 pb-2 pt-4">
          <View className="flex-1">
            <Text variant="h3" weight="bold" color={COLORS.neutral[600]}>
              Discover Events
            </Text>
            <Text variant="caption" color={COLORS.neutral[400]} className="mt-0.5">
              Find the best services for your events
            </Text>
          </View>
          <TouchableOpacity
            onPress={openSidebar}
            activeOpacity={0.7}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: COLORS.neutral[50],
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: COLORS.neutral[100],
            }}
          >
            <Ionicons name="menu" size={22} color={COLORS.neutral[600]} />
          </TouchableOpacity>
        </View>

        {/* Search Bar + Filter Button */}
        <View className="flex-row items-center px-4 pb-1 pt-2">
          <View className="flex-1">
            <SearchBar
              value={searchText}
              onChangeText={handleSearchTextChange}
              onSubmit={handleSearchSubmit}
              onClear={handleSearchClear}
              animatePlaceholder
              showShadow
            />
          </View>
          <TouchableOpacity
            onPress={() => setFilterVisible(true)}
            activeOpacity={0.7}
            className="ml-3 items-center justify-center rounded-full border border-neutral-100 bg-neutral-50"
            style={{ width: 48, height: 48 }}
          >
            <Ionicons name="options-outline" size={22} color={COLORS.neutral[500]} />
            {activeFilterCount > 0 && (
              <View
                className="absolute -right-1 -top-1 items-center justify-center rounded-full"
                style={{ width: 20, height: 20, backgroundColor: COLORS.primary[500] }}
              >
                <Text
                  variant="caption"
                  weight="bold"
                  color="#FFFFFF"
                  style={{ fontSize: 11, lineHeight: 13 }}
                >
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Search Suggestions - shown when search is empty */}
        {!isSearchMode && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            className="pb-2 pt-1"
          >
            {['Wedding Venues', 'Catering', 'Photography', 'Decor', 'DJ & Music', 'Marquee'].map(
              (suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  onPress={() => {
                    setSearchText(suggestion);
                    performSearch(suggestion, selectedCategory, bottomSheetFilters);
                  }}
                  className="flex-row items-center rounded-full border border-neutral-100 bg-neutral-50 px-3 py-1.5"
                >
                  <Ionicons name="search" size={13} color={COLORS.neutral[400]} />
                  <Text variant="caption" color={COLORS.neutral[500]} className="ml-1.5">
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        )}

        {/* Categories */}
        <View className="pb-3 pt-1">
          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        </View>

        {isSearchMode ? (
          /* ---- Search Results Mode ---- */
          <View className="px-4 pb-5 pt-2">
            {activeFilterCount > 0 && (
              <View className="mb-3 flex-row items-center justify-between">
                <Text variant="caption" color={COLORS.neutral[400]}>
                  {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setBottomSheetFilters({});
                    if (searchText.trim()) {
                      performSearch(searchText, selectedCategory, {});
                    } else {
                      setSearchResults([]);
                    }
                  }}
                >
                  <Text variant="caption" weight="semibold" color={COLORS.primary[500]}>
                    Clear filters
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {searchLoading ? (
              <View className="items-center py-16">
                <ActivityIndicator size="large" color={COLORS.primary[500]} />
                <Text variant="caption" color={COLORS.neutral[400]} className="mt-3">
                  Searching...
                </Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View>
                <EmptyState
                  icon="search-outline"
                  title="No results found"
                  description="Try different keywords or adjust your filters"
                />
                <View className="mt-4 rounded-2xl bg-neutral-50 p-4">
                  <Text variant="caption" weight="semibold" color={COLORS.neutral[500]} className="mb-2">
                    You can search by:
                  </Text>
                  {[
                    { icon: 'business-outline' as const, text: 'Venue name — "Royal Marquee"' },
                    { icon: 'briefcase-outline' as const, text: 'Service type — "catering", "photographer"' },
                    { icon: 'location-outline' as const, text: 'City — "Lahore", "Karachi"' },
                    { icon: 'pricetag-outline' as const, text: 'Keywords — "wedding", "birthday"' },
                  ].map((hint) => (
                    <View key={hint.text} className="mb-1.5 flex-row items-center">
                      <Ionicons name={hint.icon} size={14} color={COLORS.neutral[400]} />
                      <Text variant="caption" color={COLORS.neutral[400]} className="ml-2">
                        {hint.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <>
                <Text variant="caption" color={COLORS.neutral[400]} className="mb-3">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </Text>
                <FlatList
                  data={searchResults}
                  renderItem={renderGridItem}
                  keyExtractor={(item) => `search-${item._id}`}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={{ marginBottom: 12 }}
                />
              </>
            )}
          </View>
        ) : (
          /* ---- Normal Explore Mode ---- */
          <>
            {/* Featured Section */}
            {featuredListings.length > 0 && (
              <View className="pb-5 pt-2">
                <SectionHeader
                  title="Featured"
                  subtitle="Hand-picked event services"
                  className="px-4"
                  onActionPress={featuredListings.length > 3 ? () => setActiveSheet('featured') : undefined}
                />
                <FlatList
                  data={featuredListings}
                  renderItem={renderFeaturedItem}
                  keyExtractor={(item) => `featured-${item._id}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                />
              </View>
            )}

            {/* Popular Near You */}
            <View className="px-4 pb-5 pt-2">
              <SectionHeader
                title="Popular Near You"
                subtitle="Top-rated event services"
                onActionPress={listings.length > POPULAR_PREVIEW_COUNT ? () => setActiveSheet('popular') : undefined}
              />
              {listingsLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="small" color={COLORS.primary[500]} />
                </View>
              ) : listings.length === 0 ? (
                <View className="items-center py-8">
                  <Text variant="body" color={COLORS.neutral[400]}>
                    No listings found
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={popularPreview}
                  renderItem={renderGridItem}
                  keyExtractor={(item) => `popular-${item._id}`}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={{ marginBottom: 12 }}
                />
              )}
            </View>

            {/* Recently Added */}
            {recentPreview.length > 0 && (
              <View className="pb-6 pt-2">
                <SectionHeader
                  title="Recently Added"
                  subtitle="Fresh new listings"
                  className="px-4"
                  onActionPress={recentListings.length > RECENT_PREVIEW_COUNT ? () => setActiveSheet('recent') : undefined}
                />
                <FlatList
                  data={recentPreview}
                  renderItem={renderRecentItem}
                  keyExtractor={(item) => `recent-${item._id}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        filters={bottomSheetFilters}
        onApply={handleFilterApply}
      />

      {/* Bottom Sheet Modal for See All */}
      <ListingsBottomSheet
        visible={activeSheet !== null}
        onClose={() => setActiveSheet(null)}
        title={sheetData.title}
        subtitle={sheetData.subtitle}
        listings={sheetData.listings}
        favoriteIds={favoriteIds}
        onListingPress={(id) => {
          setActiveSheet(null);
          navigateToListing(id);
        }}
        onFavoriteToggle={handleFavoriteToggle}
      />

      {/* Sidebar Drawer */}
      <Modal visible={menuVisible} transparent animationType="none" onRequestClose={closeSidebar}>
        <View style={{ flex: 1 }}>
          {/* Dark backdrop */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              opacity: backdropAnim,
            }}
          >
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeSidebar} />
          </Animated.View>

          {/* Sidebar Panel */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: SCREEN_WIDTH * 0.82,
              backgroundColor: '#FFFFFF',
              transform: [{ translateX: slideAnim }],
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: -6, height: 0 }, shadowOpacity: 0.18, shadowRadius: 24 },
                android: { elevation: 24 },
                default: {},
              }),
            }}
          >
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
              {/* Green Header Area */}
              <View
                style={{
                  backgroundColor: COLORS.primary[500],
                  paddingHorizontal: 20,
                  paddingTop: Platform.OS === 'ios' ? 8 : 16,
                  paddingBottom: 24,
                  borderBottomLeftRadius: 24,
                }}
              >
                {/* Close Button */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <TouchableOpacity
                    onPress={closeSidebar}
                    activeOpacity={0.7}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* User Info */}
                {isAuthenticated && user ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 27,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: 'rgba(255,255,255,0.3)',
                      }}
                    >
                      <Text variant="h4" weight="bold" color="#FFFFFF">
                        {(user.firstName?.[0] || '').toUpperCase()}
                        {(user.lastName?.[0] || '').toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text variant="body" weight="bold" color="#FFFFFF" numberOfLines={1}>
                        {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`}
                      </Text>
                      <Text variant="caption" color={COLORS.primary[200]} numberOfLines={1} style={{ marginTop: 3 }}>
                        {user.email || ''}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      closeSidebar();
                      dispatch(clearAuth());
                    }}
                    activeOpacity={0.8}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                  >
                    <View
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 27,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: 'rgba(255,255,255,0.3)',
                      }}
                    >
                      <Ionicons name="person-outline" size={24} color="#FFFFFF" />
                    </View>
                    <View style={{ marginLeft: 14 }}>
                      <Text variant="body" weight="bold" color="#FFFFFF">
                        Login / Sign Up
                      </Text>
                      <Text variant="caption" color={COLORS.primary[200]} style={{ marginTop: 3 }}>
                        Tap to access your account
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Client / Provider Toggle */}
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: 20,
                    borderRadius: 12,
                    backgroundColor: 'rgba(0,0,0,0.15)',
                    padding: 3,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      paddingVertical: 9,
                      borderRadius: 10,
                      backgroundColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="person" size={14} color={COLORS.primary[500]} style={{ marginRight: 6 }} />
                    <Text variant="label" weight="bold" color={COLORS.primary[500]}>
                      Client
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      paddingVertical: 9,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: vendor?.status === 'approved' ? 1 : 0.5,
                    }}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (vendor?.status === 'approved') {
                        closeSidebar();
                        dispatch(switchRole());
                      }
                    }}
                  >
                    <Ionicons name="storefront-outline" size={14} color="rgba(255,255,255,0.7)" style={{ marginRight: 6 }} />
                    <Text variant="label" weight="semibold" color="rgba(255,255,255,0.7)">
                      Provider
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Menu Section */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 10 }}
                showsVerticalScrollIndicator={false}
              >
                {isAuthenticated ? (
                  <>
                    {/* Quick Actions */}
                    <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
                      <Text variant="caption" weight="semibold" color={COLORS.neutral[300]} style={{ marginBottom: 10, letterSpacing: 0.8 }}>
                        ACCOUNT
                      </Text>
                    </View>
                    {[
                      { icon: 'person-outline' as const, label: 'Edit Profile', desc: 'Update your information', action: () => { closeSidebar(); navigation.navigate('EditProfileScreen'); } },
                      { icon: 'heart-outline' as const, label: 'My Wishlist', desc: 'Saved venues & services', action: () => { closeSidebar(); navigation.getParent()?.navigate('WishlistTab'); } },
                      { icon: 'calendar-outline' as const, label: 'My Bookings', desc: 'Track your reservations', action: () => { closeSidebar(); navigation.getParent()?.navigate('BookingsTab'); } },
                      { icon: 'notifications-outline' as const, label: 'Notifications', desc: 'Alerts & updates', action: () => { closeSidebar(); navigation.navigate('NotificationsScreen'); } },
                    ].map((item, index) => (
                      <TouchableOpacity
                        key={item.label}
                        onPress={item.action}
                        activeOpacity={0.6}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 13,
                          paddingHorizontal: 20,
                          marginBottom: index === 3 ? 0 : 0,
                        }}
                      >
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            backgroundColor: COLORS.neutral[50],
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 14,
                          }}
                        >
                          <Ionicons name={item.icon} size={20} color={COLORS.neutral[500]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="body" weight="semibold" color={COLORS.neutral[600]}>
                            {item.label}
                          </Text>
                          <Text variant="caption" color={COLORS.neutral[300]} style={{ marginTop: 1 }}>
                            {item.desc}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.neutral[200]} />
                      </TouchableOpacity>
                    ))}

                    {/* Divider */}
                    <View style={{ height: 1, backgroundColor: COLORS.neutral[50], marginHorizontal: 20, marginVertical: 14 }} />

                    {/* Provider Section */}
                    <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
                      <Text variant="caption" weight="semibold" color={COLORS.neutral[300]} style={{ marginBottom: 10, letterSpacing: 0.8 }}>
                        BUSINESS
                      </Text>
                    </View>
                    {!vendor ? (
                      /* No vendor — Become a Provider */
                      <TouchableOpacity
                        onPress={() => {
                          closeSidebar();
                          setProviderModalVisible(true);
                        }}
                        activeOpacity={0.6}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 20 }}
                      >
                        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.primary[50], alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                          <Ionicons name="storefront-outline" size={20} color={COLORS.primary[500]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="body" weight="semibold" color={COLORS.primary[500]}>Become a Provider</Text>
                          <Text variant="caption" color={COLORS.neutral[300]} style={{ marginTop: 1 }}>Start your business journey</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.neutral[200]} />
                      </TouchableOpacity>
                    ) : vendor.status === 'approved' ? (
                      /* Approved — Provider Dashboard */
                      <TouchableOpacity
                        onPress={() => { closeSidebar(); dispatch(switchRole()); }}
                        activeOpacity={0.6}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 20 }}
                      >
                        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.secondary[50], alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                          <Ionicons name="swap-horizontal-outline" size={20} color={COLORS.secondary[500]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="body" weight="semibold" color={COLORS.secondary[500]}>Provider Dashboard</Text>
                          <Text variant="caption" color={COLORS.neutral[300]} style={{ marginTop: 1 }}>Manage listings & bookings</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.neutral[200]} />
                      </TouchableOpacity>
                    ) : (
                      /* Pending / Rejected / Suspended — Status info */
                      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 20 }}>
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            backgroundColor: vendor.status === 'pending' ? COLORS.warningLight : COLORS.errorLight,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 14,
                          }}
                        >
                          <Ionicons
                            name={vendor.status === 'pending' ? 'time-outline' : 'close-circle-outline'}
                            size={20}
                            color={vendor.status === 'pending' ? COLORS.warning : COLORS.error}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="body" weight="semibold" color={COLORS.neutral[600]}>
                            {vendor.status === 'pending' ? 'Pending Approval' : vendor.status === 'rejected' ? 'Registration Rejected' : 'Account Suspended'}
                          </Text>
                          <Text variant="caption" color={COLORS.neutral[300]} style={{ marginTop: 1 }}>
                            {vendor.status === 'pending' ? 'Waiting for admin review' : vendor.status === 'rejected' ? 'Contact support for details' : 'Your account has been suspended'}
                          </Text>
                        </View>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 8,
                            backgroundColor: vendor.status === 'pending' ? COLORS.warningLight : COLORS.errorLight,
                          }}
                        >
                          <Text
                            variant="caption"
                            weight="bold"
                            color={vendor.status === 'pending' ? COLORS.warning : COLORS.error}
                            style={{ fontSize: 10, textTransform: 'uppercase' }}
                          >
                            {vendor.status}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Divider */}
                    <View style={{ height: 1, backgroundColor: COLORS.neutral[50], marginHorizontal: 20, marginVertical: 14 }} />

                    {/* Support */}
                    <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
                      <Text variant="caption" weight="semibold" color={COLORS.neutral[300]} style={{ marginBottom: 10, letterSpacing: 0.8 }}>
                        SUPPORT
                      </Text>
                    </View>
                    {[
                      { icon: 'settings-outline' as const, label: 'Settings', action: () => { closeSidebar(); navigation.navigate('SettingsScreen'); } },
                      { icon: 'help-circle-outline' as const, label: 'Help & Support', action: () => { closeSidebar(); } },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.label}
                        onPress={item.action}
                        activeOpacity={0.6}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 13,
                          paddingHorizontal: 20,
                        }}
                      >
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            backgroundColor: COLORS.neutral[50],
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 14,
                          }}
                        >
                          <Ionicons name={item.icon} size={20} color={COLORS.neutral[500]} />
                        </View>
                        <Text variant="body" weight="semibold" color={COLORS.neutral[600]} style={{ flex: 1 }}>
                          {item.label}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.neutral[200]} />
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  /* Not authenticated — minimal menu */
                  <>
                    <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
                      <Text variant="caption" weight="semibold" color={COLORS.neutral[300]} style={{ marginBottom: 10, letterSpacing: 0.8 }}>
                        GET STARTED
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => { closeSidebar(); setProviderModalVisible(true); }}
                      activeOpacity={0.6}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 20 }}
                    >
                      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.primary[50], alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Ionicons name="storefront-outline" size={20} color={COLORS.primary[500]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="body" weight="semibold" color={COLORS.primary[500]}>Become a Provider</Text>
                        <Text variant="caption" color={COLORS.neutral[300]} style={{ marginTop: 1 }}>List your services</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.neutral[200]} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { closeSidebar(); }}
                      activeOpacity={0.6}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 20 }}
                    >
                      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.neutral[50], alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Ionicons name="help-circle-outline" size={20} color={COLORS.neutral[500]} />
                      </View>
                      <Text variant="body" weight="semibold" color={COLORS.neutral[600]} style={{ flex: 1 }}>Help & Support</Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.neutral[200]} />
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>

              {/* Bottom area — Logout + Version */}
              <View style={{ paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 8 : 16 }}>
                {isAuthenticated && (
                  <TouchableOpacity
                    onPress={() => {
                      closeSidebar();
                      dispatch(clearAuth());
                    }}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 13,
                      borderRadius: 14,
                      backgroundColor: COLORS.errorLight,
                      marginBottom: 12,
                    }}
                  >
                    <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
                    <Text variant="label" weight="bold" color={COLORS.error} style={{ marginLeft: 8 }}>
                      Log Out
                    </Text>
                  </TouchableOpacity>
                )}
                <Text
                  variant="caption"
                  color={COLORS.neutral[200]}
                  style={{ textAlign: 'center', marginTop: isAuthenticated ? 0 : 8 }}
                >
                  Events Platform v1.0
                </Text>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

      {/* Become Provider Modal */}
      <BecomeProviderModal
        visible={providerModalVisible}
        onClose={() => setProviderModalVisible(false)}
        onSuccess={() => fetchData()}
      />
    </SafeAreaView>
  );
}
