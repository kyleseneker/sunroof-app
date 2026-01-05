/**
 * Unsplash API integration for journey cover images
 */

export interface UnsplashPhoto {
  url: string;
  attribution: string;
  photographerName: string;
  photographerUrl: string;
}

interface UnsplashSearchResult {
  results: Array<{
    id: string;
    urls: {
      raw: string;
      full: string;
      regular: string;
      small: string;
    };
    user: {
      name: string;
      username: string;
      links: {
        html: string;
      };
    };
    alt_description?: string;
  }>;
  total: number;
}

const UNSPLASH_API_URL = 'https://api.unsplash.com';

/**
 * Search for a location photo on Unsplash
 * Returns a high-quality photo suitable for use as a journey cover
 */
export async function searchLocationPhoto(
  query: string,
  accessKey: string
): Promise<UnsplashPhoto | null> {
  if (!accessKey) {
    console.warn('[Unsplash] No access key configured');
    return null;
  }

  try {
    // Search with location-focused parameters
    const searchParams = new URLSearchParams({
      query: query,
      per_page: '1',
      orientation: 'landscape',
      content_filter: 'high', // Only high-quality, safe images
    });

    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?${searchParams}`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          'Accept-Version': 'v1',
        },
      }
    );

    if (!response.ok) {
      console.error('[Unsplash] API error:', response.status, await response.text());
      return null;
    }

    const data: UnsplashSearchResult = await response.json();

    if (data.results.length === 0) {
      console.log('[Unsplash] No results for query:', query);
      return null;
    }

    const photo = data.results[0];

    // Use the 'regular' size (1080px wide) which is already optimized by Unsplash
    const optimizedUrl = `${photo.urls.regular}&w=1200&q=80&fm=webp`;

    return {
      url: optimizedUrl,
      attribution: `Photo by ${photo.user.name} on Unsplash`,
      photographerName: photo.user.name,
      photographerUrl: photo.user.links.html,
    };
  } catch (error) {
    console.error('[Unsplash] Search error:', error);
    return null;
  }
}

/**
 * Track a photo download (required by Unsplash API guidelines)
 * Should be called when the image is actually displayed to the user
 */
export async function trackPhotoDownload(
  photoId: string,
  accessKey: string
): Promise<void> {
  if (!accessKey) return;

  try {
    await fetch(
      `${UNSPLASH_API_URL}/photos/${photoId}/download`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );
  } catch (error) {
    // Non-critical, just log
    console.warn('[Unsplash] Failed to track download:', error);
  }
}

