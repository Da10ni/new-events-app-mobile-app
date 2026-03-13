import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProviderListingsStackParamList } from '../../navigation/types';
import { vendorApi } from '../../services/api/vendorApi';
import { listingApi } from '../../services/api/listingApi';
import { Text, Badge, Card, StarRating, Skeleton } from '../../components/ui';
import { EmptyState } from '../../components/layout';
import { ConfirmationModal, BottomSheet } from '../../components/feedback';
import type { Listing } from '../../types';
import { LAYOUT } from '../../config/constants';
import { COLORS } from '../../theme/colors';

type ListingsNav = NativeStackNavigationProp<ProviderListingsStackParamList>;
type TabFilter = 'active' | 'inactive' | 'draft' | 'all';

const TAB_OPTIONS: { key: TabFilter; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'draft', label: 'Draft' },
  { key: 'all', label: 'All' },
];

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

const formatPrice = (listing: Listing): string => {
  const price = listing.pricing?.basePrice || 0;
  const unit = listing.pricing?.priceUnit || '';
  return `PKR ${price.toLocaleString()}${unit ? ` / ${unit}` : ''}`;
};

export default function MyListingsScreen() {
  const navigation = useNavigation<ListingsNav>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('active');
  const [error, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchListings = useCallback(async () => {
    try {
      setError(null);
      const res = await vendorApi.getMyListings({ limit: 100 });
      setListings(res.data?.data?.listings || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchListings();
    });
    return unsubscribe;
  }, [navigation, fetchListings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchListings();
  }, [fetchListings]);

  const filteredListings = listings.filter((l) => {
    if (activeTab === 'all') return true;
    return l.status === activeTab;
  });

  const handleDelete = async () => {
    if (!selectedListing) return;
    try {
      setDeleting(true);
      await listingApi.delete(selectedListing._id);
      setListings((prev) => prev.filter((l) => l._id !== selectedListing._id));
      setShowDeleteConfirm(false);
      setSelectedListing(null);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to delete listing');
    } finally {
      setDeleting(false);
    }
  };

  const handleLongPress = (listing: Listing) => {
    setSelectedListing(listing);
    setShowActions(true);
  };

  const getEmptyStateForTab = (): { icon: keyof typeof Ionicons.glyphMap; title: string; description: string } => {
    switch (activeTab) {
      case 'active':
        return {
          icon: 'list-outline',
          title: 'No Active Listings',
          description: 'Your active listings will appear here. Create a new listing to get started.',
        };
      case 'inactive':
        return {
          icon: 'eye-off-outline',
          title: 'No Inactive Listings',
          description: 'Deactivated or suspended listings will appear here.',
        };
      case 'draft':
        return {
          icon: 'document-outline',
          title: 'No Drafts',
          description: 'Your saved drafts will appear here.',
        };
      default:
        return {
          icon: 'list-outline',
          title: 'No Listings',
          description: 'You haven\'t created any listings yet.',
        };
    }
  };

  const renderListingCard = ({ item }: { item: Listing }) => {
    const coverImage = item.images?.find((img) => img.isPrimary) || item.images?.[0];

    return (
      <Card
        padding="none"
        className="mb-3 mx-4 overflow-hidden"
        onPress={() => navigation.navigate('ListingPreviewScreen', { listingId: item._id })}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => handleLongPress(item)}
          onPress={() => navigation.navigate('ListingPreviewScreen', { listingId: item._id })}
        >
          <View className="flex-row">
            {/* Image */}
            <View className="h-[120px] w-[120px] bg-neutral-50">
              {coverImage?.url ? (
                <Image
                  source={{ uri: coverImage.url }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Ionicons name="image-outline" size={32} color={COLORS.neutral[300]} />
                </View>
              )}
            </View>

            {/* Info */}
            <View className="flex-1 p-3 justify-between">
              <View>
                <View className="flex-row items-center justify-between mb-1">
                  <Text
                    variant="label"
                    weight="semibold"
                    className="flex-1 text-neutral-600"
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Badge
                    text={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    variant={getStatusBadgeVariant(item.status)}
                    className="ml-2"
                  />
                </View>

                <Text variant="caption" color={COLORS.neutral[400]} numberOfLines={1}>
                  {item.category?.name || 'Uncategorized'}
                </Text>
              </View>

              <View>
                <Text variant="label" weight="bold" color={COLORS.primary[500]}>
                  {formatPrice(item)}
                </Text>

                <View className="flex-row items-center justify-between mt-1">
                  {item.averageRating > 0 ? (
                    <StarRating
                      rating={item.averageRating}
                      size={12}
                      showValue
                      reviewCount={item.totalReviews}
                    />
                  ) : (
                    <Text variant="caption" color={COLORS.neutral[300]}>
                      No reviews yet
                    </Text>
                  )}

                  <View className="flex-row items-center">
                    <Ionicons name="eye-outline" size={14} color={COLORS.neutral[300]} />
                    <Text variant="caption" color={COLORS.neutral[300]} className="ml-1">
                      {item.viewCount || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
        <View className="px-4 pt-4">
          <View className="flex-row mb-4">
            {TAB_OPTIONS.map((tab) => (
              <Skeleton key={tab.key} variant="rect" width={70} height={36} className="mr-2" style={{ borderRadius: 18 }} />
            ))}
          </View>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rect" height={120} className="mb-3" />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
      {error && (
        <View className="mx-4 mt-2 rounded-xl bg-error-light px-4 py-3">
          <Text variant="label" color={COLORS.error}>
            {error}
          </Text>
        </View>
      )}

      {/* Tab Selector */}
      <View className="px-4 pt-2 pb-3">
        <View className="flex-row rounded-xl bg-neutral-50 p-1">
          {TAB_OPTIONS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 items-center rounded-lg py-2.5 ${
                activeTab === tab.key ? 'bg-white' : ''
              }`}
              style={
                activeTab === tab.key
                  ? {
                      shadowColor: COLORS.neutral[700],
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 3,
                      elevation: 2,
                    }
                  : undefined
              }
            >
              <Text
                variant="label"
                weight={activeTab === tab.key ? 'semibold' : 'medium'}
                color={activeTab === tab.key ? COLORS.neutral[600] : COLORS.neutral[400]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Listings */}
      <FlatList
        data={filteredListings}
        renderItem={renderListingCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: LAYOUT.SCREEN_BOTTOM_PADDING, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary[500]}
            colors={[COLORS.primary[500]]}
          />
        }
        ListEmptyComponent={() => {
          const emptyState = getEmptyStateForTab();
          return (
            <EmptyState
              icon={emptyState.icon}
              title={emptyState.title}
              description={emptyState.description}
              actionTitle="Create Listing"
              onAction={() => navigation.navigate('AddListingScreen')}
            />
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate('AddListingScreen')}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary-500"
        style={{
          shadowColor: COLORS.primary[500],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={28} color={COLORS.neutral[0]} />
      </TouchableOpacity>

      {/* Actions Bottom Sheet */}
      <BottomSheet
        visible={showActions}
        onClose={() => {
          setShowActions(false);
          setSelectedListing(null);
        }}
        height={280}
      >
        <View className="px-6 pt-2">
          <Text variant="h4" weight="bold" className="mb-4 text-neutral-600">
            {selectedListing?.title}
          </Text>

          <TouchableOpacity
            className="flex-row items-center py-3.5"
            onPress={() => {
              setShowActions(false);
              if (selectedListing) {
                navigation.navigate('EditListingScreen', {
                  listingId: selectedListing._id,
                });
              }
            }}
          >
            <Ionicons name="create-outline" size={22} color={COLORS.neutral[600]} />
            <Text variant="body" weight="medium" className="ml-4 text-neutral-600">
              Edit Listing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center py-3.5"
            onPress={() => {
              setShowActions(false);
              if (selectedListing) {
                navigation.navigate('ListingPreviewScreen', {
                  listingId: selectedListing._id,
                });
              }
            }}
          >
            <Ionicons name="eye-outline" size={22} color={COLORS.neutral[600]} />
            <Text variant="body" weight="medium" className="ml-4 text-neutral-600">
              Preview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center py-3.5"
            onPress={() => {
              setShowActions(false);
              setShowDeleteConfirm(true);
            }}
          >
            <Ionicons name="trash-outline" size={22} color={COLORS.error} />
            <Text variant="body" weight="medium" className="ml-4" color={COLORS.error}>
              Delete Listing
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Delete Confirmation */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Listing"
        message={`Are you sure you want to delete "${selectedListing?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        icon="trash-outline"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedListing(null);
        }}
        loading={deleting}
      />
    </SafeAreaView>
  );
}
