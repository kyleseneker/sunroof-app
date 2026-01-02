/**
 * Location Service
 */

import type { MemoryLocation } from '@/types';

export interface GeolocationResult {
  latitude: number;
  longitude: number;
}

/**
 * Get current position using browser Geolocation API
 * Returns null if geolocation is not available or permission denied
 */
export async function getCurrentPosition(): Promise<GeolocationResult | null> {
  // Check if geolocation is available
  if (!navigator.geolocation) {
    console.warn('[Location] Geolocation not supported');
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        // Don't treat permission denial as an error, just return null
        console.warn('[Location] Geolocation error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // Cache position for 1 minute
      }
    );
  });
}

/**
 * Reverse geocode coordinates to get a place name
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
      {
        headers: {
          'User-Agent': 'Sunroof App (https://getsunroof.com)',
        },
      }
    );

    if (!response.ok) {
      console.warn('[Location] Reverse geocode failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    // Build a concise location name from the response
    const address = data.address || {};
    
    // Priority: landmark/POI > neighborhood > city > county
    const parts: string[] = [];
    
    // Add specific place if available
    const specificPlace = 
      address.tourism ||
      address.amenity ||
      address.building ||
      address.historic ||
      address.leisure ||
      address.shop;
    
    if (specificPlace) {
      parts.push(specificPlace);
    }
    
    // Add locality
    const locality = 
      address.neighbourhood ||
      address.suburb ||
      address.village ||
      address.town ||
      address.city;
    
    if (locality && locality !== specificPlace) {
      parts.push(locality);
    }
    
    // Add region/state for context if we have room
    const region = address.state || address.county;
    if (parts.length < 2 && region) {
      parts.push(region);
    }
    
    // Add country if we only have one part
    if (parts.length === 1 && address.country) {
      parts.push(address.country);
    }
    
    // Fallback to display_name if we couldn't parse anything useful
    if (parts.length === 0) {
      return data.display_name?.split(',').slice(0, 2).join(', ') || null;
    }
    
    return parts.slice(0, 2).join(', ');
  } catch (error) {
    console.error('[Location] Reverse geocode error:', error);
    return null;
  }
}

/**
 * Get full location data (coordinates + name) for current position
 */
export async function getLocationContext(): Promise<MemoryLocation | null> {
  const position = await getCurrentPosition();
  
  if (!position) {
    return null;
  }
  
  // Get place name in parallel (don't block on this)
  const name = await reverseGeocode(position.latitude, position.longitude);
  
  return {
    latitude: position.latitude,
    longitude: position.longitude,
    name: name || undefined,
  };
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lonDir = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(4)}°${latDir}, ${Math.abs(longitude).toFixed(4)}°${lonDir}`;
}

