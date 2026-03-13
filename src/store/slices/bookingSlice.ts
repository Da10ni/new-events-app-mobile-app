import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Booking } from '../../types';

interface BookingState {
  bookings: Booking[];
  selectedBooking: Booking | null;
  loading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  bookings: [],
  selectedBooking: null,
  loading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => { state.loading = action.payload; },
    setBookings: (state, action: PayloadAction<Booking[]>) => { state.bookings = action.payload; state.loading = false; },
    setSelectedBooking: (state, action: PayloadAction<Booking | null>) => { state.selectedBooking = action.payload; },
    updateBooking: (state, action: PayloadAction<Booking>) => {
      const idx = state.bookings.findIndex((b) => b._id === action.payload._id);
      if (idx !== -1) state.bookings[idx] = action.payload;
      if (state.selectedBooking?._id === action.payload._id) state.selectedBooking = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => { state.error = action.payload; state.loading = false; },
  },
});

export const { setLoading, setBookings, setSelectedBooking, updateBooking, setError } = bookingSlice.actions;
export default bookingSlice.reducer;
