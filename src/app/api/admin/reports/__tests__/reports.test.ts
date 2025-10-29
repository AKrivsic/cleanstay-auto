import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCleaningReport, getPhotos, getInventorySnapshot } from '../_data';
import { formatCleaningReportForChat, formatPhotosForChat, formatInventoryForChat } from '@/lib/reports/formatters';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: null, error: null })),
        order: vi.fn(() => ({ data: [], error: null })),
        limit: vi.fn(() => ({ data: [], error: null })),
        gte: vi.fn(() => ({
          lt: vi.fn(() => ({
            order: vi.fn(() => ({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }))
};

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: () => mockSupabase
}));

vi.mock('@/lib/media/getSignedPhotoUrls', () => ({
  getSignedPhotoUrls: vi.fn(() => Promise.resolve([]))
}));

describe('Reports API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCleaningReport', () => {
    it('should generate cleaning report with events', async () => {
      const mockProperty = {
        id: 'prop-123',
        name: 'Byt 302',
        address: { street: 'Test St', city: 'Prague' }
      };

      const mockCleaning = {
        id: 'cleaning-123',
        status: 'completed',
        scheduled_start: '2025-01-22T10:00:00Z',
        scheduled_end: '2025-01-22T14:00:00Z',
        users: { name: 'Jan Novák', phone: '+420123456789' }
      };

      const mockEvents = [
        { id: 'event-1', type: 'cleaning_start', start: '2025-01-22T10:00:00Z', note: 'Začátek', phase: 'before' },
        { id: 'event-2', type: 'note', start: '2025-01-22T11:00:00Z', note: 'Vše v pořádku', phase: 'other' },
        { id: 'event-3', type: 'supply_out', start: '2025-01-22T12:00:00Z', note: 'Domestos', phase: 'other' },
        { id: 'event-4', type: 'photo', start: '2025-01-22T13:00:00Z', note: null, phase: 'before' },
        { id: 'event-5', type: 'done', start: '2025-01-22T14:00:00Z', note: 'Hotovo', phase: 'after' }
      ];

      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: mockProperty,
        error: null
      });

      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: mockCleaning,
        error: null
      });

      mockSupabase.from().select().eq().eq().gte().lt().order.mockReturnValue({
        data: mockEvents,
        error: null
      });

      const result = await getCleaningReport('tenant-123', 'prop-123', '2025-01-22', false);

      expect(result.type).toBe('cleaning_report');
      expect(result.property.name).toBe('Byt 302');
      expect(result.cleaner?.name).toBe('Jan Novák');
      expect(result.durationMin).toBe(240); // 4 hours
      expect(result.events).toHaveLength(5);
      expect(result.summary.notesCount).toBe(1);
      expect(result.summary.photosCount).toBe(1);
      expect(result.summary.supplies).toContain('Domestos');
    });

    it('should handle missing cleaning by using events', async () => {
      const mockProperty = {
        id: 'prop-123',
        name: 'Byt 302',
        address: { street: 'Test St', city: 'Prague' }
      };

      const mockEvents = [
        { id: 'event-1', type: 'cleaning_start', start: '2025-01-22T10:00:00Z', note: 'Začátek', phase: 'before' },
        { id: 'event-2', type: 'done', start: '2025-01-22T14:00:00Z', note: 'Hotovo', phase: 'after' }
      ];

      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: mockProperty,
        error: null
      });

      // No cleaning found
      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: null,
        error: { message: 'Not found' }
      });

      mockSupabase.from().select().eq().eq().gte().lt().order.mockReturnValue({
        data: mockEvents,
        error: null
      });

      const result = await getCleaningReport('tenant-123', 'prop-123', '2025-01-22', false);

      expect(result.type).toBe('cleaning_report');
      expect(result.cleaner).toBeUndefined();
      expect(result.durationMin).toBe(240); // Calculated from events
      expect(result.events).toHaveLength(2);
    });
  });

  describe('getPhotos', () => {
    it('should generate photos report with signed URLs', async () => {
      const mockProperty = {
        id: 'prop-123',
        name: 'Byt 302'
      };

      const mockPhotoEvents = [
        { id: 'photo-1', start: '2025-01-22T10:00:00Z', phase: 'before', width: 1920, height: 1080 },
        { id: 'photo-2', start: '2025-01-22T12:00:00Z', phase: 'after', width: 1920, height: 1080 }
      ];

      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: mockProperty,
        error: null
      });

      mockSupabase.from().select().eq().eq().eq().gte().lt().order.mockReturnValue({
        data: mockPhotoEvents,
        error: null
      });

      const result = await getPhotos('tenant-123', 'prop-123', '2025-01-22', 'all');

      expect(result.type).toBe('photos');
      expect(result.property.name).toBe('Byt 302');
      expect(result.items).toHaveLength(2);
      expect(result.items[0].phase).toBe('before');
      expect(result.items[1].phase).toBe('after');
    });

    it('should filter photos by phase', async () => {
      const mockProperty = {
        id: 'prop-123',
        name: 'Byt 302'
      };

      const mockPhotoEvents = [
        { id: 'photo-1', start: '2025-01-22T10:00:00Z', phase: 'before', width: 1920, height: 1080 },
        { id: 'photo-2', start: '2025-01-22T12:00:00Z', phase: 'after', width: 1920, height: 1080 }
      ];

      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: mockProperty,
        error: null
      });

      mockSupabase.from().select().eq().eq().eq().gte().lt().order.mockReturnValue({
        data: mockPhotoEvents,
        error: null
      });

      const result = await getPhotos('tenant-123', 'prop-123', '2025-01-22', 'before');

      expect(result.type).toBe('photos');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].phase).toBe('before');
    });
  });

  describe('getInventorySnapshot', () => {
    it('should generate inventory report with consumption', async () => {
      const mockProperty = {
        id: 'prop-123',
        name: 'Byt 302'
      };

      const mockSupplyEvents = [
        { note: 'Domestos', start: '2025-01-20T10:00:00Z' },
        { note: 'Toaletní papír', start: '2025-01-21T10:00:00Z' },
        { note: 'Domestos', start: '2025-01-22T10:00:00Z' }
      ];

      const mockLinenEvents = [
        { note: 'Ručníky', start: '2025-01-21T10:00:00Z' },
        { note: 'Povlečení', start: '2025-01-22T10:00:00Z' }
      ];

      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: mockProperty,
        error: null
      });

      mockSupabase.from().select().eq().eq().eq().gte().lt().order.mockReturnValue({
        data: mockSupplyEvents,
        error: null
      });

      mockSupabase.from().select().eq().eq().eq().gte().lt().order.mockReturnValue({
        data: mockLinenEvents,
        error: null
      });

      const result = await getInventorySnapshot('tenant-123', 'prop-123', '2025-01-20', '2025-01-22');

      expect(result.type).toBe('inventory');
      expect(result.property.name).toBe('Byt 302');
      expect(result.consumption).toHaveLength(4); // 2 unique items from supplies + 2 from linen
      expect(result.consumption.find(c => c.item === 'domestos')?.used).toBe(2);
      expect(result.recommendation).toHaveLength(4);
    });
  });

  describe('Formatters', () => {
    it('should format cleaning report for chat', () => {
      const report = {
        type: 'cleaning_report' as const,
        property: { id: 'prop-123', name: 'Byt 302' },
        date: '2025-01-22',
        cleaner: { name: 'Jan Novák', phone: '+420123456789' },
        startedAt: '2025-01-22T10:00:00Z',
        endedAt: '2025-01-22T14:00:00Z',
        durationMin: 240,
        events: [],
        summary: {
          notesCount: 2,
          photosCount: 3,
          supplies: ['Domestos', 'Toaletní papír'],
          linen: { changed: 2, dirty: 1 }
        }
      };

      const formatted = formatCleaningReportForChat(report);
      
      expect(formatted).toContain('📋 Úklid Byt 302');
      expect(formatted).toContain('✅ Dokončeno (240 min)');
      expect(formatted).toContain('👤 Jan Novák');
      expect(formatted).toContain('📝 2 poznámek');
      expect(formatted).toContain('📸 3 fotek');
      expect(formatted).toContain('📦 Doplněno: Domestos, Toaletní papír');
      expect(formatted).toContain('🛏️ Prádlo: 2 změněno, 1 špinavé');
    });

    it('should format photos report for chat', () => {
      const report = {
        type: 'photos' as const,
        property: { id: 'prop-123', name: 'Byt 302' },
        date: '2025-01-22',
        items: [
          { eventId: 'photo-1', thumbUrl: 'thumb1.jpg', phase: 'before' },
          { eventId: 'photo-2', thumbUrl: 'thumb2.jpg', phase: 'after' },
          { eventId: 'photo-3', thumbUrl: 'thumb3.jpg', phase: 'before' }
        ]
      };

      const formatted = formatPhotosForChat(report);
      
      expect(formatted).toContain('📸 Fotky Byt 302');
      expect(formatted).toContain('🔵 Před úklidem: 2 fotek');
      expect(formatted).toContain('🟢 Po úklidu: 1 fotek');
      expect(formatted).toContain('📊 Celkem 3 fotek');
    });

    it('should format inventory report for chat', () => {
      const report = {
        type: 'inventory' as const,
        property: { id: 'prop-123', name: 'Byt 302' },
        range: { from: '2025-01-20', to: '2025-01-22' },
        consumption: [
          { item: 'domestos', unit: 'ks', used: 2 },
          { item: 'toaletní papír', unit: 'ks', used: 1 },
          { item: 'ručníky', unit: 'ks', used: 3 }
        ],
        recommendation: [
          { item: 'domestos', buy: 1, rationale: 'Použito 2 ks za období' }
        ]
      };

      const formatted = formatInventoryForChat(report);
      
      expect(formatted).toContain('📦 Zásoby Byt 302');
      expect(formatted).toContain('🔝 Top spotřeba:');
      expect(formatted).toContain('1. domestos: 2 ks');
      expect(formatted).toContain('💡 Doporučení: domestos (1 ks)');
    });
  });
});





