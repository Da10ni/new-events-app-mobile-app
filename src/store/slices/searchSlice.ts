import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Listing, ListingFilter } from '../../types';

interface SearchState {
  query: string;
  filters: ListingFilter;
  results: Listing[];
  recentSearches: string[];
  loading: boolean;
}

const initialState: SearchState = {
  query: '',
  filters: {},
  results: [],
  recentSearches: [],
  loading: false,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => { state.query = action.payload; },
    setFilters: (state, action: PayloadAction<ListingFilter>) => { state.filters = action.payload; },
    setResults: (state, action: PayloadAction<Listing[]>) => { state.results = action.payload; state.loading = false; },
    setLoading: (state, action: PayloadAction<boolean>) => { state.loading = action.payload; },
    addRecentSearch: (state, action: PayloadAction<string>) => {
      state.recentSearches = [action.payload, ...state.recentSearches.filter((s) => s !== action.payload)].slice(0, 10);
    },
    clearSearch: (state) => { state.query = ''; state.filters = {}; state.results = []; },
  },
});

export const { setQuery, setFilters, setResults, setLoading, addRecentSearch, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
