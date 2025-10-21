import { NextRequest, NextResponse } from 'next/server';
import { isCleanStayEnabled } from '@/lib/env';
import { parseMessage } from '@/lib/ai/parseMessage';
import { getSupabaseServerClient } from '@/lib/supabase/server';

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
    
    // TODO: Verify webhook signature for security
    // const signature = request.headers.get('x-hub-signature-256');
    // if (!verifySignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    // }

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

    return NextResponse.json({ status: 'ok' });
    
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
    
    // TODO: Check for idempotence using message_id
    // const { data: existing } = await supabase
    //   .from('messages')
    //   .select('id')
    //   .eq('whatsapp_message_id', messageId)
    //   .single();
    
    // if (existing) {
    //   console.log('Message already processed:', messageId);
    //   continue;
    // }

    // Store raw message
    const { error: storeError } = await supabase
      .from('messages')
      .insert({
        whatsapp_message_id: messageId,
        from_number: message.from,
        to_number: message.to,
        message_type: message.type,
        raw_data: message,
        created_at: new Date().toISOString(),
      });

    if (storeError) {
      console.error('Failed to store message:', storeError);
      continue;
    }

    // Process text messages with AI
    if (message.type === 'text' && message.text?.body) {
      try {
        const parsed = await parseMessage(message.text.body, 'cs'); // Default to Czech
        
        // Store parsed result
        await supabase
          .from('message_parsing_results')
          .insert({
            message_id: messageId,
            parsed_data: parsed,
            confidence: parsed.confidence,
            created_at: new Date().toISOString(),
          });

        // TODO: Trigger realtime updates or notifications based on parsed type
        console.log('Message parsed:', parsed);
        
      } catch (error) {
        console.error('AI parsing failed for message:', messageId, error);
      }
    }
  }
}

// TODO: Implement webhook signature verification
function verifySignature(body: any, signature: string | null): boolean {
  // Implementation needed for production security
  return true;
}
