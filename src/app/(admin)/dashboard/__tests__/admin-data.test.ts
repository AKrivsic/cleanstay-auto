import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCleaningDetail, getTodayOverview, getPropertyList } from '../_data';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: null, error: null })),
        order: vi.fn(() => ({ data: [], error: null })),
        limit: vi.fn(() => ({ data: [], error: null }))
      })),
      gte: vi.fn(() => ({
        lt: vi.fn(() => ({
          order: vi.fn(() => ({ data: [], error: null }))
        }))
      }))
    }))
  }))
};

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: () => mockSupabase
}));

vi.mock('@/lib/media/getSignedPhotoUrls', () => ({
  getSignedPhotoUrls: vi.fn(() => Promise.resolve([]))
}));

describe('Admin Data Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCleaningDetail', () => {
    it('should return null for non-existent cleaning', async () => {
      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: null,
        error: { message: 'Not found' }
      });

      const result = await getCleaningDetail('tenant-123', 'cleaning-456');
      expect(result).toBeNull();
    });

    it('should return cleaning detail with events', async () => {
      const mockCleaning = {
        id: 'cleaning-123',
        status: 'completed',
        scheduled_start: '2025-01-22T10:00:00Z',
        scheduled_end: '2025-01-22T14:00:00Z',
        properties: { name: 'Byt 302' },
        users: { name: 'Jan Uklízeč' }
      };

      const mockEvents = [
        { id: 'event-1', type: 'cleaning_start', start: '2025-01-22T10:00:00Z', note: 'Začátek', phase: 'before', width: 1920, height: 1080 },
        { id: 'event-2', type: 'photo', start: '2025-01-22T12:00:00Z', note: 'Foto', phase: 'before', width: 1920, height: 1080 },
        { id: 'event-3', type: 'done', start: '2025-01-22T14:00:00Z', note: 'Hotovo', phase: 'after' }
      ];

      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: mockCleaning,
        error: null
      });

      mockSupabase.from().select().eq().eq().order.mockReturnValue({
        data: mockEvents,
        error: null
      });

      const result = await getCleaningDetail('tenant-123', 'cleaning-123');
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('cleaning-123');
      expect(result?.property_name).toBe('Byt 302');
      expect(result?.cleaner_name).toBe('Jan Uklízeč');
      expect(result?.events).toHaveLength(3);
      expect(result?.photos).toHaveLength(1); // Only photo events
    });
  });

  describe('getTodayOverview', () => {
    it('should return today overview with cleanings and photos', async () => {
      const mockCleanings = [
        {
          id: 'cleaning-1',
          status: 'completed',
          scheduled_start: '2025-01-22T10:00:00Z',
          scheduled_end: '2025-01-22T14:00:00Z',
          properties: { name: 'Byt 302' },
          users: { name: 'Jan Uklízeč' }
        }
      ];

      const mockEvents = [
        { cleaning_id: 'cleaning-1', type: 'cleaning_start', start: '2025-01-22T10:00:00Z' }
      ];

      const mockPhotos = [
        {
          id: 'photo-1',
          start: '2025-01-22T12:00:00Z',
          phase: 'before',
          width: 1920,
          height: 1080,
          properties: { name: 'Byt 302' }
        }
      ];

      mockSupabase.from().select().eq().gte().lt().order.mockReturnValue({
        data: mockCleanings,
        error: null
      });

      mockSupabase.from().select().eq().gte().order.mockReturnValue({
        data: mockEvents,
        error: null
      });

      mockSupabase.from().select().eq().eq().order().limit.mockReturnValue({
        data: mockPhotos,
        error: null
      });

      const result = await getTodayOverview('tenant-123');
      
      expect(result).toBeDefined();
      expect(result.cleanings).toHaveLength(1);
      expect(result.recentPhotos).toHaveLength(1);
      expect(result.cleanings[0].property_name).toBe('Byt 302');
    });
  });

  describe('getPropertyList', () => {
    it('should return property list with search', async () => {
      const mockProperties = [
        { id: 'prop-1', name: 'Byt 302', type: 'airbnb', address: { street: 'Test St', city: 'Prague' } },
        { id: 'prop-2', name: 'Byt 205', type: 'airbnb', address: { street: 'Test St', city: 'Prague' } }
      ];

      mockSupabase.from().select().eq().order.mockReturnValue({
        data: mockProperties,
        error: null
      });

      const result = await getPropertyList('tenant-123', { search: '302' });
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Byt 302');
    });

    it('should handle empty property list', async () => {
      mockSupabase.from().select().eq().order.mockReturnValue({
        data: [],
        error: null
      });

      const result = await getPropertyList('tenant-123');
      
      expect(result).toHaveLength(0);
    });
  });
});





