import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyKPIs } from '@/lib/metrics/aggregation';

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
    const year = searchParams.get('year');

    if (!year) {
      return NextResponse.json({ error: 'year parameter required' }, { status: 400 });
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return NextResponse.json({ error: 'Invalid year. Must be between 2020 and 2030' }, { status: 400 });
    }

    // Get monthly KPIs
    const data = await getMonthlyKPIs(user.tenant_id, yearNum);

    return NextResponse.json({
      success: true,
      data,
      year: yearNum,
      tenant_id: user.tenant_id
    });

  } catch (error) {
    console.error('Error in metrics/monthly GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




