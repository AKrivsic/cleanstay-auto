import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isCleanStayEnabled } from '@/lib/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

// Cleaning creation schema
const CreateCleaningSchema = z.object({
  property_id: z.string().uuid(),
  cleaner_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  scheduled_date: z.string().datetime(),
  estimated_duration_hours: z.number().positive().default(2),
  notes: z.string().optional(),
  special_instructions: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
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
    
    const cleaningData = CreateCleaningSchema.parse(body);
    
    const supabase = getSupabaseServerClient();
    
    // Calculate scheduled_end based on duration
    const scheduledStart = new Date(cleaningData.scheduled_date);
    const scheduledEnd = new Date(scheduledStart.getTime() + (cleaningData.estimated_duration_hours * 60 * 60 * 1000));
    
    // Create cleaning
    const { data, error } = await supabase
      .from('cleanings')
      .insert({
        tenant_id: tenantId,
        property_id: cleaningData.property_id,
        cleaner_id: cleaningData.cleaner_id,
        client_id: cleaningData.client_id,
        status: 'scheduled',
        scheduled_date: cleaningData.scheduled_date,
        started_at: null,
        completed_at: null,
        notes: cleaningData.notes,
        client_feedback: null,
        rating: null,
        metadata: {
          estimated_duration_hours: cleaningData.estimated_duration_hours,
          special_instructions: cleaningData.special_instructions,
          priority: cleaningData.priority,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        id,
        property_id,
        cleaner_id,
        client_id,
        status,
        scheduled_date,
        notes,
        metadata,
        properties!inner(name, address),
        users!cleanings_cleaner_id_fkey(name, email),
        users!cleanings_client_id_fkey(name, email)
      `)
      .single();
    
    if (error) {
      console.error('Failed to create cleaning:', error);
      return NextResponse.json(
        { error: 'Failed to create cleaning', details: error.message },
        { status: 500 }
      );
    }
    
    // Log cleaning creation event
    await supabase
      .from('events')
      .insert({
        tenant_id: tenantId,
        cleaning_id: data.id,
        property_id: cleaningData.property_id,
        event_type: 'cleaning_scheduled',
        event_data: {
          scheduled_date: cleaningData.scheduled_date,
          estimated_duration_hours: cleaningData.estimated_duration_hours,
          priority: cleaningData.priority,
        },
        created_at: new Date().toISOString(),
      });
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Cleaning scheduled successfully'
    });
    
  } catch (error) {
    console.error('Create cleaning error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
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
    const tenantId = request.headers.get('x-tenant-id') || '550e8400-e29b-41d4-a716-446655440000';
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const propertyId = searchParams.get('property_id');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '10');
    
    const supabase = getSupabaseServerClient();
    
    let query = supabase
      .from('cleanings')
      .select(`
        id,
        property_id,
        cleaner_id,
        client_id,
        status,
        scheduled_date,
        started_at,
        completed_at,
        notes,
        metadata,
        created_at,
        properties!inner(name, address, type),
        users!cleanings_cleaner_id_fkey(name, email, phone),
        users!cleanings_client_id_fkey(name, email, phone)
      `)
      .eq('tenant_id', tenantId)
      .order('scheduled_date', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }
    
    // Add pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data: cleanings, error } = await query;
    
    if (error) {
      console.error('Failed to fetch cleanings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cleanings', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: cleanings || [],
      pagination: {
        page,
        page_size: pageSize,
        total: cleanings?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Get cleanings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
