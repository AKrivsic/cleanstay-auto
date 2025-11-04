import { NextRequest, NextResponse } from 'next/server';
import { getDailyMetricsSummary, getCostTrends, getCleaningPerformanceTrends } from '@/lib/metrics/aggregation';

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

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const type = searchParams.get('type') || 'summary';

    if (!from || !to) {
      return NextResponse.json({ error: 'from and to parameters required' }, { status: 400 });
    }

    // Validate date format
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    if (fromDate > toDate) {
      return NextResponse.json({ error: 'from date must be before to date' }, { status: 400 });
    }

    // Get data based on type
    let data;
    
    switch (type) {
      case 'summary':
        data = await getDailyMetricsSummary(user.tenant_id, from, to);
        break;
      case 'costs':
        data = await getCostTrends(user.tenant_id);
        break;
      case 'performance':
        data = await getCleaningPerformanceTrends(user.tenant_id);
        break;
      default:
        return NextResponse.json({ error: 'Invalid type. Use summary, costs, or performance' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data,
      from,
      to,
      type,
      tenant_id: user.tenant_id
    });

  } catch (error) {
    console.error('Error in metrics/daily GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




