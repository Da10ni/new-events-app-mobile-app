export interface Booking {
  _id: string;
  bookingNumber: string;
  client: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar: { url: string };
  };
  vendor: { _id: string; businessName: string; businessSlug: string };
  listing: {
    _id: string;
    title: string;
    slug: string;
    images: Array<{ url: string }>;
    pricing: { basePrice: number; currency: string; priceUnit: string };
    address: { city: string; country: string };
  };
  eventDate: string;
  eventEndDate?: string;
  eventType?: string;
  guestCount?: number;
  timeSlot?: { startTime: string; endTime: string };
  pricingSnapshot: {
    basePrice: number;
    packageName?: string;
    totalAmount: number;
    currency: string;
  };
  status: string;
  paymentStatus?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
  clientMessage?: string;
  vendorResponse?: string;
  specialRequests?: string;
  cancellationReason?: string;
  isReviewed: boolean;
  createdAt: string;
}

export interface CreateBookingRequest {
  listing: string;
  eventDate: string;
  eventEndDate?: string;
  eventType?: string;
  guestCount?: number;
  timeSlot?: { startTime: string; endTime: string };
  packageName?: string;
  clientMessage?: string;
  specialRequests?: string;
}
