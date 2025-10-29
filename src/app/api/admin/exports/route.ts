import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { getInventorySnapshot, getConsumption } from '@/lib/inventory/recommendation';
import { getRecommendation } from '@/lib/inventory/recommendation';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

// GET /api/admin/exports?type=inventory&propertyId=...&from=...&to=...&format=csv|pdf
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const propertyId = searchParams.get('propertyId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const format = searchParams.get('format') || 'csv';

    if (!type || !propertyId) {
      return NextResponse.json(
        { error: 'Type and Property ID are required' },
        { status: 400 }
      );
    }

    // Get tenant ID from auth (simplified for now)
    const tenantId = '00000000-0000-0000-0000-000000000000'; // Valid UUID format

    if (type === 'inventory') {
      return await exportInventory(tenantId, propertyId, from, to, format);
    } else if (type === 'recommendations') {
      return await exportRecommendations(tenantId, propertyId, format);
    } else {
      return NextResponse.json(
        { error: 'Invalid export type. Use "inventory" or "recommendations"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in exports GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export inventory data
async function exportInventory(
  tenantId: string,
  propertyId: string,
  from: string | null,
  to: string | null,
  format: string
) {
  try {
    // Get inventory snapshot
    const snapshot = await getInventorySnapshot(tenantId, propertyId);

    // Get consumption data if date range provided
    let consumptionData: any[] = [];
    if (from && to) {
      consumptionData = await getConsumption(tenantId, propertyId, from, to);
    }

    if (format === 'csv') {
      return await generateInventoryCSV(snapshot, consumptionData, from, to);
    } else if (format === 'pdf') {
      return await generateInventoryPDF(snapshot, consumptionData, from, to);
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use "csv" or "pdf"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error exporting inventory:', error);
    return NextResponse.json(
      { error: 'Failed to export inventory' },
      { status: 500 }
    );
  }
}

// Export recommendations
async function exportRecommendations(
  tenantId: string,
  propertyId: string,
  format: string
) {
  try {
    const recommendations = await getRecommendation(tenantId, propertyId, 21);

    if (format === 'csv') {
      return await generateRecommendationsCSV(recommendations as any);
    } else if (format === 'pdf') {
      return await generateRecommendationsPDF(recommendations as any);
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use "csv" or "pdf"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error exporting recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to export recommendations' },
      { status: 500 }
    );
  }
}

// Generate CSV for inventory
interface InventorySnapshot {
  supply_name: string;
  unit: string;
  current_qty: number;
  min_qty: number;
  max_qty: number;
}

interface ConsumptionData {
  supply_name: string;
  unit: string;
  consumed_qty: number;
  date: string;
}

async function generateInventoryCSV(
  snapshot: InventorySnapshot[],
  consumptionData: ConsumptionData[],
  from: string | null,
  to: string | null
) {
  const csvHeaders = [
    'Supply Name',
    'Unit',
    'Current Qty',
    'Min Qty',
    'Max Qty',
    'Daily Average',
    'Used (Period)',
    'Recommendation'
  ];

  const csvRows = snapshot.map(item => {
    const consumption = consumptionData.find((c: any) => c.supply_id === (item as any).supply_id);
    const used = (consumption as any)?.total_used || 0;
    const dailyAvg = (consumption as any)?.daily_average || 0;
    
    // Simple recommendation logic
    let recommendation = 'OK';
    if (item.current_qty < item.min_qty) {
      recommendation = 'LOW STOCK';
    } else if (item.current_qty > item.max_qty) {
      recommendation = 'OVERSTOCKED';
    }

    return [
      item.supply_name,
      item.unit,
      item.current_qty,
      item.min_qty,
      item.max_qty,
      dailyAvg.toFixed(2),
      used,
      recommendation
    ];
  });

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  const filename = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}

// Generate CSV for recommendations
interface Recommendation {
  supply_name: string;
  unit: string;
  recommended_qty: number;
  reason: string;
  priority: string;
}

async function generateRecommendationsCSV(recommendations: Recommendation[]) {
  const csvHeaders = [
    'Supply Name',
    'Unit',
    'Current Qty',
    'Min Qty',
    'Max Qty',
    'Daily Average',
    'Recommended Buy',
    'Priority',
    'Rationale'
  ];

  const csvRows = recommendations.map(item => [
    item.supply_name,
    item.unit,
    (item as any).current_qty,
    (item as any).min_qty,
    (item as any).max_qty,
    (item as any).daily_average.toFixed(2),
    (item as any).recommended_buy,
    (item as any).priority,
    (item as any).rationale
  ]);

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  const filename = `recommendations-export-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}

// Generate PDF for inventory (stub implementation)
async function generateInventoryPDF(
  snapshot: InventorySnapshot[],
  consumptionData: ConsumptionData[],
  from: string | null,
  to: string | null
) {
  // This is a stub implementation
  // In a real implementation, you would use a PDF library like puppeteer or jsPDF
  return NextResponse.json(
    { error: 'PDF export not yet implemented' },
    { status: 501 }
  );
}

// Generate PDF for recommendations (stub implementation)
async function generateRecommendationsPDF(recommendations: Recommendation[]) {
  // This is a stub implementation
  // In a real implementation, you would use a PDF library like puppeteer or jsPDF
  return NextResponse.json(
    { error: 'PDF export not yet implemented' },
    { status: 501 }
  );
}
