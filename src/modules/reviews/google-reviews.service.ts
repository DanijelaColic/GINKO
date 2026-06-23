import { unstable_cache } from 'next/cache';
import { SITE_NAME } from '@/modules/booking/booking.config';
import {
  PROPERTY_ADDRESS,
  PROPERTY_MAP_URL,
} from '@/modules/property/property-details.config';
import type { GoogleReview, GoogleReviewsData } from './google-reviews.types';

const PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places';
const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK =
  'rating,userRatingCount,reviews,displayName,googleMapsUri';
const CACHE_TAG = 'google-reviews';
const REVALIDATE_SECONDS = 86_400;

type PlacesReview = {
  name?: string;
  rating?: number;
  publishTime?: string;
  relativePublishTimeDescription?: string;
  text?: { text?: string };
  authorAttribution?: {
    displayName?: string;
    photoUri?: string;
  };
};

type PlaceDetailsResponse = {
  rating?: number;
  userRatingCount?: number;
  displayName?: { text?: string };
  googleMapsUri?: string;
  reviews?: PlacesReview[];
};

type TextSearchResponse = {
  places?: { id?: string }[];
};

function mapReview(review: PlacesReview, index: number): GoogleReview | null {
  const text = review.text?.text?.trim();
  const author = review.authorAttribution?.displayName?.trim();
  const rating = review.rating;

  if (!text || !author || rating == null) return null;

  return {
    id: review.name ?? `google-review-${index}`,
    author,
    text,
    rating,
    date: review.publishTime ?? new Date().toISOString(),
    relativeTime: review.relativePublishTimeDescription,
    photoUrl: review.authorAttribution?.photoUri,
  };
}

async function resolvePlaceId(apiKey: string): Promise<string | null> {
  const configuredPlaceId = process.env.GOOGLE_PLACE_ID?.trim();
  if (configuredPlaceId) return configuredPlaceId;

  const response = await fetch(PLACES_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id',
    },
    body: JSON.stringify({
      textQuery: `Ginko sobe Daruvar ${PROPERTY_ADDRESS}`,
      languageCode: 'hr',
      regionCode: 'HR',
    }),
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    console.error(
      '[google-reviews] Text search failed:',
      response.status,
      await response.text(),
    );
    return null;
  }

  const data = (await response.json()) as TextSearchResponse;
  return data.places?.[0]?.id ?? null;
}

async function fetchPlaceDetails(
  apiKey: string,
  placeId: string,
): Promise<GoogleReviewsData | null> {
  const response = await fetch(`${PLACES_DETAILS_URL}/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    console.error(
      '[google-reviews] Place details failed:',
      response.status,
      await response.text(),
    );
    return null;
  }

  const place = (await response.json()) as PlaceDetailsResponse;
  const reviews = (place.reviews ?? [])
    .map(mapReview)
    .filter((review): review is GoogleReview => review != null);

  if (place.rating == null || place.userRatingCount == null) {
    return null;
  }

  return {
    rating: place.rating,
    reviewCount: place.userRatingCount,
    reviews,
    googleMapsUri: place.googleMapsUri ?? PROPERTY_MAP_URL,
    placeName: place.displayName?.text ?? SITE_NAME,
    source: 'google',
  };
}

async function fetchGoogleReviewsUncached(): Promise<GoogleReviewsData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) return null;

  const placeId = await resolvePlaceId(apiKey);
  if (!placeId) return null;

  return fetchPlaceDetails(apiKey, placeId);
}

export async function getGoogleReviews(): Promise<GoogleReviewsData | null> {
  return unstable_cache(fetchGoogleReviewsUncached, ['google-reviews-data'], {
    revalidate: REVALIDATE_SECONDS,
    tags: [CACHE_TAG],
  })();
}
