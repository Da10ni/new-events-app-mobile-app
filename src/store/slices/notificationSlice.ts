import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: { entityType?: string; entityId?: string; actionUrl?: string };
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<NotificationItem[]>) => { state.notifications = action.payload; state.loading = false; },
    setUnreadCount: (state, action: PayloadAction<number>) => { state.unreadCount = action.payload; },
    markRead: (state, action: PayloadAction<string>) => {
      const n = state.notifications.find((n) => n._id === action.payload);
      if (n && !n.isRead) { n.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => { n.isRead = true; });
      state.unreadCount = 0;
    },
    setLoading: (state, action: PayloadAction<boolean>) => { state.loading = action.payload; },
  },
});

export const { setNotifications, setUnreadCount, markRead, markAllRead, setLoading } = notificationSlice.actions;
export default notificationSlice.reducer;
