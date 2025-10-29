import { describe, it, expect, beforeEach, vi } from 'vitest';
import { normalizeItems, extractQuantity } from '@/lib/inventory/normalize';
import { applySupplyOutFromEvent, applyManualIn, recount } from '@/lib/inventory/consumption';
import { getConsumption, getRecommendation } from '@/lib/inventory/recommendation';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: { id: 'test-movement-id' },
          error: null
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      }))
    }))
  }),
  rpc: vi.fn(() => ({
    data: [],
    error: null
  }))
};

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: () => mockSupabaseClient
}));

describe('Inventory Normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should normalize common items correctly', async () => {
    const mockSupplies = [
      { id: 'supply-1', name: 'Domestos', unit: 'ks' },
      { id: 'supply-2', name: 'Kávové kapsle', unit: 'ks' },
      { id: 'supply-3', name: 'Toaletní papír', unit: 'rolí' }
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: mockSupplies,
            error: null
          }))
        }))
      }))
    });

    const result = await normalizeItems(['Domestos', 'kapsle kafe', 'toaletak'], 'tenant-123');

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      supplyId: 'supply-1',
      name: 'Domestos',
      qty: 1,
      confidence: 0.9
    });
  });

  it('should handle unknown items with needsMapping flag', async () => {
    const mockSupplies = [
      { id: 'supply-1', name: 'Domestos', unit: 'ks' }
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: mockSupplies,
            error: null
          }))
        }))
      }))
    });

    const result = await normalizeItems(['Unknown Item', 'Domestos'], 'tenant-123');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      name: 'Unknown Item',
      needsMapping: true
    });
    expect(result[1]).toMatchObject({
      supplyId: 'supply-1',
      name: 'Domestos'
    });
  });

  it('should extract quantity from text correctly', () => {
    expect(extractQuantity('3x Domestos')).toEqual({ qty: 3, name: 'Domestos' });
    expect(extractQuantity('5× Kávové kapsle')).toEqual({ qty: 5, name: 'Kávové kapsle' });
    expect(extractQuantity('Domestos')).toEqual({ qty: 1, name: 'Domestos' });
  });
});

describe('Inventory Consumption', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should apply supply out from event correctly', async () => {
    const mockEvent = {
      id: 'event-123',
      tenant_id: 'tenant-123',
      property_id: 'property-123',
      note: 'Domestos, Kávové kapsle',
      payload: { items: ['Domestos', 'Kávové kapsle'] }
    };

    // Mock supplies
    const mockSupplies = [
      { id: 'supply-1', name: 'Domestos', unit: 'ks' },
      { id: 'supply-2', name: 'Kávové kapsle', unit: 'ks' }
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: mockSupplies,
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'movement-123' },
            error: null
          }))
        }))
      }))
    });

    const result = await applySupplyOutFromEvent(mockEvent);

    expect(result.movements).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it('should apply manual inventory in correctly', async () => {
    mockSupabaseClient.from.mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'movement-123' },
            error: null
          }))
        }))
      }))
    });

    const result = await applyManualIn('tenant-123', 'property-123', 'supply-123', 5, 'manual');

    expect(result.success).toBe(true);
    expect(result.movement).toBeDefined();
  });

  it('should handle recount correctly', async () => {
    const mockInventory = [
      { supply_id: 'supply-1' },
      { supply_id: 'supply-2' }
    ];

    const mockMovements = [
      { type: 'in', qty: 10 },
      { type: 'out', qty: 3 },
      { type: 'adjust', qty: 5 }
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: mockInventory,
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      }))
    });

    // Mock movements query
    mockSupabaseClient.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: mockMovements,
              error: null
            }))
          }))
        }))
      }))
    });

    const result = await recount('tenant-123', 'property-123');

    expect(result.success).toBe(true);
    expect(result.updated).toBe(2);
  });
});

describe('Inventory Recommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get consumption data correctly', async () => {
    const mockConsumptionData = [
      {
        supply_id: 'supply-1',
        supply_name: 'Domestos',
        unit: 'ks',
        total_used: 10,
        daily_average: 0.5
      }
    ];

    mockSupabaseClient.rpc.mockReturnValue({
      data: mockConsumptionData,
      error: null
    });

    const result = await getConsumption(
      'tenant-123',
      'property-123',
      '2024-01-01',
      '2024-01-31'
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      supply_id: 'supply-1',
      supply_name: 'Domestos',
      total_used: 10,
      daily_average: 0.5
    });
  });

  it('should get recommendations correctly', async () => {
    const mockRecommendations = [
      {
        supply_id: 'supply-1',
        supply_name: 'Domestos',
        unit: 'ks',
        current_qty: 5,
        min_qty: 10,
        max_qty: 50,
        daily_average: 0.5,
        recommended_buy: 15,
        rationale: 'Nízké zásoby'
      }
    ];

    mockSupabaseClient.rpc.mockReturnValue({
      data: mockRecommendations,
      error: null
    });

    const result = await getRecommendation('tenant-123', 'property-123', 21);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      supply_id: 'supply-1',
      supply_name: 'Domestos',
      recommended_buy: 15,
      priority: 'high'
    });
  });
});

describe('Inventory Integration', () => {
  it('should handle end-to-end inventory flow', async () => {
    // Test the complete flow: normalize -> apply -> recommend
    const mockEvent = {
      id: 'event-123',
      tenant_id: 'tenant-123',
      property_id: 'property-123',
      payload: { items: ['Domestos', 'Kávové kapsle'] }
    };

    const mockSupplies = [
      { id: 'supply-1', name: 'Domestos', unit: 'ks' },
      { id: 'supply-2', name: 'Kávové kapsle', unit: 'ks' }
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: mockSupplies,
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'movement-123' },
            error: null
          }))
        }))
      }))
    });

    // Test normalization
    const normalized = await normalizeItems(['Domestos', 'Kávové kapsle'], 'tenant-123');
    expect(normalized).toHaveLength(2);

    // Test consumption application
    const consumption = await applySupplyOutFromEvent(mockEvent);
    expect(consumption.movements).toHaveLength(2);

    // Test recommendations
    mockSupabaseClient.rpc.mockReturnValue({
      data: [
        {
          supply_id: 'supply-1',
          supply_name: 'Domestos',
          unit: 'ks',
          current_qty: 5,
          min_qty: 10,
          max_qty: 50,
          daily_average: 0.5,
          recommended_buy: 15,
          rationale: 'Nízké zásoby'
        }
      ],
      error: null
    });

    const recommendations = await getRecommendation('tenant-123', 'property-123', 21);
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].priority).toBe('high');
  });
});





