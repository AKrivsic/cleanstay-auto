import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
import { createSupabaseClient } from '@/lib/supabase/client';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// POST /api/admin/notify/whatsapp
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { to, template, language, variables } = body;

    if (!to || !template || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: to, template, language' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const rateLimitKey = `whatsapp:${to}`;
    const now = Date.now();
    const rateLimit = rateLimitStore.get(rateLimitKey);
    
    if (rateLimit && now < rateLimit.resetTime) {
      if (rateLimit.count >= 1) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Max 1 message per 30 seconds per recipient.' },
          { status: 429 }
        );
      }
    } else {
      rateLimitStore.set(rateLimitKey, { count: 0, resetTime: now + 30000 }); // 30 seconds
    }

    // Increment rate limit counter
    const currentLimit = rateLimitStore.get(rateLimitKey)!;
    currentLimit.count++;
    rateLimitStore.set(rateLimitKey, currentLimit);

    // Get template configuration
    const templateConfig = getTemplateConfig(template, language);
    if (!templateConfig) {
      return NextResponse.json(
        { error: `Template ${template}_${language} not found` },
        { status: 404 }
      );
    }

    // Send message via 360dialog
    const wabaResponse = await sendWhatsAppMessage(to, templateConfig as any, variables);
    
    if (!wabaResponse.success) {
      return NextResponse.json(
        { error: wabaResponse.error },
        { status: 500 }
      );
    }

    const latency = Date.now() - startTime;

    // Log successful notification
    console.log('WhatsApp notification sent:', {
      to: to.substring(0, 3) + '***',
      template,
      language,
      messageId: wabaResponse.messageId,
      latency: `${latency}ms`
    });

    return NextResponse.json({
      success: true,
      data: {
        messageId: wabaResponse.messageId,
        template,
        language,
        to: to.substring(0, 3) + '***',
        latency: `${latency}ms`
      }
    });

  } catch (error) {
    console.error('Error in notify/whatsapp POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get template configuration
function getTemplateConfig(template: string, language: string) {
  const templates = {
    'cleaning_reminder_cs': {
      name: 'cleaning_reminder_cs',
      language: 'cs',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Připomínka úklidu'
        },
        {
          type: 'BODY',
          text: 'Dobrý den! Připomínáme Vám úklid v objektu {property_name} zítra {date} v {start_time}. Prosím potvrďte účast odpovědí ANO nebo NE. Děkujeme!'
        },
        {
          type: 'FOOTER',
          text: 'CleanStay'
        }
      ]
    },
    'cleaner_checklist_cs': {
      name: 'cleaner_checklist_cs',
      language: 'cs',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Úklid zahájen'
        },
        {
          type: 'BODY',
          text: 'Úklid v {property_name} byl zahájen. Checklist: {checklist_short}. Nezapomeňte pořídit fotografie před a po úklidu. Hodně štěstí!'
        },
        {
          type: 'FOOTER',
          text: 'CleanStay'
        }
      ]
    },
    'post_cleaning_summary_cs': {
      name: 'post_cleaning_summary_cs',
      language: 'cs',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Úklid dokončen'
        },
        {
          type: 'BODY',
          text: 'Úklid v {property_name} byl úspěšně dokončen za {duration}. Spotřebované zásoby: {supplies_short}. Fotografie najdete v galerii.'
        },
        {
          type: 'FOOTER',
          text: 'CleanStay'
        }
      ]
    }
  };

  return templates[`${template}_${language}` as keyof typeof templates];
}

// Send WhatsApp message via 360dialog
async function sendWhatsAppMessage(
  to: string,
  template: {
    name: string;
    language: {
      code: string;
    };
    components: Array<{
      type: string;
      text?: string;
      parameters?: Array<{
        type: string;
        text: string;
      }>;
    }>;
  },
  variables: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const wabaApiKey = process.env.WABA_API_KEY;
    const wabaBaseUrl = process.env.WABA_BASE_URL || 'https://waba.360dialog.io';

    if (!wabaApiKey) {
      throw new Error('WABA_API_KEY not configured');
    }

    // Prepare message payload
    const messagePayload = {
      to: to,
      type: 'template',
      template: {
        name: template.name,
        language: {
          code: template.language
        },
        components: template.components.map((component: {
          type: string;
          text?: string;
          parameters?: Array<{
            type: string;
            text: string;
          }>;
        }) => {
          if (component.type === 'BODY') {
            return {
              ...component,
              text: replaceVariables(component.text || '', variables)
            };
          }
          return component;
        })
      }
    };

    // Send to 360dialog
    const response = await fetch(`${wabaBaseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${wabaApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`360dialog API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      messageId: result.messages?.[0]?.id
    };

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Replace variables in text
function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
}




