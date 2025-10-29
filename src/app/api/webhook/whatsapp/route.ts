import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
import { isCleanStayEnabled, getWABAConfig } from '@/lib/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';



// WhatsApp webhook verification and message processing
export async function GET(request: NextRequest) {
  if (!isCleanStayEnabled()) {
    return NextResponse.json(
      { error: 'CleanStay feature is disabled' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Webhook verification
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  if (!isCleanStayEnabled()) {
    return NextResponse.json(
      { error: 'CleanStay feature is disabled' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    
    // Verify webhook signature for security
    const signature = request.headers.get('x-hub-signature-256');
    if (!verifySignature(body, signature)) {
      console.warn('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Process WhatsApp messages
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            await processMessages(change.value);
          }
        }
      }
    }

    return new NextResponse(null, { status: 204 });
    
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Process incoming WhatsApp messages
async function processMessages(value: any) {
  const supabase = getSupabaseServerClient();
  
  for (const message of value.messages || []) {
    const messageId = message.id;
    
    // Check for idempotence using message_id
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .eq('id', messageId)
      .single();
    
    if (existing) {
      console.log('Message already processed:', messageId);
      continue;
    }

    // Extract message data safely
    const messageData = {
      id: messageId,
      from_phone: message.from,
      to_phone: message.to,
      direction: 'in' as const,
      timestamp: new Date(message.timestamp * 1000).toISOString(),
      type: message.type,
      payload_json: message,
      tenant_id: null, // TODO: Implement tenant detection
      status: 'received' as const
    };

    // Store raw message with idempotence
    const { error: storeError } = await supabase
      .from('messages')
      .insert(messageData);

    if (storeError) {
      console.error('Failed to store message:', storeError);
      continue;
    }

    // Update status to stored
    await supabase
      .from('messages')
      .update({ status: 'stored' })
      .eq('id', messageId);

    // Log safe metadata (no tokens, no sensitive content)
    console.log('Message stored:', {
      id: messageId,
      from: message.from,
      type: message.type,
      timestamp: messageData.timestamp
    });

    // Handle media messages - delegate to media worker
    if (message.type === 'image' || message.type === 'document') {
      await handleMediaMessage(messageId, message);
    }
  }
}

// Verify webhook signature for security
function verifySignature(body: any, signature: string | null): boolean {
  if (!signature) {
    return false;
  }

  const wabaConfig = getWABAConfig();
  if (!wabaConfig?.apiKey) {
    console.warn('WABA API key not configured');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', wabaConfig.apiKey)
      .update(JSON.stringify(body))
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Handle media messages - delegate to media worker
async function handleMediaMessage(messageId: string, message: any) {
  console.log('Media message detected:', {
    id: messageId,
    type: message.type,
    mediaId: message.image?.id || message.document?.id
  });

  try {
    // Extract tenant ID from message (this should be set by the webhook processing)
    const tenantId = message.tenant_id;
    const fromPhone = message.from;

    if (!tenantId || !fromPhone) {
      console.warn('Missing tenant_id or from_phone for media message');
      return;
    }

    // Call media worker endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/media/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messageId,
        from_phone: fromPhone,
        tenantId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Media worker failed:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('Media processed successfully:', {
      eventId: result.eventId,
      phase: result.phase,
      storagePath: result.storagePath
    });

  } catch (error) {
    console.error('Error processing media message:', error);
    // Don't throw - we don't want to fail the webhook for media processing errors
  }
}
