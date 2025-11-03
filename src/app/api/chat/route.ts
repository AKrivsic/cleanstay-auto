import { NextRequest } from 'next/server';
import { normalizeText, detectIntent } from '@/config/chatbot.config';
import { CLEANSTAY_SYSTEM_PROMPT_CZ } from '@/system-prompts/cleanstay.cz';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseSSRClient } from '@/lib/supabase/ssr';
import { getOpenAIConfig, getDefaultTenantId } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ChatInput = {
  sessionId: string;
  text: string;
  metadata?: { originUrl?: string; locale?: string };
};

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  try {
    const body = (await req.json()) as ChatInput;
    const { sessionId, text, metadata } = body || {};
    if (!sessionId || !text) {
      return new Response(JSON.stringify({ error: 'Missing sessionId or text' }), { status: 400 });
    }

    const normalized = normalizeText(text);
    const { intent, confidence } = detectIntent(normalized);

    // For website chat: ALWAYS use DEFAULT_TENANT_ID so admin sees all web messages in one place
    // (Web chat is public-facing, admin needs to see all inquiries regardless of who wrote them)
    const tenantId = getDefaultTenantId();
    
    if (!tenantId) {
      console.error('DEFAULT_TENANT_ID is not set! Cannot save messages.');
      return new Response(JSON.stringify({ error: 'Server configuration error: tenant_id missing' }), { status: 500 });
    }

    // Persist user message (unread=true)
    const supabase = getSupabaseServerClient();
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('session_id', sessionId)
      .limit(1)
      .maybeSingle();

    let conversationId = conv?.id as string | undefined;
    if (!conversationId) {
      const { data: created } = await supabase
        .from('conversations')
        .insert({ tenant_id: tenantId, session_id: sessionId, locale: metadata?.locale || 'cs', source_url: metadata?.originUrl || null })
        .select('id')
        .single();
      conversationId = created?.id as string;
    }

    // Insert current user message first
    // Note: from_number and to_number are required by existing schema (WhatsApp-focused)
    // For web chat, use placeholder values
    const { data: insertedMsg, error: insertError } = await supabase
      .from('messages')
      .insert({
        tenant_id: tenantId,
        conversation_id: conversationId,
        role: 'user',
        source: 'web',
        text,
        intent,
        confidence,
        unread: true,
        session_id: sessionId,
        origin_url: metadata?.originUrl || null,
        from_number: 'web-chat', // Placeholder for web chat (required field)
        to_number: 'web-chat', // Placeholder for web chat (required field)
        message_type: 'text', // Required field
        raw_data: { source: 'web', session_id: sessionId } // Required field (JSONB)
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ Failed to insert user message:', {
        error: insertError,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        tenantId,
        conversationId,
        sessionId,
        text: text.substring(0, 50) + '...'
      });
      // Continue anyway - don't break the chat flow, but log the error
    } else {
      console.log('✅ User message saved:', { id: insertedMsg?.id, conversationId, tenantId });
    }

    // Load history AFTER inserting current message (so it's included)
    const historyMessages: Array<{ role: 'user'|'assistant'; content: string }> = [];
    if (conversationId) {
      const { data: history, error: historyError } = await supabase
        .from('messages')
        .select('role, text')
        .eq('conversation_id', conversationId)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: true })
        .limit(20);
      if (historyError) {
        console.error('Failed to load history:', historyError);
      } else {
        for (const m of (history || [])) {
          if (m.text && (m.role === 'user' || m.role === 'assistant')) {
            historyMessages.push({ role: m.role, content: m.text });
          }
        }
      }
    }

    // Stream AI response
    const openaiCfg = getOpenAIConfig();
    if (!openaiCfg) {
      return new Response(JSON.stringify({ error: 'OpenAI config missing' }), { status: 500 });
    }

    // Build localized, on-brand system prompt to avoid generic tone
    const systemPrompt = CLEANSTAY_SYSTEM_PROMPT_CZ;

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        // Start streaming
        try {
          const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiCfg.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              stream: true,
              messages: [
                { role: 'system', content: systemPrompt },
                // Provide tiny intent hint to steer style/content
                { role: 'system', content: `Zjištěný záměr: ${intent}. Pokud "price" → sděl krátké rozpětí a co ovlivňuje cenu. Pokud "service" → stručně popiš relevantní službu. Pokud "contact"/"booking" → nabídni zanechání kontaktu.` },
                ...historyMessages,
                { role: 'user', content: text }
              ]
            })
          });

          if (!resp.ok || !resp.body) {
            throw new Error('OpenAI response error');
          }

          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let assistantText = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // Pass-through raw SSE bytes from OpenAI to the client without re-wrapping
            controller.enqueue(value);

            // Also parse for persistence
            const chunkText = decoder.decode(value);
            const normalized = chunkText.replace(/}data:/g, '}\n\ndata: ');
            const lines = normalized.split('\n');
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();
              if (!payload || payload === '[DONE]') continue;
              try {
                const obj = JSON.parse(payload);
                const piece = obj?.choices?.[0]?.delta?.content || '';
                if (piece) assistantText += piece;
              } catch {
                // ignore non-JSON control lines
              }
            }
          }

          // Persist assistant message (mark unread stays true for user message only)
          const { error: assistantError } = await supabase.from('messages').insert({
            tenant_id: tenantId,
            conversation_id: conversationId,
            role: 'assistant',
            source: 'web',
            text: assistantText,
            intent: null,
            confidence: null,
            unread: false,
            session_id: sessionId,
            origin_url: metadata?.originUrl || null,
            from_number: 'web-chat-assistant', // Placeholder for web chat assistant
            to_number: 'web-chat', // Placeholder for web chat
            message_type: 'text', // Required field
            raw_data: { source: 'web', role: 'assistant', session_id: sessionId } // Required field (JSONB)
          });
          if (assistantError) {
            console.error('❌ Failed to insert assistant message:', assistantError);
          } else {
            console.log('✅ Assistant message saved:', { conversationId, length: assistantText.length });
          }
          controller.close();
        } catch (e) {
          console.error('❌ Stream error:', e);
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });
  }
}


