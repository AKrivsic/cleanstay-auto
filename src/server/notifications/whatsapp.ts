import { getDefaultTenantId } from '@/lib/env';

type AlertParams = {
  conversationId?: string | null;
  preview: string;
  originUrl?: string | null;
};

export async function sendAdminWhatsappAlert({ conversationId, preview, originUrl }: AlertParams): Promise<void> {
  try {
    const tenantId = getDefaultTenantId();
    if (!tenantId) {
      console.warn('DEFAULT_TENANT_ID not set, skipping WhatsApp alert');
      return;
    }

    // TODO: Implement actual WhatsApp notification
    // For now, just log the alert
    console.log('📱 WhatsApp alert would be sent:', {
      tenantId,
      conversationId,
      preview: preview.substring(0, 100),
      originUrl
    });
  } catch (error) {
    console.error('Failed to send WhatsApp alert:', error);
    // Don't throw - this is a fail-safe notification
  }
}
