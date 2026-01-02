/**
 * Journey gradient utilities for consistent card styling
 */

import { JOURNEY_GRADIENT_PALETTES } from '@/lib/constants';

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getJourneyGradient(journeyName: string): {
  gradient: string;
  overlayOpacity: number;
} {
  const hash = hashString(journeyName.toLowerCase());
  const palette = JOURNEY_GRADIENT_PALETTES[hash % JOURNEY_GRADIENT_PALETTES.length];
  
  const colorStops = palette.colors
    .map((color, i) => {
      const position = (i / (palette.colors.length - 1)) * 100;
      return `${color} ${position}%`;
    })
    .join(', ');
  
  return {
    gradient: `linear-gradient(${palette.angle}deg, ${colorStops})`,
    overlayOpacity: 0.4,
  };
}

export function getJourneyPrimaryColor(journeyName: string): string {
  const hash = hashString(journeyName.toLowerCase());
  const palette = JOURNEY_GRADIENT_PALETTES[hash % JOURNEY_GRADIENT_PALETTES.length];
  return palette.colors[0];
}
