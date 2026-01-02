import { describe, it, expect } from 'vitest';
import {
  hashString,
  getJourneyGradient,
  getJourneyPrimaryColor,
} from '@/lib';

describe('Gradient Utilities', () => {
  describe('hashString', () => {
    it('returns consistent hash for same string', () => {
      const hash1 = hashString('test');
      const hash2 = hashString('test');
      expect(hash1).toBe(hash2);
    });

    it('returns different hash for different strings', () => {
      const hash1 = hashString('hello');
      const hash2 = hashString('world');
      expect(hash1).not.toBe(hash2);
    });

    it('returns positive number', () => {
      const hash = hashString('negative test');
      expect(hash).toBeGreaterThanOrEqual(0);
    });

    it('handles empty string', () => {
      const hash = hashString('');
      expect(hash).toBe(0);
    });

    it('handles unicode characters', () => {
      const hash = hashString('日本語テスト');
      expect(typeof hash).toBe('number');
      expect(hash).toBeGreaterThanOrEqual(0);
    });

    it('handles long strings', () => {
      const longString = 'a'.repeat(10000);
      const hash = hashString(longString);
      expect(typeof hash).toBe('number');
    });
  });

  describe('getJourneyGradient', () => {
    it('returns gradient object with required properties', () => {
      const result = getJourneyGradient('Beach Vacation');
      
      expect(result).toHaveProperty('gradient');
      expect(result).toHaveProperty('overlayOpacity');
      expect(typeof result.gradient).toBe('string');
      expect(typeof result.overlayOpacity).toBe('number');
    });

    it('returns CSS linear-gradient', () => {
      const { gradient } = getJourneyGradient('Mountain Trip');
      expect(gradient).toMatch(/^linear-gradient\(/);
      expect(gradient).toMatch(/deg,/);
    });

    it('returns consistent gradient for same name', () => {
      const result1 = getJourneyGradient('Tokyo 2024');
      const result2 = getJourneyGradient('Tokyo 2024');
      expect(result1.gradient).toBe(result2.gradient);
    });

    it('is case-insensitive', () => {
      const result1 = getJourneyGradient('Paris');
      const result2 = getJourneyGradient('PARIS');
      const result3 = getJourneyGradient('paris');
      expect(result1.gradient).toBe(result2.gradient);
      expect(result2.gradient).toBe(result3.gradient);
    });

    it('returns different gradients for different names', () => {
      const result1 = getJourneyGradient('Summer in Italy');
      const result2 = getJourneyGradient('Winter in Norway');
      expect(result1.gradient).not.toBe(result2.gradient);
    });

    it('overlay opacity is between 0 and 1', () => {
      const { overlayOpacity } = getJourneyGradient('Any Trip');
      expect(overlayOpacity).toBeGreaterThanOrEqual(0);
      expect(overlayOpacity).toBeLessThanOrEqual(1);
    });

    it('gradient contains color stops', () => {
      const { gradient } = getJourneyGradient('Colorful Journey');
      expect(gradient).toMatch(/#[0-9A-Fa-f]{6}/);
      expect(gradient).toMatch(/\d+%/);
    });
  });

  describe('getJourneyPrimaryColor', () => {
    it('returns hex color', () => {
      const color = getJourneyPrimaryColor('Beach Day');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('returns consistent color for same name', () => {
      const color1 = getJourneyPrimaryColor('Road Trip');
      const color2 = getJourneyPrimaryColor('Road Trip');
      expect(color1).toBe(color2);
    });

    it('is case-insensitive', () => {
      const color1 = getJourneyPrimaryColor('Miami');
      const color2 = getJourneyPrimaryColor('MIAMI');
      expect(color1).toBe(color2);
    });

    it('returns first color of the gradient palette', () => {
      const primaryColor = getJourneyPrimaryColor('Test Trip');
      const { gradient } = getJourneyGradient('Test Trip');
      expect(gradient).toContain(primaryColor);
    });
  });
});

