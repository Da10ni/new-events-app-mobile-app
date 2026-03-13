export const formatCurrency = (amount: number, currency = 'PKR'): string => {
  return `${currency} ${amount.toLocaleString()}`;
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateRange = (start: string, end?: string): string => {
  const startDate = formatDate(start);
  if (!end) return startDate;
  return `${startDate} - ${formatDate(end)}`;
};

export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

export const formatPhone = (phone: string): string => {
  return phone.replace(/(\+92)(\d{3})(\d{7})/, '$1 $2 $3');
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};
