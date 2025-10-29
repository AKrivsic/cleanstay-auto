import { NextRequest, NextResponse } from 'next/server';
import { getRecommendation, generateShoppingList } from '@/lib/inventory/recommendation';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

// GET /api/admin/recommend?propertyId=...&horizonDays=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const horizonDays = parseInt(searchParams.get('horizonDays') || '21');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Get tenant ID from auth (simplified for now)
    const tenantId = 'tenant-123'; // TODO: Get from auth context

    // Get recommendations
    const recommendations = await getRecommendation(tenantId, propertyId, horizonDays);

    // Generate shopping list
    const shoppingList = await generateShoppingList(tenantId, propertyId, horizonDays);

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        shoppingList,
        propertyId,
        horizonDays,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in recommend GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/recommend (for bulk recommendations)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyIds, horizonDays = 21 } = body;

    if (!propertyIds || !Array.isArray(propertyIds)) {
      return NextResponse.json(
        { error: 'Property IDs array is required' },
        { status: 400 }
      );
    }

    // Get tenant ID from auth (simplified for now)
    const tenantId = 'tenant-123'; // TODO: Get from auth context

    // Get recommendations for all properties
    const results = await Promise.all(
      propertyIds.map(async (propertyId: string) => {
        const recommendations = await getRecommendation(tenantId, propertyId, horizonDays);
        const shoppingList = await generateShoppingList(tenantId, propertyId, horizonDays);
        
        return {
          propertyId,
          recommendations,
          shoppingList
        };
      })
    );

    // Aggregate results
    const totalItems = results.reduce((sum, result) => sum + result.shoppingList.totalItems, 0);
    const totalHighPriority = results.reduce((sum, result) => sum + result.shoppingList.highPriorityItems, 0);

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          totalProperties: propertyIds.length,
          totalItems,
          totalHighPriority,
          horizonDays
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in recommend POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




