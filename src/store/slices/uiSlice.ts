import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  globalLoading: boolean;
  toast: { visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' };
}

const initialState: UIState = {
  globalLoading: false,
  toast: { visible: false, message: '', type: 'info' },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setGlobalLoading: (state, action: PayloadAction<boolean>) => { state.globalLoading = action.payload; },
    showToast: (state, action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' | 'warning' }>) => {
      state.toast = { visible: true, ...action.payload };
    },
    hideToast: (state) => { state.toast.visible = false; },
  },
});

export const { setGlobalLoading, showToast, hideToast } = uiSlice.actions;
export default uiSlice.reducer;
