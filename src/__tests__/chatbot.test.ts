import { describe, it, expect, vi } from 'vitest';
import { normalizeText, detectIntent } from '@/config/chatbot.config';
import * as whatsapp from '@/server/notifications/whatsapp';

describe('normalizeText', () => {
  it('strips diacritics and lowercases', () => {
    expect(normalizeText('Částka Ceník')).toBe('castka cenik');
  });
});

describe('detectIntent', () => {
  it('detects price keywords', () => {
    const { intent } = detectIntent(normalizeText('Kolik to stojí? Máte ceník?'));
    expect(intent).toBe('price');
  });
  it('detects booking/contact keywords', () => {
    const { intent } = detectIntent(normalizeText('Objednat úklid, prosím'));
    expect(intent === 'booking' || intent === 'contact').toBe(true);
  });
});

describe('sendAdminWhatsappAlert', () => {
  it('does not throw when env missing', async () => {
    const spy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({ ok: true, json: async () => ({}) } as any);
    await whatsapp.sendAdminWhatsappAlert({ conversationId: 'x', preview: 'test', originUrl: '' });
    spy.mockRestore();
    expect(true).toBe(true);
  });
});


