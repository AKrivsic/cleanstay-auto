type AlertArgs = {
  conversationId: string;
  preview: string;
  originUrl?: string | null;
};

export async function sendAdminWhatsappAlert({ conversationId, preview, originUrl }: AlertArgs): Promise<void> {
  try {
    if (process.env.WHATSAPP_ALERTS_ENABLED === 'false') return;

    const adminNumbers = (process.env.ADMIN_WHATSAPP_NUMBER || '').split(',').map(s => s.trim()).filter(Boolean);
    if (adminNumbers.length === 0) return;

    const baseUrl = process.env.ADMIN_DASHBOARD_BASE_URL || '';
    const deeplink = `${baseUrl}/admin/zpravy/${conversationId}`;
    const trimmedPreview = (preview || '').slice(0, 80);

    const template = process.env.WHATSAPP_TEMPLATE_NEWMSG || 'Nova zprava na webu: {{1}} Otevrit: {{2}}';
    const text = template
      .replace('{{1}}', trimmedPreview)
      .replace('{{2}}', deeplink);

    // Reuse existing sender via 360dialog endpoint if available
    const wabaBaseUrl = process.env.WABA_BASE_URL || 'https://waba.360dialog.io';
    const wabaApiKey = process.env.WABA_API_KEY;
    if (!wabaApiKey) {
      console.warn('WhatsApp alert skipped: WABA_API_KEY missing');
      return;
    }

    await Promise.all(
      adminNumbers.map(async (to) => {
        const payload = {
          to,
          type: 'text',
          text: { body: text }
        };

        const res = await fetch(`${wabaBaseUrl}/v1/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${wabaApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error('WhatsApp alert send error:', res.status, errText);
        }
      })
    );
  } catch (err) {
    console.error('sendAdminWhatsappAlert error', err);
  }
}


