import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
import { isCleanStayEnabled } from '@/lib/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { validateMediaInfo, downloadWhatsAppMedia } from '@/lib/media/downloadWhatsAppMedia';
import { processImage } from '@/lib/media/processImage';
import { getActiveSession } from '@/lib/sessions';
import { derivePhase, isFirstPhotoAfterStart, hasOtherEventsInSession, getMinutesSinceDone } from '@/lib/media/derivePhase';
import { saveToStorage, generateMediaPath } from '@/lib/media/storage';
import { v4 as uuidv4 } from 'uuid';








// Media ingestion worker endpoint
export async function POST(request: NextRequest) {
  if (!isCleanStayEnabled()) {
    return NextResponse.json(
      { error: 'CleanStay feature is disabled' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { messageId, from_phone, tenantId } = body;

    if (!messageId || !from_phone || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, from_phone, tenantId' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const supabase = getSupabaseServerClient();

    // 1. Get raw message from database
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('tenant_id', tenantId)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // 2. Extract media info from message
    const rawPayload = message.raw;
    const mediaInfo = rawPayload.image || rawPayload.document;
    
    if (!mediaInfo) {
      return NextResponse.json(
        { error: 'No media found in message' },
        { status: 400 }
      );
    }

    // 3. Download media from WhatsApp
    const validatedMediaInfo = validateMediaInfo(mediaInfo);
    const downloadResult = await downloadWhatsAppMedia(validatedMediaInfo);

    // 4. Process image (convert, rotate, resize)
    const processedImage = await processImage(downloadResult.buffer, downloadResult.contentType);

    // 5. Get session context
    const activeSession = await getActiveSession(tenantId, from_phone);
    
    let cleaningId: string;
    let propertyId: string;
    let phase: 'before' | 'after' | 'other';

    if (activeSession) {
      // Active session - get cleaning ID
      const { data: cleaning, error: cleaningError } = await supabase
        .from('cleanings')
        .select('id')
        .eq('property_id', activeSession.propertyId)
        .eq('status', 'in_progress')
        .single();

      if (cleaningError || !cleaning) {
        return NextResponse.json(
          { error: 'No active cleaning found for session' },
          { status: 400 }
        );
      }

      cleaningId = cleaning.id;
      propertyId = activeSession.propertyId;

      // Get events for phase determination
      const { data: events } = await supabase
        .from('events')
        .select('type, start')
        .eq('property_id', propertyId)
        .eq('cleaning_id', cleaningId)
        .order('start', { ascending: true });

      const isFirstPhoto = isFirstPhotoAfterStart(
        new Date((activeSession as any).started_at || new Date()),
        new Date(),
        events || []
      );

      const hasOtherEvents = hasOtherEventsInSession(events || []);

      phase = derivePhase({
        hasOpenSession: true,
        isFirstPhotoAfterStart: isFirstPhoto,
        hasOtherEvents
      });

    } else {
      // No active session - try to assign to last closed session today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: lastCleaning, error: cleaningError } = await supabase
        .from('cleanings')
        .select('id, property_id')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .gte('scheduled_start', today.toISOString())
        .lt('scheduled_start', tomorrow.toISOString())
        .order('scheduled_start', { ascending: false })
        .limit(1)
        .single();

      if (cleaningError || !lastCleaning) {
        return NextResponse.json(
          { error: 'No recent cleaning found. Please start a new session.' },
          { status: 400 }
        );
      }

      cleaningId = lastCleaning.id;
      propertyId = lastCleaning.property_id;

      // Get done events for phase determination
      const { data: doneEvents } = await supabase
        .from('events')
        .select('start')
        .eq('property_id', propertyId)
        .eq('cleaning_id', cleaningId)
        .eq('type', 'done')
        .order('start', { ascending: false });

      const minutesSinceDone = getMinutesSinceDone(doneEvents || []);

      phase = derivePhase({
        hasOpenSession: false,
        minutesSinceDone
      });
    }

    // 6. Generate storage paths
    const timestamp = new Date();
    const uuid = uuidv4();
    
    const mainPath = generateMediaPath(tenantId, propertyId, cleaningId, phase, timestamp, uuid, false);
    const thumbPath = generateMediaPath(tenantId, propertyId, cleaningId, phase, timestamp, uuid, true);

    // 7. Save to storage
    const mainResult = await saveToStorage(
      'media',
      mainPath,
      processedImage.mainBuffer,
      'image/jpeg',
      {
        tenantId,
        propertyId,
        cleaningId,
        phase,
        checksum: downloadResult.checksum,
        width: processedImage.width,
        height: processedImage.height,
        originalSize: downloadResult.size,
        processedSize: processedImage.mainBuffer.length
      }
    );

    const thumbResult = await saveToStorage(
      'media',
      thumbPath,
      processedImage.thumbBuffer,
      'image/jpeg',
      {
        tenantId,
        propertyId,
        cleaningId,
        phase,
        checksum: downloadResult.checksum,
        width: 480, // Thumbnail width
        height: Math.round(480 * processedImage.height / processedImage.width),
        originalSize: downloadResult.size,
        processedSize: processedImage.thumbBuffer.length
      }
    );

    // 8. Save event to database
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        tenant_id: tenantId,
        property_id: propertyId,
        cleaning_id: cleaningId,
        type: 'photo',
        start: timestamp.toISOString(),
        note: `Foto: ${phase} phase`,
        photo: mainResult.path,
        storage_path_main: mainResult.path,
        storage_path_thumb: thumbResult.path,
        phase,
        media_checksum: downloadResult.checksum,
        width: processedImage.width,
        height: processedImage.height,
        message_id: messageId
      })
      .select('id')
      .single();

    if (eventError) {
      console.error('Error saving photo event:', eventError);
      return NextResponse.json(
        { error: 'Failed to save photo event' },
        { status: 500 }
      );
    }

    // 9. Log processing metadata
    const duration = Date.now() - startTime;
    console.log('Media processed:', {
      messageId,
      phase,
      duration: `${duration}ms`,
      size: `${downloadResult.size} → ${processedImage.mainBuffer.length} bytes`,
      eventId: event.id
    });

    return NextResponse.json({
      ok: true,
      eventId: event.id,
      phase,
      storagePath: mainResult.path
    });

  } catch (error) {
    console.error('Media ingest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




