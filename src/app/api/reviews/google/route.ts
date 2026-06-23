import { NextResponse } from 'next/server';
import { getGoogleReviews } from '@/modules/reviews/google-reviews.service';

export const revalidate = 86_400;

export async function GET() {
  const data = await getGoogleReviews();

  if (!data) {
    return NextResponse.json(
      { error: 'Google recenzije nisu dostupne' },
      { status: 503 },
    );
  }

  return NextResponse.json(data);
}
