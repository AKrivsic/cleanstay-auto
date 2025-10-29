import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  openSession, 
  appendEvent, 
  closeSession, 
  getActiveSession,
  autoCloseExpiredSessions 
} from '../lib/sessions';
import { ParsedMessage } from '../lib/ai/parseMessage';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: null, error: null }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({ data: { id: 'session-123' }, error: null }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({ error: null }))
    }))
  }))
};

vi.mock('../lib/supabase/server', () => ({
  getSupabaseServerClient: () => mockSupabase
}));

describe('Sessions Management', () => {
  const testTenantId = 'tenant-123';
  const testCleanerPhone = '+420123456789';
  const testPropertyHint = '302';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('A) Happy Path: start → supply_out → linen_used → done', () => {
    it('should handle complete cleaning workflow', async () => {
      // Mock property lookup
      mockSupabase.from().select().eq().or().mockReturnValue({
        data: [{ id: 'property-123', name: 'Byt 302' }],
        error: null
      });

      // Mock session creation
      mockSupabase.from().insert().select().single().mockReturnValue({
        data: { id: 'session-123' },
        error: null
      });

      // Mock event creation
      mockSupabase.from().insert().mockReturnValue({
        data: { id: 'event-123' },
        error: null
      });

      // 1. Start cleaning
      const startResult = await openSession({
        tenantId: testTenantId,
        cleanerPhone: testCleanerPhone,
        propertyHint: testPropertyHint
      });

      expect(startResult.sessionId).toBe('session-123');
      expect(startResult.propertyId).toBe('property-123');

      // 2. Supply out
      const supplyParsed: ParsedMessage = {
        type: 'supply_out',
        payload: { items: ['Domestos', 'Jar'] },
        confidence: 0.9,
        language: 'cs'
      };

      const supplyResult = await appendEvent({
        tenantId: testTenantId,
        cleanerPhone: testCleanerPhone,
        parsed: supplyParsed
      });

      expect(supplyResult.sessionId).toBe('session-123');
      expect(supplyResult.eventId).toBe('event-123');

      // 3. Linen used
      const linenParsed: ParsedMessage = {
        type: 'linen_used',
        payload: { changed: 6, dirty: 2 },
        confidence: 0.9,
        language: 'cs'
      };

      const linenResult = await appendEvent({
        tenantId: testTenantId,
        cleanerPhone: testCleanerPhone,
        parsed: linenParsed
      });

      expect(linenResult.sessionId).toBe('session-123');

      // 4. Done
      const doneResult = await closeSession({
        tenantId: testTenantId,
        cleanerPhone: testCleanerPhone,
        reason: 'done'
      });

      expect(doneResult.sessionId).toBe('session-123');
    });
  });

  describe('B) Conflict: start twice in a row', () => {
    it('should handle session conflict', async () => {
      // Mock existing session
      mockSupabase.from().select().eq().eq().eq().single().mockReturnValue({
        data: { id: 'existing-session', property_id: 'property-456' },
        error: null
      });

      // Mock property lookup for conflict message
      mockSupabase.from().select().eq().single().mockReturnValue({
        data: { name: 'Nikolajka 302' },
        error: null
      });

      await expect(openSession({
        tenantId: testTenantId,
        cleanerPhone: testCleanerPhone,
        propertyHint: testPropertyHint
      })).rejects.toThrow('Mám ukončit předchozí (Nikolajka 302) a pokračovat tady?');
    });
  });

  describe('C) Edge case: done without start', () => {
    it('should ask for property when done without active session', async () => {
      // Mock no active session
      mockSupabase.from().select().eq().eq().eq().single().mockReturnValue({
        data: null,
        error: { code: 'PGRST116' } // No rows found
      });

      await expect(closeSession({
        tenantId: testTenantId,
        cleanerPhone: testCleanerPhone,
        reason: 'done'
      })).rejects.toThrow('U kterého bytu ukončuješ?');
    });
  });

  describe('D) TTL auto-close simulation', () => {
    it('should auto-close expired sessions', async () => {
      const expiredTime = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours ago
      
      // Mock expired sessions
      mockSupabase.from().select().eq().eq().lt().mockReturnValue({
        data: [
          { id: 'session-1', tenant_id: testTenantId, property_id: 'property-1' },
          { id: 'session-2', tenant_id: testTenantId, property_id: 'property-2' }
        ],
        error: null
      });

      // Mock update
      mockSupabase.from().update().in().mockReturnValue({
        error: null
      });

      // Mock event creation for timeout
      mockSupabase.from().insert().mockReturnValue({
        data: { id: 'timeout-event' },
        error: null
      });

      const closedCount = await autoCloseExpiredSessions();
      expect(closedCount).toBe(2);
    });
  });

  describe('E) Delayed photo after done', () => {
    it('should handle delayed photo after session closed', async () => {
      // Mock no active session
      mockSupabase.from().select().eq().eq().eq().single().mockReturnValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const photoParsed: ParsedMessage = {
        type: 'photo_meta',
        payload: { url: 'https://example.com/photo.jpg', description: 'After cleaning' },
        confidence: 0.9,
        language: 'cs'
      };

      await expect(appendEvent({
        tenantId: testTenantId,
        cleanerPhone: testCleanerPhone,
        parsed: photoParsed
      })).rejects.toThrow('U kterého bytu jsi? Napiš "Začínám úklid ..."');
    });
  });

  describe('Property resolution', () => {
    it('should handle multiple property candidates', async () => {
      // Mock multiple properties
      mockSupabase.from().select().eq().or().mockReturnValue({
        data: [
          { id: 'property-1', name: 'Nikolajka 302' },
          { id: 'property-2', name: 'Letná 302' }
        ],
        error: null
      });

      await expect(openSession({
        tenantId: testTenantId,
        cleanerPhone: testCleanerPhone,
        propertyHint: '302'
      })).rejects.toThrow('Myslíš Nikolajka 302, Letná 302?');
    });

    it('should handle no property found', async () => {
      // Mock no properties
      mockSupabase.from().select().eq().or().mockReturnValue({
        data: [],
        error: null
      });

      await expect(openSession({
        tenantId: testTenantId,
        cleanerPhone: testCleanerPhone,
        propertyHint: 'nonexistent'
      })).rejects.toThrow("Byt 'nonexistent' nenalezen");
    });
  });

  describe('Session state management', () => {
    it('should get active session', async () => {
      // Mock active session
      mockSupabase.from().select().eq().eq().eq().single().mockReturnValue({
        data: { id: 'session-123', property_id: 'property-123' },
        error: null
      });

      const session = await getActiveSession(testTenantId, testCleanerPhone);
      expect(session).toEqual({
        sessionId: 'session-123',
        propertyId: 'property-123'
      });
    });

    it('should return null when no active session', async () => {
      // Mock no active session
      mockSupabase.from().select().eq().eq().eq().single().mockReturnValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const session = await getActiveSession(testTenantId, testCleanerPhone);
      expect(session).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from().select().eq().or().mockReturnValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      await expect(openSession({
        tenantId: testTenantId,
        cleanerPhone: testCleanerPhone,
        propertyHint: testPropertyHint
      })).rejects.toThrow('Database connection failed');
    });
  });
});





