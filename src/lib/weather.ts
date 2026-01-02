/**
 * Weather Service - uses Open-Meteo API
 */

import type { MemoryWeather } from '@/types';

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
  };
}

/**
 * Weather code to condition mapping (WMO Weather interpretation codes)
 * https://open-meteo.com/en/docs
 */
const WEATHER_CONDITIONS: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Clear', icon: '☀️' },
  1: { condition: 'Mostly Clear', icon: '🌤️' },
  2: { condition: 'Partly Cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },
  45: { condition: 'Foggy', icon: '🌫️' },
  48: { condition: 'Foggy', icon: '🌫️' },
  51: { condition: 'Light Drizzle', icon: '🌧️' },
  53: { condition: 'Drizzle', icon: '🌧️' },
  55: { condition: 'Heavy Drizzle', icon: '🌧️' },
  56: { condition: 'Freezing Drizzle', icon: '🌧️' },
  57: { condition: 'Freezing Drizzle', icon: '🌧️' },
  61: { condition: 'Light Rain', icon: '🌧️' },
  63: { condition: 'Rain', icon: '🌧️' },
  65: { condition: 'Heavy Rain', icon: '🌧️' },
  66: { condition: 'Freezing Rain', icon: '🌧️' },
  67: { condition: 'Freezing Rain', icon: '🌧️' },
  71: { condition: 'Light Snow', icon: '🌨️' },
  73: { condition: 'Snow', icon: '🌨️' },
  75: { condition: 'Heavy Snow', icon: '🌨️' },
  77: { condition: 'Snow Grains', icon: '🌨️' },
  80: { condition: 'Light Showers', icon: '🌦️' },
  81: { condition: 'Showers', icon: '🌦️' },
  82: { condition: 'Heavy Showers', icon: '🌦️' },
  85: { condition: 'Snow Showers', icon: '🌨️' },
  86: { condition: 'Heavy Snow Showers', icon: '🌨️' },
  95: { condition: 'Thunderstorm', icon: '⛈️' },
  96: { condition: 'Thunderstorm with Hail', icon: '⛈️' },
  99: { condition: 'Thunderstorm with Heavy Hail', icon: '⛈️' },
};

/**
 * Get weather condition info from WMO code
 */
function getWeatherCondition(code: number): { condition: string; icon: string } {
  return WEATHER_CONDITIONS[code] || { condition: 'Unknown', icon: '🌡️' };
}

/**
 * Fetch current weather for given coordinates
 * Uses Open-Meteo API (free, no API key required)
 */
export async function getWeather(
  latitude: number,
  longitude: number
): Promise<MemoryWeather | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code');
    url.searchParams.set('temperature_unit', 'fahrenheit');
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.warn('[Weather] API request failed:', response.status);
      return null;
    }
    
    const data: OpenMeteoResponse = await response.json();
    
    if (!data.current) {
      console.warn('[Weather] No current weather data in response');
      return null;
    }
    
    const { condition, icon } = getWeatherCondition(data.current.weather_code);
    
    return {
      temp: Math.round(data.current.temperature_2m),
      condition,
      icon,
      humidity: data.current.relative_humidity_2m,
    };
  } catch (error) {
    console.error('[Weather] Fetch error:', error);
    return null;
  }
}

/**
 * Format temperature for display
 */
export function formatTemperature(temp: number, unit: 'F' | 'C' = 'F'): string {
  return `${temp}°${unit}`;
}

/**
 * Format weather for compact display
 */
export function formatWeatherCompact(weather: MemoryWeather): string {
  return `${weather.icon} ${weather.temp}°`;
}

/**
 * Format weather for full display
 */
export function formatWeatherFull(weather: MemoryWeather): string {
  return `${weather.icon} ${weather.temp}°F · ${weather.condition}`;
}

