import { NextRequest, NextResponse } from 'next/server';
import { aggregateDailyMetrics, aggregateMonthlyKPI, checkCostLimits } from '@/lib/metrics/aggregation';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement proper JWT verification
    // For now, simulate admin user
    const user = {
      id: 'admin-user-123',
      tenant_id: 'tenant-123',
      role: 'admin'
    };

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
    }

    const body = await request.json();
    const { type, date, month } = body;

    if (!type) {
      return NextResponse.json({ error: 'type parameter required' }, { status: 400 });
    }

    let result;
    let costLimits;

    switch (type) {
      case 'daily':
        if (!date) {
          return NextResponse.json({ error: 'date parameter required for daily aggregation' }, { status: 400 });
        }

        // Validate date format
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
        }

        result = await aggregateDailyMetrics(user.tenant_id, date);
        costLimits = await checkCostLimits(user.tenant_id, date);
        break;

      case 'monthly':
        if (!month) {
          return NextResponse.json({ error: 'month parameter required for monthly aggregation' }, { status: 400 });
        }

        // Validate month format
        const monthObj = new Date(month);
        if (isNaN(monthObj.getTime())) {
          return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM-01' }, { status: 400 });
        }

        result = await aggregateMonthlyKPI(user.tenant_id, month);
        break;

      default:
        return NextResponse.json({ error: 'Invalid type. Use daily or monthly' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      type,
      data: result,
      cost_limits: costLimits,
      aggregated_at: new Date().toISOString(),
      tenant_id: user.tenant_id
    });

  } catch (error) {
    console.error('Error in metrics/aggregate POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      id: 'admin-user-123',
      tenant_id: 'tenant-123',
      role: 'admin'
    };

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');

    if (!date && !month) {
      return NextResponse.json({ error: 'date or month parameter required' }, { status: 400 });
    }

    let result;
    let costLimits;

    if (date) {
      // Daily aggregation
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
      }

      result = await aggregateDailyMetrics(user.tenant_id, date);
      costLimits = await checkCostLimits(user.tenant_id, date);
    } else if (month) {
      // Monthly aggregation
      const monthObj = new Date(month);
      if (isNaN(monthObj.getTime())) {
        return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM-01' }, { status: 400 });
      }

      result = await aggregateMonthlyKPI(user.tenant_id, month);
    }

    return NextResponse.json({
      success: true,
      data: result,
      cost_limits: costLimits,
      aggregated_at: new Date().toISOString(),
      tenant_id: user.tenant_id
    });

  } catch (error) {
    console.error('Error in metrics/aggregate GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




