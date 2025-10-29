import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

// GET /api/admin/supplies?search=...&page=...&pageSize=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Get tenant ID from auth (simplified for now)
    const tenantId = '00000000-0000-0000-0000-000000000000'; // Valid UUID format

    const supabase = createSupabaseClient();

    // Build query
    let query = supabase
      .from('supplies')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    // Add search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Add pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching supplies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch supplies' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        supplies: data || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        },
        search: search || null
      }
    });

  } catch (error) {
    console.error('Error in supplies GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/supplies
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, unit, sku } = body;

    if (!name || !unit) {
      return NextResponse.json(
        { error: 'Name and unit are required' },
        { status: 400 }
      );
    }

    // Get tenant ID from auth (simplified for now)
    const tenantId = '00000000-0000-0000-0000-000000000000'; // Valid UUID format

    const supabase = createSupabaseClient();

    // Check if supply already exists
    const { data: existing, error: checkError } = await supabase
      .from('supplies')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('name', name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing supply:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing supply' },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Supply with this name already exists' },
        { status: 409 }
      );
    }

    // Create new supply
    const { data, error } = await supabase
      .from('supplies')
      .insert({
        tenant_id: tenantId,
        name,
        unit,
        sku: sku || null,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating supply:', error);
      return NextResponse.json(
        { error: 'Failed to create supply' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        supply: data
      }
    });

  } catch (error) {
    console.error('Error in supplies POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/supplies/[id]
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, unit, sku, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Supply ID is required' },
        { status: 400 }
      );
    }

    // Get tenant ID from auth (simplified for now)
    const tenantId = '00000000-0000-0000-0000-000000000000'; // Valid UUID format

    const supabase = createSupabaseClient();

    // Update supply
    const { data, error } = await supabase
      .from('supplies')
      .update({
        name: name || undefined,
        unit: unit || undefined,
        sku: sku || undefined,
        is_active: is_active !== undefined ? is_active : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating supply:', error);
      return NextResponse.json(
        { error: 'Failed to update supply' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        supply: data
      }
    });

  } catch (error) {
    console.error('Error in supplies PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/supplies/[id]
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Supply ID is required' },
        { status: 400 }
      );
    }

    // Get tenant ID from auth (simplified for now)
    const tenantId = '00000000-0000-0000-0000-000000000000'; // Valid UUID format

    const supabase = createSupabaseClient();

    // Soft delete (set is_active to false)
    const { data, error } = await supabase
      .from('supplies')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting supply:', error);
      return NextResponse.json(
        { error: 'Failed to delete supply' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        supply: data
      }
    });

  } catch (error) {
    console.error('Error in supplies DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
