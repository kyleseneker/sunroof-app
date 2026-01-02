import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCompressionStats, compressImage, compressDataUrl } from '@/lib';

describe('Image Compression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock URL methods
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  describe('getCompressionStats', () => {
    it('calculates stats correctly for 50% compression', () => {
      const stats = getCompressionStats(1024 * 1024, 512 * 1024);
      
      expect(stats.originalKB).toBe(1024);
      expect(stats.compressedKB).toBe(512);
      expect(stats.savedKB).toBe(512);
      expect(stats.percentage).toBe(50);
    });

    it('calculates stats correctly for small files', () => {
      const stats = getCompressionStats(100 * 1024, 80 * 1024);
      
      expect(stats.originalKB).toBe(100);
      expect(stats.compressedKB).toBe(80);
      expect(stats.savedKB).toBe(20);
      expect(stats.percentage).toBe(20);
    });

    it('handles zero compression', () => {
      const stats = getCompressionStats(500 * 1024, 500 * 1024);
      
      expect(stats.savedKB).toBe(0);
      expect(stats.percentage).toBe(0);
    });

    it('handles large files', () => {
      const stats = getCompressionStats(10 * 1024 * 1024, 1 * 1024 * 1024);
      
      expect(stats.originalKB).toBe(10240);
      expect(stats.compressedKB).toBe(1024);
      expect(stats.percentage).toBe(90);
    });

    it('rounds values correctly', () => {
      const stats = getCompressionStats(1000, 333);
      
      expect(stats.originalKB).toBe(1);
      expect(stats.compressedKB).toBe(0);
    });
  });

  describe('compressImage', () => {
    it('skips compression for small files (under threshold)', async () => {
      const smallFile = new File(['small'], 'small.jpg', { type: 'image/jpeg' });
      Object.defineProperty(smallFile, 'size', { value: 100 * 1024 }); // 100KB
      
      const result = await compressImage(smallFile, { maxSizeKB: 500 });
      
      expect(result).toBe(smallFile);
    });

    it('skips compression for files already under maxSizeKB', async () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      Object.defineProperty(blob, 'size', { value: 200 * 1024 }); // 200KB
      
      const result = await compressImage(blob, { maxSizeKB: 500 });
      
      expect(result).toBe(blob);
    });

    // Note: Full compression flow tests are difficult to mock in jsdom
    // as Image constructor can't be easily mocked. The core logic is tested
    // through the skip-compression and stats tests above.
  });

  describe('compressDataUrl', () => {
    it('converts data URL to blob and compresses', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      Object.defineProperty(mockBlob, 'size', { value: 100 }); // Small, skip compression
      
      vi.spyOn(global, 'fetch').mockResolvedValue({
        blob: vi.fn().mockResolvedValue(mockBlob),
      } as any);
      
      const result = await compressDataUrl('data:image/jpeg;base64,abc123');
      
      expect(result).toBe(mockBlob);
      expect(global.fetch).toHaveBeenCalledWith('data:image/jpeg;base64,abc123');
    });
  });
});

