import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { getInventorySnapshot, getRecommendation, getLowStockAlerts } from '@/lib/inventory/recommendation';
import { applyManualIn, applyManualAdjust, recount } from '@/lib/inventory/consumption';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';



// GET /api/admin/inventory?propertyId=...&from=...&to=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Get tenant ID from auth (simplified for now)
    const tenantId = 'tenant-123'; // TODO: Get from auth context

    // Get inventory snapshot
    const snapshot = await getInventorySnapshot(tenantId, propertyId);

    // Get consumption data if date range provided
    let consumptionData: any[] = [];
    if (from && to) {
      const { getConsumption } = await import('@/lib/inventory/recommendation');
      consumptionData = await getConsumption(tenantId, propertyId, from, to);
    }

    // Get low stock alerts
    const lowStockAlerts = await getLowStockAlerts(tenantId, propertyId);

    return NextResponse.json({
      success: true,
      data: {
        snapshot,
        consumption: consumptionData,
        lowStockAlerts,
        propertyId,
        dateRange: from && to ? { from, to } : null
      }
    });

  } catch (error) {
    console.error('Error in inventory GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/inventory/adjust
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, supplyId, qty, reason, action } = body;

    if (!propertyId || !supplyId || qty === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get tenant ID from auth (simplified for now)
    const tenantId = 'tenant-123'; // TODO: Get from auth context

    let result;
    
    if (action === 'adjust') {
      result = await applyManualAdjust(tenantId, propertyId, supplyId, qty, reason || 'Manual adjustment');
    } else if (action === 'in') {
      result = await applyManualIn(tenantId, propertyId, supplyId, qty, 'manual');
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "adjust" or "in"' },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        movement: result.movement,
        action,
        propertyId,
        supplyId,
        qty
      }
    });

  } catch (error) {
    console.error('Error in inventory POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/inventory/recount
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Get tenant ID from auth (simplified for now)
    const tenantId = 'tenant-123'; // TODO: Get from auth context

    const result = await recount(tenantId, propertyId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        propertyId,
        updatedCount: result.updated
      }
    });

  } catch (error) {
    console.error('Error in inventory PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
