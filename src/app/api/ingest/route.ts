import { NextRequest, NextResponse } from 'next/server';
import { isCleanStayEnabled } from '@/lib/env';
import { parseMessage } from '@/lib/ai/parseMessage';
import { openSession, closeSession, appendEvent, getActiveSession } from '@/lib/sessions';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getCleaningReport, getPhotos, getInventorySnapshot } from '@/app/api/admin/reports/_data';
import { formatCleaningReportForChat, formatPhotosForChat, formatInventoryForChat, formatErrorForChat } from '@/lib/reports/formatters';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';






// Message ingestion API - processes parsed messages into sessions
export async function POST(request: NextRequest) {
  if (!isCleanStayEnabled()) {
    return NextResponse.json(
      { error: 'CleanStay feature is disabled' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { text, from_phone, tenantId } = body;

    if (!text || !from_phone || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields: text, from_phone, tenantId' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    
    // Parse message with AI
    const parsed = await parseMessage(text);
    
    // Handle ask responses
    if ('ask' in parsed) {
      return NextResponse.json({
        ok: true,
        ask: parsed.ask
      });
    }

    // Check for report queries before processing session events
    const reportResponse = await handleReportQuery(text, tenantId, from_phone);
    if (reportResponse) {
      return NextResponse.json({
        ok: true,
        response: reportResponse
      });
    }

    // Process based on parsed type
    let result: any = { ok: true };

    try {
      switch (parsed.type) {
        case 'start_cleaning':
          const sessionResult = await openSession({
            tenantId,
            cleanerPhone: from_phone,
            propertyHint: parsed.property_hint
          });
          result.sessionId = sessionResult.sessionId;
          result.propertyId = sessionResult.propertyId;
          break;

        case 'done':
          await closeSession({
            tenantId,
            cleanerPhone: from_phone,
            reason: 'done'
          });
          result.closed = true;
          break;

        case 'supply_out':
        case 'linen_used':
        case 'note':
        case 'photo_meta':
          const eventResult = await appendEvent({
            tenantId,
            cleanerPhone: from_phone,
            parsed
          });
          result.sessionId = eventResult.sessionId;
          result.eventId = eventResult.eventId;
          break;

        default:
          // Check if there's an active session for context
          const activeSession = await getActiveSession(tenantId, from_phone);
          if (!activeSession) {
            return NextResponse.json({
              ok: true,
              ask: 'U kterého bytu jsi? Napiš "Začínám úklid ..."'
            });
          }
          
          // Try to append as note
          const noteResult = await appendEvent({
            tenantId,
            cleanerPhone: from_phone,
            parsed: {
              ...parsed,
              type: 'note',
              payload: { text: text }
            }
          });
          result.sessionId = noteResult.sessionId;
          result.eventId = noteResult.eventId;
      }

      // Log processing metadata
      const duration = Date.now() - startTime;
      console.log('Message ingested:', {
        type: parsed.type,
        confidence: parsed.confidence,
        duration: `${duration}ms`,
        sessionId: result.sessionId
      });

      return NextResponse.json(result);

    } catch (error: any) {
      // Handle session conflicts and other errors
      if (error.message.includes('Myslíš') || error.message.includes('Mám ukončit')) {
        return NextResponse.json({
          ok: true,
          ask: error.message
        });
      }

      if (error.message.includes('U kterého bytu')) {
        return NextResponse.json({
          ok: true,
          ask: error.message
        });
      }

      // Log error and return generic message
      console.error('Session processing error:', error);
      return NextResponse.json({
        ok: true,
        ask: 'Něco se pokazilo. Můžete to zopakovat?'
      });
    }

  } catch (error) {
    console.error('Ingest API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get active session for cleaner (helper endpoint)
export async function GET(request: NextRequest) {
  if (!isCleanStayEnabled()) {
    return NextResponse.json(
      { error: 'CleanStay feature is disabled' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const cleanerPhone = searchParams.get('cleanerPhone');

    if (!tenantId || !cleanerPhone) {
      return NextResponse.json(
        { error: 'Missing tenantId or cleanerPhone' },
        { status: 400 }
      );
    }

    const activeSession = await getActiveSession(tenantId, cleanerPhone);
    
    if (!activeSession) {
      return NextResponse.json({ active: false });
    }

    return NextResponse.json({
      active: true,
      sessionId: activeSession.sessionId,
      propertyId: activeSession.propertyId
    });

  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle report queries in messages
async function handleReportQuery(text: string, tenantId: string, fromPhone: string): Promise<string | null> {
  try {
    const lowerText = text.toLowerCase();
    
    // Detect report queries
    const isCleaningReport = /report|úklid|cleaning/.test(lowerText) && /\d+/.test(lowerText);
    const isPhotosQuery = /fotky|photos|obrázky/.test(lowerText) && /\d+/.test(lowerText);
    const isInventoryQuery = /zásoby|inventory|spotřeba/.test(lowerText) && /\d+/.test(lowerText);
    
    if (!isCleaningReport && !isPhotosQuery && !isInventoryQuery) {
      return null;
    }
    
    // Extract property hint and date
    const propertyMatch = text.match(/(\d+)/);
    const propertyHint = propertyMatch ? propertyMatch[1] : null;
    
    if (!propertyHint) {
      return formatErrorForChat('Nespecifikován byt. Zkuste: "report 302 dnes"');
    }
    
    // Find property by hint
    const supabase = getSupabaseServerClient();
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .ilike('name', `%${propertyHint}%`)
      .limit(5);
    
    if (error || !properties || properties.length === 0) {
      return formatErrorForChat(`Byt ${propertyHint} nenalezen`);
    }
    
    if (properties.length > 1) {
      const hints = properties.map((p: any) => p.name).join(', ');
      return `❓ Který byt máte na mysli? Dostupné: ${hints}`;
    }
    
    const property = properties[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Handle different query types
    if (isCleaningReport) {
      const report = await getCleaningReport(tenantId, property.id, today, false);
      return formatCleaningReportForChat(report);
    }
    
    if (isPhotosQuery) {
      const photos = await getPhotos(tenantId, property.id, today, 'all');
      return formatPhotosForChat(photos);
    }
    
    if (isInventoryQuery) {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7); // Last 7 days
      const inventory = await getInventorySnapshot(
        tenantId, 
        property.id, 
        fromDate.toISOString().split('T')[0], 
        today
      );
      return formatInventoryForChat(inventory);
    }
    
    return null;
    
  } catch (error) {
    console.error('Error handling report query:', error);
    return formatErrorForChat('Chyba při generování reportu');
  }
}
