import { NextRequest, NextResponse } from 'next/server';
import { isCleanStayEnabled } from '@/lib/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

// User creation schema
const CreateUserSchema = z.object({
  tenant_id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'manager', 'cleaner', 'client']),
  phone: z.string().optional(),
  whatsapp_number: z.string().optional(),
  properties: z.array(z.string().uuid()).optional(),
  settings: z.record(z.any()).optional(),
  
  // Client-specific fields
  billing_address: z.string().optional(),
  ico: z.string().optional(),
  dic: z.string().optional(),
  notes: z.string().optional(),
  payment_terms: z.string().optional(),
  billing_frequency: z.enum(['after_cleaning', 'monthly', 'weekly', 'quarterly']).optional(),
  
  // Cleaner-specific fields
  messenger: z.string().optional(),
  document_number: z.string().optional(),
  document_type: z.enum(['passport', 'id_card', 'driving_license', 'other']).optional(),
  document_valid_until: z.string().optional(),
  requested_hourly_rate_from: z.number().positive().optional(),
  languages: z.array(z.string()).optional(),
  availability: z.string().optional(),
  specializations: z.array(z.string()).optional(),
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
    console.log('User creation request body:', body);
    
    // Get tenant_id from header (set by middleware after login)
    const tenantId = request.headers.get('x-tenant-id') || '550e8400-e29b-41d4-a716-446655440000';
    console.log('Using tenant_id:', tenantId);
    
    const userData = CreateUserSchema.parse({
      ...body,
      tenant_id: tenantId
    });
    console.log('Parsed user data:', userData);
    
    const supabase = getSupabaseServerClient();
    
    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...userData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create user:', error);
      return NextResponse.json(
        { error: 'Failed to create user', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data,
    });
    
  } catch (error) {
    console.error('Create user error:', error);
    
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
    const role = searchParams.get('role');
    
    const supabase = getSupabaseServerClient();
    
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Failed to fetch users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data,
    });
    
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
