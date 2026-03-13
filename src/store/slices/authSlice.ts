import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Vendor } from '../../types';

interface AuthState {
  user: User | null;
  vendor: Vendor | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: 'client' | 'vendor' | 'admin' | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  vendor: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  role: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; vendor?: Vendor | null; accessToken: string; refreshToken: string }>) => {
      state.user = action.payload.user;
      state.vendor = action.payload.vendor || null;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.role = 'client'; // Always default to client view
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setVendor: (state, action: PayloadAction<Vendor>) => {
      state.vendor = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearAuth: (state) => {
      Object.assign(state, initialState);
    },
    switchRole: (state) => {
      if (state.role === 'client') state.role = 'vendor';
      else if (state.role === 'vendor') state.role = 'client';
    },
  },
});

export const { setLoading, setCredentials, setUser, setVendor, setError, clearAuth, switchRole } = authSlice.actions;
export default authSlice.reducer;
