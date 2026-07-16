// Legacy Worldline Direct webhook — replaced by Saferpay.
// Keep endpoint so old portal configs get a clear response instead of 404.

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Worldline Direct webhook je zamijenjen Saferpayom',
      use: '/api/webhooks/saferpay',
    },
    { status: 410 },
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Worldline Direct webhook je zamijenjen Saferpayom',
      use: '/api/webhooks/saferpay',
    },
    { status: 410 },
  );
}
