import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Category } from '../../types';

interface CategoryState {
  categories: Category[];
  selectedCategory: string | null;
  loading: boolean;
}

const initialState: CategoryState = {
  categories: [],
  selectedCategory: null,
  loading: false,
};

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    setCategories: (state, action: PayloadAction<Category[]>) => { state.categories = action.payload; state.loading = false; },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => { state.selectedCategory = action.payload; },
    setLoading: (state, action: PayloadAction<boolean>) => { state.loading = action.payload; },
  },
});

export const { setCategories, setSelectedCategory, setLoading } = categorySlice.actions;
export default categorySlice.reducer;
