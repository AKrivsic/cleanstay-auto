import { NextRequest, NextResponse } from 'next/server';
import { isCleanStayEnabled } from '@/lib/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isCleanStayEnabled()) {
    return NextResponse.json(
      { error: 'CleanStay feature is disabled' },
      { status: 503 }
    );
  }

  try {
    const userId = params.id;
    
    // Get tenant_id from header (set by middleware after login)
    const tenantId = request.headers.get('x-tenant-id') || '550e8400-e29b-41d4-a716-446655440000';
    
    const supabase = getSupabaseServerClient();
    
    // Delete user (only from the same tenant)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .eq('tenant_id', tenantId);
    
    if (error) {
      console.error('Failed to delete user:', error);
      return NextResponse.json(
        { error: 'Failed to delete user', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isCleanStayEnabled()) {
    return NextResponse.json(
      { error: 'CleanStay feature is disabled' },
      { status: 503 }
    );
  }

  try {
    const userId = params.id;
    const body = await request.json();
    
    // Get tenant_id from header (set by middleware after login)
    const tenantId = request.headers.get('x-tenant-id') || '550e8400-e29b-41d4-a716-446655440000';
    
    const supabase = getSupabaseServerClient();
    
    // Handle property_ids separately
    const { property_ids, ...userData } = body;
    
    // Update user (only from the same tenant)
    const { error } = await supabase
      .from('users')
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId);
    
    if (error) {
      console.error('Failed to update user:', error);
      return NextResponse.json(
        { error: 'Failed to update user', details: error.message },
        { status: 500 }
      );
    }
    
    // Update properties if property_ids is provided
    if (property_ids && Array.isArray(property_ids)) {
      // First, remove this client from all properties
      await supabase
        .from('properties')
        .update({ client_id: null })
        .eq('tenant_id', tenantId)
        .eq('client_id', userId);
      
      // Then, set this client on the selected properties
      if (property_ids.length > 0) {
        await supabase
          .from('properties')
          .update({ client_id: userId })
          .eq('tenant_id', tenantId)
          .in('id', property_ids);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
