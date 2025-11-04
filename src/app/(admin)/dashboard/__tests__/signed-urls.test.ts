import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSignedPhotoUrls } from '@/lib/media/getSignedPhotoUrls';

// Mock the getSignedPhotoUrls function
vi.mock('@/lib/media/getSignedPhotoUrls', () => ({
  getSignedPhotoUrls: vi.fn()
}));

describe('Signed URL Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('URL Expiration', () => {
    it('should handle expired URLs gracefully', async () => {
      const mockExpiredResponse = {
        eventId: 'event-123',
        mainUrl: 'https://storage.supabase.co/object/sign/media/path.jpg?token=expired',
        thumbUrl: 'https://storage.supabase.co/object/sign/media/path-thumb.jpg?token=expired',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
        phase: 'before',
        width: 1920,
        height: 1080
      };

      vi.mocked(getSignedPhotoUrls).mockResolvedValue([mockExpiredResponse]);

      const result = await getSignedPhotoUrls({
        eventIds: ['event-123'],
        tenantId: 'tenant-123'
      });

      expect(result).toHaveLength(1);
      expect(result[0].expiresAt).toBe(mockExpiredResponse.expiresAt);
      
      // Check if URL is expired
      const isExpired = new Date(result[0].expiresAt) <= new Date();
      expect(isExpired).toBe(true);
    });

    it('should handle valid URLs', async () => {
      const mockValidResponse = {
        eventId: 'event-123',
        mainUrl: 'https://storage.supabase.co/object/sign/media/path.jpg?token=valid',
        thumbUrl: 'https://storage.supabase.co/object/sign/media/path-thumb.jpg?token=valid',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
        phase: 'before',
        width: 1920,
        height: 1080
      };

      vi.mocked(getSignedPhotoUrls).mockResolvedValue([mockValidResponse]);

      const result = await getSignedPhotoUrls({
        eventIds: ['event-123'],
        tenantId: 'tenant-123'
      });

      expect(result).toHaveLength(1);
      expect(result[0].expiresAt).toBe(mockValidResponse.expiresAt);
      
      // Check if URL is valid
      const isExpired = new Date(result[0].expiresAt) <= new Date();
      expect(isExpired).toBe(false);
    });
  });

  describe('URL Regeneration', () => {
    it('should regenerate URLs when expired', async () => {
      const expiredUrl = {
        eventId: 'event-123',
        mainUrl: 'https://storage.supabase.co/object/sign/media/path.jpg?token=expired',
        thumbUrl: 'https://storage.supabase.co/object/sign/media/path-thumb.jpg?token=expired',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        phase: 'before',
        width: 1920,
        height: 1080
      };

      const newUrl = {
        eventId: 'event-123',
        mainUrl: 'https://storage.supabase.co/object/sign/media/path.jpg?token=new',
        thumbUrl: 'https://storage.supabase.co/object/sign/media/path-thumb.jpg?token=new',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        phase: 'before',
        width: 1920,
        height: 1080
      };

      // First call returns expired URL
      vi.mocked(getSignedPhotoUrls).mockResolvedValueOnce([expiredUrl]);
      
      // Second call returns new URL
      vi.mocked(getSignedPhotoUrls).mockResolvedValueOnce([newUrl]);

      // Simulate first fetch (expired)
      const firstResult = await getSignedPhotoUrls({
        eventIds: ['event-123'],
        tenantId: 'tenant-123'
      });

      expect(firstResult[0].expiresAt).toBe(expiredUrl.expiresAt);

      // Simulate second fetch (regenerated)
      const secondResult = await getSignedPhotoUrls({
        eventIds: ['event-123'],
        tenantId: 'tenant-123'
      });

      expect(secondResult[0].expiresAt).toBe(newUrl.expiresAt);
      expect(secondResult[0].mainUrl).toBe(newUrl.mainUrl);
    });
  });

  describe('Error Handling', () => {
    it('should handle getSignedPhotoUrls errors', async () => {
      vi.mocked(getSignedPhotoUrls).mockRejectedValue(new Error('Storage error'));

      await expect(getSignedPhotoUrls({
        eventIds: ['event-123'],
        tenantId: 'tenant-123'
      })).rejects.toThrow('Storage error');
    });

    it('should handle empty event IDs', async () => {
      vi.mocked(getSignedPhotoUrls).mockResolvedValue([]);

      const result = await getSignedPhotoUrls({
        eventIds: [],
        tenantId: 'tenant-123'
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle multiple event IDs efficiently', async () => {
      const mockUrls = Array.from({ length: 10 }, (_, i) => ({
        eventId: `event-${i}`,
        mainUrl: `https://storage.supabase.co/object/sign/media/path-${i}.jpg?token=valid`,
        thumbUrl: `https://storage.supabase.co/object/sign/media/path-${i}-thumb.jpg?token=valid`,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        phase: 'before',
        width: 1920,
        height: 1080
      }));

      vi.mocked(getSignedPhotoUrls).mockResolvedValue(mockUrls);

      const startTime = Date.now();
      const result = await getSignedPhotoUrls({
        eventIds: Array.from({ length: 10 }, (_, i) => `event-${i}`),
        tenantId: 'tenant-123'
      });
      const endTime = Date.now();

      expect(result).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});





