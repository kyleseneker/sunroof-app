import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnalytics, AnalyticsEvents } from '@/hooks';

describe('useAnalytics', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    consoleSpy.mockRestore();
  });

  describe('trackEvent', () => {
    it('logs event in development', () => {
      process.env.NODE_ENV = 'development';
      const { result } = renderHook(() => useAnalytics());
      
      result.current.trackEvent('test_event', { value: 123 });
      
      expect(consoleSpy).toHaveBeenCalledWith('[Analytics]', 'test_event', { value: 123 });
    });

    it('does not log in production', () => {
      process.env.NODE_ENV = 'production';
      const { result } = renderHook(() => useAnalytics());
      
      result.current.trackEvent('test_event');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('handles event without properties', () => {
      process.env.NODE_ENV = 'development';
      const { result } = renderHook(() => useAnalytics());
      
      result.current.trackEvent('simple_event');
      
      expect(consoleSpy).toHaveBeenCalledWith('[Analytics]', 'simple_event', undefined);
    });
  });

  describe('trackPageView', () => {
    it('logs page view in development', () => {
      process.env.NODE_ENV = 'development';
      const { result } = renderHook(() => useAnalytics());
      
      result.current.trackPageView('/test-page');
      
      expect(consoleSpy).toHaveBeenCalledWith('[Analytics] Page View:', '/test-page');
    });

    it('uses window.location.pathname when no path provided', () => {
      process.env.NODE_ENV = 'development';
      const { result } = renderHook(() => useAnalytics());
      
      result.current.trackPageView();
      
      expect(consoleSpy).toHaveBeenCalledWith('[Analytics] Page View:', expect.any(String));
    });
  });

  describe('identify', () => {
    it('logs identify in development', () => {
      process.env.NODE_ENV = 'development';
      const { result } = renderHook(() => useAnalytics());
      
      result.current.identify('user-123', { plan: 'pro' });
      
      expect(consoleSpy).toHaveBeenCalledWith('[Analytics] Identify:', 'user-123', { plan: 'pro' });
    });

    it('does not log in production', () => {
      process.env.NODE_ENV = 'production';
      const { result } = renderHook(() => useAnalytics());
      
      result.current.identify('user-123');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('AnalyticsEvents', () => {
    it('exports all event constants', () => {
      expect(AnalyticsEvents.SIGN_IN).toBe('sign_in');
      expect(AnalyticsEvents.SIGN_OUT).toBe('sign_out');
      expect(AnalyticsEvents.JOURNEY_CREATED).toBe('journey_created');
      expect(AnalyticsEvents.MEMORY_CREATED).toBe('memory_created');
      expect(AnalyticsEvents.AI_RECAP_GENERATED).toBe('ai_recap_generated');
      expect(AnalyticsEvents.PWA_INSTALLED).toBe('pwa_installed');
    });
  });
});

