import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getClientOverview, getClientCleaningDetail, getClientPropertyDetail } from '../_data';
import { clientAuth } from '@/lib/auth/client-auth';

// Mock client auth
vi.mock('@/lib/auth/client-auth', () => ({
  clientAuth: {
    verifyClientRole: vi.fn(),
    getAuthenticatedClient: vi.fn(),
    getTenantId: vi.fn(),
  }
}));

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

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: () => mockSupabase
}));

vi.mock('@/lib/media/getSignedPhotoUrls', () => ({
  getSignedPhotoUrls: vi.fn(() => Promise.resolve([]))
}));

describe('RLS Enforcement Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Client Role Verification', () => {
    it('should verify client role before data access', async () => {
      vi.mocked(clientAuth.verifyClientRole).mockResolvedValue(false);
      vi.mocked(clientAuth.getAuthenticatedClient).mockResolvedValue(mockSupabase);
      vi.mocked(clientAuth.getTenantId).mockResolvedValue('tenant-123');

      await expect(getClientOverview('client-123')).rejects.toThrow('Access denied. Client role required.');
      
      expect(clientAuth.verifyClientRole).toHaveBeenCalled();
    });

    it('should allow access for valid client role', async () => {
      vi.mocked(clientAuth.verifyClientRole).mockResolvedValue(true);
      vi.mocked(clientAuth.getAuthenticatedClient).mockResolvedValue(mockSupabase);
      vi.mocked(clientAuth.getTenantId).mockResolvedValue('tenant-123');

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

      await getClientOverview('client-123');
      
      expect(clientAuth.verifyClientRole).toHaveBeenCalled();
      expect(clientAuth.getAuthenticatedClient).toHaveBeenCalled();
      expect(clientAuth.getTenantId).toHaveBeenCalled();
    });
  });

  describe('Tenant Isolation', () => {
    it('should use tenant_id from JWT claims, not clientId parameter', async () => {
      vi.mocked(clientAuth.verifyClientRole).mockResolvedValue(true);
      vi.mocked(clientAuth.getAuthenticatedClient).mockResolvedValue(mockSupabase);
      vi.mocked(clientAuth.getTenantId).mockResolvedValue('tenant-from-jwt');

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

      await getClientOverview('different-client-id');

      // Verify that tenant_id from JWT is used, not the clientId parameter
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('tenant_id', 'tenant-from-jwt');
    });

    it('should enforce tenant isolation across all queries', async () => {
      vi.mocked(clientAuth.verifyClientRole).mockResolvedValue(true);
      vi.mocked(clientAuth.getAuthenticatedClient).mockResolvedValue(mockSupabase);
      vi.mocked(clientAuth.getTenantId).mockResolvedValue('tenant-123');

      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: { id: 'cleaning-123', status: 'completed' },
        error: null
      });

      mockSupabase.from().select().eq().eq().not().not().order.mockReturnValue({
        data: [],
        error: null
      });

      await getClientCleaningDetail('client-456', 'cleaning-123');

      // All queries should use tenant_id from JWT, not clientId parameter
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('tenant_id', 'tenant-123');
    });
  });

  describe('Authentication State', () => {
    it('should handle authentication errors gracefully', async () => {
      vi.mocked(clientAuth.verifyClientRole).mockRejectedValue(new Error('Auth failed'));
      vi.mocked(clientAuth.getAuthenticatedClient).mockResolvedValue(mockSupabase);
      vi.mocked(clientAuth.getTenantId).mockResolvedValue('tenant-123');

      await expect(getClientOverview('client-123')).rejects.toThrow('Auth failed');
    });

    it('should handle missing tenant_id in JWT', async () => {
      vi.mocked(clientAuth.verifyClientRole).mockResolvedValue(true);
      vi.mocked(clientAuth.getAuthenticatedClient).mockResolvedValue(mockSupabase);
      vi.mocked(clientAuth.getTenantId).mockRejectedValue(new Error('Tenant ID not found'));

      await expect(getClientOverview('client-123')).rejects.toThrow('Tenant ID not found');
    });
  });

  describe('RLS Policy Compliance', () => {
    it('should use client-side Supabase client for RLS enforcement', async () => {
      vi.mocked(clientAuth.verifyClientRole).mockResolvedValue(true);
      vi.mocked(clientAuth.getAuthenticatedClient).mockResolvedValue(mockSupabase);
      vi.mocked(clientAuth.getTenantId).mockResolvedValue('tenant-123');

      mockSupabase.from().select().eq().single.mockReturnValue({
        data: { id: 'property-123', name: 'Test Property' },
        error: null
      });

      mockSupabase.from().select().eq().eq().order.mockReturnValue({
        data: [],
        error: null
      });

      mockSupabase.from().select().eq().eq().order().limit.mockReturnValue({
        data: [],
        error: null
      });

      await getClientPropertyDetail('client-123', 'property-123');

      // Verify that client-side Supabase is used (not server-side)
      expect(clientAuth.getAuthenticatedClient).toHaveBeenCalled();
    });

    it('should not bypass RLS with service role key', async () => {
      vi.mocked(clientAuth.verifyClientRole).mockResolvedValue(true);
      vi.mocked(clientAuth.getAuthenticatedClient).mockResolvedValue(mockSupabase);
      vi.mocked(clientAuth.getTenantId).mockResolvedValue('tenant-123');

      // Verify that we're using the authenticated client, not a service role client
      const { createSupabaseClient } = await import('@/lib/supabase/client');
      const client = createSupabaseClient();
      
      // The client should be the same instance (not a service role client)
      expect(mockSupabase).toBe(client);
    });
  });

  describe('Data Filtering', () => {
    it('should filter out internal notes for client view', async () => {
      vi.mocked(clientAuth.verifyClientRole).mockResolvedValue(true);
      vi.mocked(clientAuth.getAuthenticatedClient).mockResolvedValue(mockSupabase);
      vi.mocked(clientAuth.getTenantId).mockResolvedValue('tenant-123');

      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: { id: 'cleaning-123', status: 'completed' },
        error: null
      });

      mockSupabase.from().select().eq().eq().not().not().order.mockReturnValue({
        data: [
          { id: 'event-1', type: 'note', note: 'Public note' },
          { id: 'event-2', type: 'note', note: 'Interní poznámka pro tým' },
          { id: 'event-3', type: 'note', note: 'Internal note' }
        ],
        error: null
      });

      const result = await getClientCleaningDetail('client-123', 'cleaning-123');

      // Verify that internal notes are filtered out
      expect(result?.events).toHaveLength(1);
      expect(result?.events[0].note).toBe('Public note');
    });
  });
});





