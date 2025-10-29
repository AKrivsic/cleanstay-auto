import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

// POST /api/admin/events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, cleaning_id, recipient, template, language, result, latency_ms } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Get tenant ID from auth (simplified for now)
    const tenantId = 'tenant-123'; // TODO: Get from auth context

    // Create event record
    const { data, error } = await supabase
      .from('events')
      .insert({
        tenant_id: tenantId,
        type: type,
        note: `Notification: ${template} to ${recipient}`,
        payload: {
          template,
          recipient: recipient.substring(0, 3) + '***',
          language,
          result,
          latency_ms,
          cleaning_id
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json(
        { error: 'Failed to log event' },
        { status: 500 }
      );
    }

    // Log event creation
    console.log('Event logged:', {
      type,
      template,
      recipient: recipient.substring(0, 3) + '***',
      language,
      eventId: data.id,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return NextResponse.json({
      success: true,
      data: {
        eventId: data.id,
        type,
        timestamp: data.created_at
      }
    });

  } catch (error) {
    console.error('Error in events POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/events (for metrics)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const supabase = createSupabaseClient();

    // Get tenant ID from auth (simplified for now)
    const tenantId = 'tenant-123'; // TODO: Get from auth context

    // Build query
    let query = supabase
      .from('events')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      query = query.lte('created_at', to);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // Calculate metrics
    const metrics = calculateMetrics(data || []);

    return NextResponse.json({
      success: true,
      data: {
        events: data,
        metrics,
        total: data?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in events GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Calculate metrics from events
interface EventData {
  type: string;
  payload?: {
    template?: string;
    language?: string;
    latency_ms?: number;
  };
}

function calculateMetrics(events: EventData[]) {
  const notificationEvents = events.filter(e => e.type === 'notification_sent');
  
  const templateStats = notificationEvents.reduce((acc, event) => {
    const template = event.payload?.template || 'unknown';
    if (!acc[template]) {
      acc[template] = { count: 0, languages: new Set() };
    }
    acc[template].count++;
    if (event.payload?.language) {
      acc[template].languages.add(event.payload.language);
    }
    return acc;
  }, {} as Record<string, { count: number; languages: Set<string> }>);

  const languageStats = notificationEvents.reduce((acc, event) => {
    const language = event.payload?.language || 'unknown';
    acc[language] = (acc[language] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgLatency = notificationEvents
    .filter(e => e.payload?.latency_ms)
    .reduce((sum, e) => sum + (e.payload?.latency_ms || 0), 0) / notificationEvents.length || 0;

  return {
    totalNotifications: notificationEvents.length,
    templateStats: Object.fromEntries(
      Object.entries(templateStats).map(([template, stats]: [string, any]) => [
        template,
        {
          count: stats.count,
          languages: Array.from(stats.languages)
        }
      ])
    ),
    languageStats,
    avgLatency: Math.round(avgLatency),
    successRate: notificationEvents.filter(e => (e.payload as any)?.result === 'success').length / notificationEvents.length || 0
  };
}




