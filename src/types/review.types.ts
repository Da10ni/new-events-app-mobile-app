export interface Review {
  _id: string;
  booking: string;
  listing: string;
  vendor: string;
  client: { _id: string; firstName: string; lastName: string; avatar: { url: string } };
  rating: number;
  title?: string;
  comment: string;
  detailedRatings?: {
    quality?: number;
    communication?: number;
    valueForMoney?: number;
    punctuality?: number;
  };
  images: Array<{ url: string; publicId: string }>;
  vendorReply?: { comment: string; repliedAt: string };
  isVisible: boolean;
  createdAt: string;
}
