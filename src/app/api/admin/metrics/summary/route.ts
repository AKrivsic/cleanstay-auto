import { NextRequest, NextResponse } from 'next/server';
import { getMetricsSummary } from '@/lib/metrics/aggregation';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement proper JWT verification
    // For now, simulate admin user
    const user = {
      id: '00000000-0000-0000-0000-000000000000',
      tenant_id: '00000000-0000-0000-0000-000000000000',
      role: 'admin'
    };

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
    }

    // Get metrics summary
    const data = await getMetricsSummary(user.tenant_id);

    return NextResponse.json({
      success: true,
      data,
      generated_at: new Date().toISOString(),
      tenant_id: user.tenant_id
    });

  } catch (error) {
    console.error('Error in metrics/summary GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




