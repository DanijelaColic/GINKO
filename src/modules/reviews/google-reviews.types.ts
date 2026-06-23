export type GoogleReview = {
  id: string;
  author: string;
  text: string;
  rating: number;
  date: string;
  relativeTime?: string;
  photoUrl?: string;
};

export type GoogleReviewsData = {
  rating: number;
  reviewCount: number;
  reviews: GoogleReview[];
  googleMapsUri: string;
  placeName: string;
  source: 'google';
};

export type GoogleReviewSummary = Pick<GoogleReviewsData, 'rating' | 'reviewCount'>;
