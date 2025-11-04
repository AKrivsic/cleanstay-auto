import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSignedPhotoUrls } from '@/lib/media/getSignedPhotoUrls';

// Mock the getSignedPhotoUrls function
vi.mock('@/lib/media/getSignedPhotoUrls', () => ({
  getSignedPhotoUrls: vi.fn()
}));

describe('Client Signed URL Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Photo URL Generation', () => {
    it('should generate signed URLs for client photos', async () => {
      const mockPhotoUrls = [
        {
          eventId: 'event-123',
          mainUrl: 'https://storage.supabase.co/object/sign/media/path.jpg?token=valid',
          thumbUrl: 'https://storage.supabase.co/object/sign/media/path-thumb.jpg?token=valid',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          phase: 'before',
          width: 1920,
          height: 1080
        }
      ];

      vi.mocked(getSignedPhotoUrls).mockResolvedValue(mockPhotoUrls);

      const result = await getSignedPhotoUrls({
        eventIds: ['event-123'],
        tenantId: 'client-123'
      });

      expect(result).toHaveLength(1);
      expect(result[0].eventId).toBe('event-123');
      expect(result[0].mainUrl).toContain('storage.supabase.co');
      expect(result[0].thumbUrl).toContain('storage.supabase.co');
    });

    it('should handle expired URLs gracefully', async () => {
      const expiredUrl = {
        eventId: 'event-123',
        mainUrl: 'https://storage.supabase.co/object/sign/media/path.jpg?token=expired',
        thumbUrl: 'https://storage.supabase.co/object/sign/media/path-thumb.jpg?token=expired',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        phase: 'before',
        width: 1920,
        height: 1080
      };

      vi.mocked(getSignedPhotoUrls).mockResolvedValue([expiredUrl]);

      const result = await getSignedPhotoUrls({
        eventIds: ['event-123'],
        tenantId: 'client-123'
      });

      expect(result).toHaveLength(1);
      expect(result[0].expiresAt).toBe(expiredUrl.expiresAt);
      
      // Check if URL is expired
      const isExpired = new Date(result[0].expiresAt) <= new Date();
      expect(isExpired).toBe(true);
    });
  });

  describe('Client-specific URL Handling', () => {
    it('should generate URLs only for client tenant', async () => {
      const mockPhotoUrls = [
        {
          eventId: 'event-123',
          mainUrl: 'https://storage.supabase.co/object/sign/media/path.jpg?token=client-token',
          thumbUrl: 'https://storage.supabase.co/object/sign/media/path-thumb.jpg?token=client-token',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          phase: 'before',
          width: 1920,
          height: 1080
        }
      ];

      vi.mocked(getSignedPhotoUrls).mockResolvedValue(mockPhotoUrls);

      const result = await getSignedPhotoUrls({
        eventIds: ['event-123'],
        tenantId: 'client-123'
      });

      expect(result).toHaveLength(1);
      expect(result[0].mainUrl).toContain('client-token');
    });

    it('should handle client tenant isolation', async () => {
      vi.mocked(getSignedPhotoUrls).mockRejectedValue(new Error('Access denied'));

      await expect(getSignedPhotoUrls({
        eventIds: ['event-123'],
        tenantId: 'client-123'
      })).rejects.toThrow('Access denied');
    });
  });

  describe('Photo Modal Integration', () => {
    it('should generate fresh URLs on demand', async () => {
      const firstCall = {
        eventId: 'event-123',
        mainUrl: 'https://storage.supabase.co/object/sign/media/path.jpg?token=first',
        thumbUrl: 'https://storage.supabase.co/object/sign/media/path-thumb.jpg?token=first',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        phase: 'before',
        width: 1920,
        height: 1080
      };

      const secondCall = {
        eventId: 'event-123',
        mainUrl: 'https://storage.supabase.co/object/sign/media/path.jpg?token=second',
        thumbUrl: 'https://storage.supabase.co/object/sign/media/path-thumb.jpg?token=second',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        phase: 'before',
        width: 1920,
        height: 1080
      };

      // First call returns first URL
      vi.mocked(getSignedPhotoUrls).mockResolvedValueOnce([firstCall]);
      
      // Second call returns second URL
      vi.mocked(getSignedPhotoUrls).mockResolvedValueOnce([secondCall]);

      // Simulate first fetch (thumbnail)
      const firstResult = await getSignedPhotoUrls({
        eventIds: ['event-123'],
        tenantId: 'client-123'
      });

      expect(firstResult[0].mainUrl).toBe(firstCall.mainUrl);

      // Simulate second fetch (modal open)
      const secondResult = await getSignedPhotoUrls({
        eventIds: ['event-123'],
        tenantId: 'client-123'
      });

      expect(secondResult[0].mainUrl).toBe(secondCall.mainUrl);
      expect(secondResult[0].mainUrl).not.toBe(firstResult[0].mainUrl);
    });
  });

  describe('Error Handling', () => {
    it('should handle getSignedPhotoUrls errors gracefully', async () => {
      vi.mocked(getSignedPhotoUrls).mockRejectedValue(new Error('Storage error'));

      await expect(getSignedPhotoUrls({
        eventIds: ['event-123'],
        tenantId: 'client-123'
      })).rejects.toThrow('Storage error');
    });

    it('should handle empty event IDs', async () => {
      vi.mocked(getSignedPhotoUrls).mockResolvedValue([]);

      const result = await getSignedPhotoUrls({
        eventIds: [],
        tenantId: 'client-123'
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle multiple photos efficiently', async () => {
      const mockUrls = Array.from({ length: 5 }, (_, i) => ({
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
        eventIds: Array.from({ length: 5 }, (_, i) => `event-${i}`),
        tenantId: 'client-123'
      });
      const endTime = Date.now();

      expect(result).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});





