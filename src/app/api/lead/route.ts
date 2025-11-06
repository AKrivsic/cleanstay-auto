import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseSSRClient } from '@/lib/supabase/ssr';
import { getDefaultTenantId } from '@/lib/env';
import { sendAdminWhatsappAlert } from '@/server/notifications/whatsapp';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

    // Get conversation messages for email
    let conversationMessages: any[] = [];
    if (conversationId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      conversationMessages = messages || [];
    }

    // Send email notification with conversation
    if (resend) {
      try {
        // Format conversation for email
        const conversationHTML = conversationMessages.length > 0
          ? conversationMessages.map(msg => {
              const time = new Date(msg.created_at).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
              const isUser = msg.role === 'user';
              return `
                <div style="margin: 12px 0; padding: 10px; background: ${isUser ? '#F3F4F6' : '#F0E7FF'}; border-radius: 8px; border-left: 4px solid ${isUser ? '#9CA3AF' : '#8B5CF6'};">
                  <div style="font-size: 11px; color: #6B7280; margin-bottom: 4px;">
                    <strong>${isUser ? '👤 Zákazník' : '🤖 Asistent'}</strong> • ${time}
                  </div>
                  <div style="font-size: 14px; color: #1F2937; white-space: pre-wrap;">${msg.content}</div>
                </div>
              `;
            }).join('')
          : '<p style="color: #6B7280; font-style: italic;">Žádné zprávy v konverzaci</p>';

        await resend.emails.send({
          from: 'CleanStay Lead <kontakt@cleanstay.cz>',
          to: ['info@cleanstay.cz'],
          subject: `🎯 Nový lead z chatu: ${body.name || body.phone || body.email}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #FFFFFF;">
              <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">🎯 Nový lead z chatbotu</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.9;">Zákazník vyplnil kontaktní formulář</p>
              </div>
              
              <div style="padding: 24px; background: #F9FAFB; border: 1px solid #E5E7EB; border-top: none;">
                <h2 style="color: #1F2937; font-size: 18px; margin: 0 0 16px 0;">📋 Kontaktní údaje</h2>
                
                <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                  ${body.name ? `<p style="margin: 8px 0;"><strong>Jméno:</strong> ${body.name}</p>` : ''}
                  ${body.phone ? `<p style="margin: 8px 0;"><strong>📞 Telefon:</strong> <a href="tel:${body.phone}" style="color: #8B5CF6;">${body.phone}</a></p>` : ''}
                  ${body.email ? `<p style="margin: 8px 0;"><strong>✉️ Email:</strong> <a href="mailto:${body.email}" style="color: #8B5CF6;">${body.email}</a></p>` : ''}
                  ${body.serviceType ? `<p style="margin: 8px 0;"><strong>Služba:</strong> ${body.serviceType}</p>` : ''}
                  ${body.city ? `<p style="margin: 8px 0;"><strong>Město:</strong> ${body.city}</p>` : ''}
                  ${body.sizeM2 ? `<p style="margin: 8px 0;"><strong>Velikost:</strong> ${body.sizeM2} m²</p>` : ''}
                  ${body.cadence ? `<p style="margin: 8px 0;"><strong>Frekvence:</strong> ${body.cadence}</p>` : ''}
                  ${body.rushFlag ? `<p style="margin: 8px 0;"><strong>⚡ Urgent:</strong> <span style="color: #DC2626; font-weight: bold;">ANO</span></p>` : ''}
                  <p style="margin: 8px 0; font-size: 12px; color: #6B7280;"><strong>Čas:</strong> ${new Date().toLocaleString('cs-CZ')}</p>
                </div>

                ${conversationMessages.length > 0 ? `
                  <h2 style="color: #1F2937; font-size: 18px; margin: 24px 0 12px 0;">💬 Průběh konverzace</h2>
                  <div style="background: white; padding: 16px; border-radius: 8px;">
                    ${conversationHTML}
                  </div>
                ` : ''}

                <div style="margin-top: 24px; padding: 16px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #92400E;">
                    <strong>⏰ Akce:</strong> Kontaktujte zákazníka co nejdříve!
                  </p>
                </div>
              </div>

              <div style="padding: 16px 24px; background: #F3F4F6; border-radius: 0 0 8px 8px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #6B7280;">
                  Lead ID: ${lead?.id || 'N/A'} | CleanStay Admin Dashboard
                </p>
              </div>
            </div>
          `,
          text: `
NOVÝ LEAD Z CHATBOTU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KONTAKTNÍ ÚDAJE:
${body.name ? `Jméno: ${body.name}` : ''}
${body.phone ? `Telefon: ${body.phone}` : ''}
${body.email ? `Email: ${body.email}` : ''}
${body.serviceType ? `Služba: ${body.serviceType}` : ''}
${body.city ? `Město: ${body.city}` : ''}
${body.sizeM2 ? `Velikost: ${body.sizeM2} m²` : ''}
${body.cadence ? `Frekvence: ${body.cadence}` : ''}
${body.rushFlag ? `⚡ URGENT: ANO` : ''}
Čas: ${new Date().toLocaleString('cs-CZ')}

${conversationMessages.length > 0 ? `
PRŮBĚH KONVERZACE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${conversationMessages.map(msg => {
  const time = new Date(msg.created_at).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  const sender = msg.role === 'user' ? 'Zákazník' : 'Asistent';
  return `[${time}] ${sender}:\n${msg.content}\n`;
}).join('\n')}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lead ID: ${lead?.id || 'N/A'}
Kontaktujte zákazníka co nejdříve!
          `
        });

        console.log('✅ Lead email sent to info@cleanstay.cz', {
          leadId: lead?.id,
          name: body.name,
          hasConversation: conversationMessages.length > 0
        });

      } catch (emailError) {
        console.error('⚠️ Failed to send lead email (lead saved):', emailError);
      }
    } else {
      console.warn('⚠️ Resend not configured. Lead email not sent.');
    }

    // Notify admin via WhatsApp (fail-safe, if configured)
    const preview = `${body.name || ''} ${body.email || ''} ${body.phone || ''}`.trim();
    await sendAdminWhatsappAlert({ conversationId: conversationId || lead?.id, preview, originUrl: null });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}


