import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
import { createSupabaseClient } from '@/lib/supabase/client';

// GET /api/confirm/cleaning/[id]?type=client|cleaner&token=...
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const token = searchParams.get('token');

    if (!type || !token) {
      return NextResponse.json(
        { error: 'Missing type or token parameter' },
        { status: 400 }
      );
    }

    if (!['client', 'cleaner'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be client or cleaner' },
        { status: 400 }
      );
    }

    const cleaningId = params.id;
    const supabase = createSupabaseClient();

    // Verify token (simplified - in production use proper JWT verification)
    if (!verifyConfirmToken(token, cleaningId, type)) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get cleaning details
    const { data: cleaning, error: cleaningError } = await supabase
      .from('cleanings')
      .select(`
        id,
        property_id,
        scheduled_start,
        status,
        client_confirmed_at,
        cleaner_confirmed_at,
        properties!inner(name, address)
      `)
      .eq('id', cleaningId)
      .single();

    if (cleaningError || !cleaning) {
      return NextResponse.json(
        { error: 'Cleaning not found' },
        { status: 404 }
      );
    }

    // Check if already confirmed
    const alreadyConfirmed = type === 'client' 
      ? !!cleaning.client_confirmed_at 
      : !!cleaning.cleaner_confirmed_at;

    if (alreadyConfirmed) {
      return NextResponse.json({
        success: true,
        message: 'Already confirmed',
        data: {
          cleaning_id: cleaningId,
          property_name: cleaning.properties.name,
          scheduled_start: cleaning.scheduled_start,
          confirmed: true
        }
      });
    }

    // Update confirmation
    const updateField = type === 'client' ? 'client_confirmed_at' : 'cleaner_confirmed_at';
    const { error: updateError } = await supabase
      .from('cleanings')
      .update({
        [updateField]: new Date().toISOString()
      })
      .eq('id', cleaningId);

    if (updateError) {
      console.error('Error updating confirmation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update confirmation' },
        { status: 500 }
      );
    }

    // Log confirmation event
    await supabase
      .from('events')
      .insert({
        tenant_id: 'tenant-123', // TODO: Get from auth context
        type: 'confirmation',
        note: `${type} confirmed cleaning ${cleaningId}`,
        payload: {
          cleaning_id: cleaningId,
          type,
          confirmed_at: new Date().toISOString()
        }
      });

    // Log confirmation
    console.log('Cleaning confirmed:', {
      cleaningId,
      type,
      propertyName: cleaning.properties.name,
      scheduledStart: cleaning.scheduled_start
    });

    return NextResponse.json({
      success: true,
      message: 'Confirmation successful',
      data: {
        cleaning_id: cleaningId,
        property_name: cleaning.properties.name,
        scheduled_start: cleaning.scheduled_start,
        confirmed: true,
        type
      }
    });

  } catch (error) {
    console.error('Error in confirm/cleaning GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/confirm/cleaning/[id] (for programmatic confirmation)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type, confirmed } = body;

    if (!type || typeof confirmed !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing type or confirmed field' },
        { status: 400 }
      );
    }

    if (!['client', 'cleaner'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be client or cleaner' },
        { status: 400 }
      );
    }

    const cleaningId = params.id;
    const supabase = createSupabaseClient();

    // Update confirmation status
    const updateField = type === 'client' ? 'client_confirmed_at' : 'cleaner_confirmed_at';
    const updateValue = confirmed ? new Date().toISOString() : null;

    const { error: updateError } = await supabase
      .from('cleanings')
      .update({
        [updateField]: updateValue
      })
      .eq('id', cleaningId);

    if (updateError) {
      console.error('Error updating confirmation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update confirmation' },
        { status: 500 }
      );
    }

    // Log confirmation event
    await supabase
      .from('events')
      .insert({
        tenant_id: 'tenant-123', // TODO: Get from auth context
        type: 'confirmation',
        note: `${type} ${confirmed ? 'confirmed' : 'cancelled'} cleaning ${cleaningId}`,
        payload: {
          cleaning_id: cleaningId,
          type,
          confirmed,
          timestamp: new Date().toISOString()
        }
      });

    return NextResponse.json({
      success: true,
      message: `Confirmation ${confirmed ? 'successful' : 'cancelled'}`,
      data: {
        cleaning_id: cleaningId,
        type,
        confirmed
      }
    });

  } catch (error) {
    console.error('Error in confirm/cleaning POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Verify confirmation token (simplified)
function verifyConfirmToken(token: string, cleaningId: string, type: string): boolean {
  try {
    // In production, use proper JWT verification
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [id, tokenType, timestamp] = decoded.split('-');
    
    // Check if token is not older than 7 days
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    return id === cleaningId && 
           tokenType === type && 
           (now - tokenTime) < maxAge;
  } catch {
    return false;
  }
}





