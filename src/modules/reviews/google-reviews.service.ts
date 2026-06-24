import { unstable_cache } from 'next/cache';
import { SITE_NAME } from '@/modules/booking/booking.config';
import {
  PROPERTY_ADDRESS,
  PROPERTY_MAP_URL,
} from '@/modules/property/property-details.config';
import type { GoogleReview, GoogleReviewsData } from './google-reviews.types';

const PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places';
const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
/** places.googleapis.com/v1 — New; legacy je maps.googleapis.com/maps/api/place */
const PLACES_API_VARIANT = 'Places API (New)';
const FIELD_MASK =
  'rating,userRatingCount,reviews,displayName,googleMapsUri';
const CACHE_TAG = 'google-reviews';
const REVALIDATE_SECONDS = 86_400;

function logGoogleApiError(
  operation: string,
  url: string,
  status: number,
  body: string,
) {
  console.error(`[google-reviews] ${operation} failed`);
  console.error(`[google-reviews] API: ${PLACES_API_VARIANT}`);
  console.error(`[google-reviews] URL: ${url}`);
  console.error(`[google-reviews] Status: ${status}`);
  console.error(`[google-reviews] Response body: ${body}`);
}

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
    const body = await response.text();
    logGoogleApiError('Text search (places:searchText)', PLACES_SEARCH_URL, response.status, body);
    return null;
  }

  const data = (await response.json()) as TextSearchResponse;
  const placeId = data.places?.[0]?.id ?? null;
  if (!placeId) {
    console.error('[google-reviews] Text search returned no places');
    console.error(`[google-reviews] API: ${PLACES_API_VARIANT}`);
    console.error(`[google-reviews] URL: ${PLACES_SEARCH_URL}`);
    console.error(`[google-reviews] Response body: ${JSON.stringify(data)}`);
  }
  return placeId;
}

async function fetchPlaceDetails(
  apiKey: string,
  placeId: string,
): Promise<GoogleReviewsData | null> {
  const detailsUrl = `${PLACES_DETAILS_URL}/${placeId}`;
  const response = await fetch(detailsUrl, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    const body = await response.text();
    logGoogleApiError('Place details (GetPlace)', detailsUrl, response.status, body);
    return null;
  }

  const place = (await response.json()) as PlaceDetailsResponse;
  const reviews = (place.reviews ?? [])
    .map(mapReview)
    .filter((review): review is GoogleReview => review != null);

  if (place.rating == null || place.userRatingCount == null) {
    console.error('[google-reviews] Place details missing rating or review count');
    console.error(`[google-reviews] API: ${PLACES_API_VARIANT}`);
    console.error(`[google-reviews] URL: ${detailsUrl}`);
    console.error(`[google-reviews] Response body: ${JSON.stringify(place)}`);
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
  if (!apiKey) {
    console.error('[google-reviews] GOOGLE_PLACES_API_KEY is not set');
    return null;
  }

  const placeId = await resolvePlaceId(apiKey);
  if (!placeId) {
    console.error('[google-reviews] Could not resolve place ID');
    return null;
  }

  return fetchPlaceDetails(apiKey, placeId);
}

export async function getGoogleReviews(): Promise<GoogleReviewsData | null> {
  return unstable_cache(fetchGoogleReviewsUncached, ['google-reviews-data'], {
    revalidate: REVALIDATE_SECONDS,
    tags: [CACHE_TAG],
  })();
}
