import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Listing } from '../../types';

interface ListingState {
  listings: Listing[];
  featuredListings: Listing[];
  selectedListing: Listing | null;
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
}

const initialState: ListingState = {
  listings: [],
  featuredListings: [],
  selectedListing: null,
  loading: false,
  error: null,
  page: 1,
  hasMore: true,
};

const listingSlice = createSlice({
  name: 'listing',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => { state.loading = action.payload; },
    setListings: (state, action: PayloadAction<{ listings: Listing[]; hasMore: boolean }>) => {
      state.listings = action.payload.listings;
      state.hasMore = action.payload.hasMore;
      state.loading = false;
    },
    appendListings: (state, action: PayloadAction<{ listings: Listing[]; hasMore: boolean }>) => {
      state.listings = [...state.listings, ...action.payload.listings];
      state.hasMore = action.payload.hasMore;
      state.page += 1;
      state.loading = false;
    },
    setFeaturedListings: (state, action: PayloadAction<Listing[]>) => { state.featuredListings = action.payload; },
    setSelectedListing: (state, action: PayloadAction<Listing | null>) => { state.selectedListing = action.payload; },
    setError: (state, action: PayloadAction<string>) => { state.error = action.payload; state.loading = false; },
    resetListings: (state) => { state.listings = []; state.page = 1; state.hasMore = true; },
  },
});

export const { setLoading, setListings, appendListings, setFeaturedListings, setSelectedListing, setError, resetListings } = listingSlice.actions;
export default listingSlice.reducer;
