/**
 * API route to fetch cover images from Unsplash
 * POST /api/cover-image
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchLocationPhoto } from '@/lib/unsplash';
import { features } from '@/lib/env';

export async function POST(request: NextRequest) {
  // Check if Unsplash is configured
  if (!features.unsplashEnabled) {
    return NextResponse.json(
      { error: 'Unsplash not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const photo = await searchLocationPhoto(
      query,
      process.env.UNSPLASH_ACCESS_KEY!
    );

    if (!photo) {
      return NextResponse.json(
        { error: 'No image found', photo: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ photo });
  } catch (error) {
    console.error('[API/cover-image] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cover image' },
      { status: 500 }
    );
  }
}

