import { NextRequest, NextResponse } from 'next/server';
import { isCleanStayEnabled } from '@/lib/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

// Property creation schema
const CreatePropertySchema = z.object({
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  address: z.string().min(1),
  type: z.enum(['apartment', 'house', 'office', 'hotel', 'other']),
  client_id: z.string().uuid(),
  size_sqm: z.number().positive().optional(),
  layout: z.string().optional(),
  bathrooms: z.number().positive().optional(),
  notes: z.string().optional(),
  settings: z.record(z.any()).optional(),
  // Extended property fields
  cleaning_instructions: z.string().optional(),
  access_instructions: z.string().optional(),
  equipment_on_site: z.string().optional(),
  preferred_cleaning_times: z.string().optional(),
  special_requirements: z.string().optional(),
  cleaning_supplies: z.enum(['client', 'ours', 'partial']).optional(),
  pets: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (!isCleanStayEnabled()) {
    return NextResponse.json(
      { error: 'CleanStay feature is disabled' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    
    // Get tenant_id from header (set by middleware after login)
    const tenantId = request.headers.get('x-tenant-id') || '550e8400-e29b-41d4-a716-446655440000';
    
    const propertyData = CreatePropertySchema.parse({
      ...body,
      tenant_id: tenantId
    });
    
    const supabase = getSupabaseServerClient();
    
    // Create property
    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...propertyData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create property:', error);
      return NextResponse.json(
        { error: 'Failed to create property' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data,
    });
    
  } catch (error) {
    console.error('Create property error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isCleanStayEnabled()) {
    return NextResponse.json(
      { error: 'CleanStay feature is disabled' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    
    const supabase = getSupabaseServerClient();
    
    let query = supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Failed to fetch properties:', error);
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data,
    });
    
  } catch (error) {
    console.error('Fetch properties error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
