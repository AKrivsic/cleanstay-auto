import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getClientOverview, getClientCleaningDetail, getClientPropertyDetail } from '../_data';

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

describe('Client Data Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClientOverview', () => {
    it('should return client overview with properties and cleanings', async () => {
      const mockProperties = [
        {
          id: 'prop-1',
          name: 'Byt 302',
          type: 'airbnb',
          address: { street: 'Test St', city: 'Prague' },
          cleanings: [
            {
              id: 'cleaning-1',
              scheduled_start: '2025-01-22T10:00:00Z',
              status: 'completed',
              scheduled_end: '2025-01-22T14:00:00Z'
            }
          ]
        }
      ];

      const mockCleanings = [
        {
          id: 'cleaning-1',
          scheduled_start: '2025-01-22T10:00:00Z',
          status: 'completed',
          scheduled_end: '2025-01-22T14:00:00Z',
          properties: { name: 'Byt 302' }
        }
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

      mockSupabase.from().select().eq().order.mockReturnValue({
        data: mockProperties,
        error: null
      });

      mockSupabase.from().select().eq().order().limit.mockReturnValue({
        data: mockCleanings,
        error: null
      });

      mockSupabase.from().select().eq().eq().order().limit.mockReturnValue({
        data: mockPhotos,
        error: null
      });

      const result = await getClientOverview('client-123');
      
      expect(result).toBeDefined();
      expect(result.properties).toHaveLength(1);
      expect(result.properties[0].name).toBe('Byt 302');
      expect(result.recentCleanings).toHaveLength(1);
      expect(result.monthlyCleanings).toBe(1);
    });

    it('should handle empty data gracefully', async () => {
      mockSupabase.from().select().eq().order.mockReturnValue({
        data: [],
        error: null
      });

      mockSupabase.from().select().eq().order().limit.mockReturnValue({
        data: [],
        error: null
      });

      mockSupabase.from().select().eq().eq().order().limit.mockReturnValue({
        data: [],
        error: null
      });

      const result = await getClientOverview('client-123');
      
      expect(result).toBeDefined();
      expect(result.properties).toHaveLength(0);
      expect(result.recentCleanings).toHaveLength(0);
      expect(result.monthlyCleanings).toBe(0);
    });
  });

  describe('getClientCleaningDetail', () => {
    it('should return cleaning detail with events and photos', async () => {
      const mockCleaning = {
        id: 'cleaning-123',
        status: 'completed',
        scheduled_start: '2025-01-22T10:00:00Z',
        scheduled_end: '2025-01-22T14:00:00Z',
        properties: { name: 'Byt 302' }
      };

      const mockEvents = [
        { id: 'event-1', type: 'cleaning_start', start: '2025-01-22T10:00:00Z', note: 'Začátek', phase: 'before' },
        { id: 'event-2', type: 'photo', start: '2025-01-22T12:00:00Z', note: 'Foto', phase: 'before' },
        { id: 'event-3', type: 'done', start: '2025-01-22T14:00:00Z', note: 'Hotovo', phase: 'after' }
      ];

      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: mockCleaning,
        error: null
      });

      mockSupabase.from().select().eq().eq().not().not().order.mockReturnValue({
        data: mockEvents,
        error: null
      });

      const result = await getClientCleaningDetail('client-123', 'cleaning-123');
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('cleaning-123');
      expect(result?.propertyName).toBe('Byt 302');
      expect(result?.events).toHaveLength(3);
      expect(result?.photos).toHaveLength(1); // Only photo events
      expect(result?.duration).toBe(4); // 4 hours
    });

    it('should filter out internal notes', async () => {
      const mockCleaning = {
        id: 'cleaning-123',
        status: 'completed',
        scheduled_start: '2025-01-22T10:00:00Z',
        scheduled_end: '2025-01-22T14:00:00Z',
        properties: { name: 'Byt 302' }
      };

      const mockEvents = [
        { id: 'event-1', type: 'note', start: '2025-01-22T10:00:00Z', note: 'Veřejná poznámka' },
        { id: 'event-2', type: 'note', start: '2025-01-22T11:00:00Z', note: 'Interní poznámka pro tým' },
        { id: 'event-3', type: 'note', start: '2025-01-22T12:00:00Z', note: 'Internal note' }
      ];

      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: mockCleaning,
        error: null
      });

      mockSupabase.from().select().eq().eq().not().not().order.mockReturnValue({
        data: mockEvents,
        error: null
      });

      const result = await getClientCleaningDetail('client-123', 'cleaning-123');
      
      expect(result).toBeDefined();
      expect(result?.events).toHaveLength(1); // Only public note
      expect(result?.events[0].note).toBe('Veřejná poznámka');
    });

    it('should return null for non-existent cleaning', async () => {
      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: null,
        error: { message: 'Not found' }
      });

      const result = await getClientCleaningDetail('client-123', 'cleaning-456');
      expect(result).toBeNull();
    });
  });

  describe('getClientPropertyDetail', () => {
    it('should return property detail with statistics', async () => {
      const mockProperty = {
        id: 'prop-123',
        name: 'Byt 302',
        type: 'airbnb',
        address: { street: 'Test St', city: 'Prague' }
      };

      const mockCleanings = [
        {
          id: 'cleaning-1',
          scheduled_start: '2025-01-22T10:00:00Z',
          status: 'completed',
          scheduled_end: '2025-01-22T14:00:00Z'
        },
        {
          id: 'cleaning-2',
          scheduled_start: '2025-01-15T10:00:00Z',
          status: 'completed',
          scheduled_end: '2025-01-15T13:00:00Z'
        }
      ];

      const mockSupplies = [
        { start: '2025-01-22T12:00:00Z', note: 'Domestos' },
        { start: '2025-01-15T11:00:00Z', note: 'Toaletní papír' }
      ];

      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: mockProperty,
        error: null
      });

      mockSupabase.from().select().eq().eq().order.mockReturnValue({
        data: mockCleanings,
        error: null
      });

      mockSupabase.from().select().eq().eq().eq().order().limit.mockReturnValue({
        data: mockSupplies,
        error: null
      });

      const result = await getClientPropertyDetail('client-123', 'prop-123');
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('prop-123');
      expect(result?.name).toBe('Byt 302');
      expect(result?.totalCleanings).toBe(2);
      expect(result?.recentCleanings).toHaveLength(2);
      expect(result?.recentSupplies).toHaveLength(2);
      expect(result?.avgDuration).toBe(3.5); // (4 + 3) / 2
    });

    it('should return null for non-existent property', async () => {
      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: null,
        error: { message: 'Not found' }
      });

      const result = await getClientPropertyDetail('client-123', 'prop-456');
      expect(result).toBeNull();
    });
  });
});





