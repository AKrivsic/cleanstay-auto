import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseSSRClient } from '@/lib/supabase/ssr';
import { getDefaultTenantId } from '@/lib/env';
import { sendAdminWhatsappAlert } from '@/server/notifications/whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type LeadInput = {
  sessionId: string;
  conversationId?: string;
  name?: string;
  email?: string;
  phone?: string;
  consent: boolean;
  serviceType?: string;
  city?: string;
  sizeM2?: number;
  cadence?: string;
  rushFlag?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LeadInput;
    if (!body?.sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    if (!body?.consent) return NextResponse.json({ error: 'GDPR consent required' }, { status: 400 });
    if (!body.email && !body.phone) return NextResponse.json({ error: 'email or phone required' }, { status: 400 });

    // For website chat leads: ALWAYS use DEFAULT_TENANT_ID so admin sees all web leads in one place
    const tenantId = getDefaultTenantId();

    const supabase = getSupabaseServerClient();

    let conversationId = body.conversationId || null;
    if (!conversationId) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('session_id', body.sessionId)
        .limit(1)
        .maybeSingle();
      conversationId = conv?.id || null;
    }

    const { data: lead } = await supabase
      .from('leads')
      .insert({
        tenant_id: tenantId,
        conversation_id: conversationId,
        name: body.name || null,
        email: body.email || null,
        phone: body.phone || null,
        service_type: body.serviceType || null,
        city: body.city || null,
        size_m2: body.sizeM2 || null,
        cadence: body.cadence || null,
        rush: !!body.rushFlag,
        consent: !!body.consent
      })
      .select('id')
      .single();

    // Notify admin via WhatsApp (fail-safe)
    const preview = `${body.name || ''} ${body.email || ''} ${body.phone || ''}`.trim();
    await sendAdminWhatsappAlert({ conversationId: conversationId || lead?.id, preview, originUrl: null });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}


