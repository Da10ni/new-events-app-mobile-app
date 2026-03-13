export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const debounce = <T extends (...args: unknown[]) => void>(fn: T, ms: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    // Booking statuses
    inquiry: '#428BFF',
    pending: '#FFB400',
    confirmed: '#10B981',
    rejected: '#C13515',
    cancelled: '#717171',
    completed: '#0D7C5F',
    // Listing statuses
    active: '#10B981',
    inactive: '#717171',
    draft: '#B0B0B0',
    suspended: '#C13515',
  };
  return colors[status] || '#717171';
};

export const getBookingStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    inquiry: 'Inquiry',
    pending: 'Pending',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    completed: 'Completed',
  };
  return labels[status] || status;
};
