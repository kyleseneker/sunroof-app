import { NextResponse } from 'next/server';

const UNSPLASH_PHOTO_ID = 'iHt-NM9sSRE';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

export async function GET() {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!accessKey) {
    // Fallback to a gradient if no API key
    return NextResponse.json({ error: 'No API key' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/photos/${UNSPLASH_PHOTO_ID}`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          'Accept-Version': 'v1',
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: response.status });
    }

    const photo = await response.json();
    
    // Get the optimized regular size URL (1080px wide)
    const imageUrl = `${photo.urls.regular}&w=1920&q=80`;

    // Redirect to the actual image
    return NextResponse.redirect(imageUrl);
  } catch (error) {
    console.error('Unsplash fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
