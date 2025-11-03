export const CHATBOT_COMPANY = {
  city: 'Praha',
  availability: 'nonstop',
  expressAvailable: true,
  callbackSlaMinutes: 30
} as const;

export const CHATBOT_NOTIFICATIONS = {
  adminNumbers: ['+420776292312'],
  triggerOnLeadOnly: true
} as const;

export const CHATBOT_COLORS = {
  primary: '#34D399',
  secondary: '#8B5CF6',
  background: '#f9fafb',
  white: '#ffffff',
  text: '#111827',
  textMuted: '#4B5563',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444'
} as const;

export const CHATBOT_SERVICES = [
  'Domácnosti – základní úklid',
  'Domácnosti – generální úklid',
  'Úklid po rekonstrukci',
  'Expresní úklid (Praha)',
  'Airbnb správa a úklid (praní 60 Kč/kg)',
  'Firmy / Kanceláře',
  'SVJ – společné prostory',
  'Mytí oken',
  'Čištění spotřebičů (trouba, lednice, digestoř)',
  'Doplňkové práce'
] as const;

export const CHATBOT_PRICE_BRACKETS = [
  'Menší byt (1+kk–2+kk): od 890–1 290 Kč',
  'Střední byt (3+kk–4+kk): od 1 390–1 990 Kč',
  'Větší byt / dům (5+kk+): od 2 490 Kč',
  'Generální úklid: +30–60 % vs. základ',
  'Po rekonstrukci: +50–100 % dle znečištění',
  'Mytí oken: 30–60 Kč/m²',
  'Čištění spotřebičů: 250–450 Kč/kus',
  'Praní prádla: 60 Kč/kg',
  'Expresní příplatek: +20–40 %'
] as const;

export const CHATBOT_FAQ = [
  'Jak rychle můžete přijet? — V Praze expresně obvykle do 3 h dle kapacit.',
  'Kolik stojí úklid domácnosti? — Orientačně od 890–1290 Kč (menší byt).',
  'Co je v základním úklidu? — Prach, vysávání, vytírání, kuchyňské plochy, koupelna/WC, koš. Doplňky na přání.',
  'Máte vlastní prostředky? — Ano, můžeme přivézt vlastní vybavení i chemii.',
  'Pravidelný úklid? — Výhodnější než jednorázový.',
  'Po rekonstrukci / generální? — Ano, děláme i tyto typy.',
  'Mytí oken / spotřebičů? — Ano, dle domluvy.',
  'Airbnb správa? — Turnover vč. praní (60 Kč/kg), doplňování, fotodokumentace.',
  'Fakturace pro firmy/SVJ? — Samozřejmostí.',
  'Záruka spokojenosti? — Když něco nesedí, napravíme co nejdřív.',
  'Musím být doma? Klíče? — Nemusíte; bezpečné předání domluvíme.',
  'Storno? — Bezplatně do 24 h předem, jinak může být poplatek.'
] as const;

export const GDPR_SENTENCE = 'Souhlasím se zpracováním osobních údajů za účelem vypracování nabídky a kontaktování ohledně služby CleanStay.';

// New constants per behavior spec (backward-compatible additions)
export const COMPANY = { city: 'Praha', slaMinutes: 30, nonstop: true, express: true } as const;

export const PRICES = {
  domestic_small: [890, 1290] as const,
  domestic_medium: [1390, 1990] as const,
  domestic_large_from: 2490,
  airbnb_small: [600, 950] as const,
  laundry_per_kg: 60,
  windows_per_m2: [30, 60] as const,
  appliance_per_unit: [250, 450] as const,
  general_multiplier: [1.3, 1.6] as const,
  postreno_multiplier: [1.5, 2.0] as const,
  express_multiplier: [1.2, 1.4] as const,
  office_per_m2_from: 25,
} as const;

export const NOTIFICATIONS = {
  whatsappOn: 'contact_submit' as const,
  adminNumbers: [process.env.ADMIN_WHATSAPP_NUMBER || '+420776292312'],
  adminDashboardBaseUrl: process.env.ADMIN_DASHBOARD_BASE_URL || 'https://app.cleanstay.cz',
  deeplinkPattern: '/admin/zpravy/{conversationId}',
  templateName: process.env.WHATSAPP_TEMPLATE_NEWMSG || 'Nova zprava na webu: {{1}} Otevrit: {{2}}',
} as const;

export const ADMIN_DEEPLINK_BASE_ENV = 'ADMIN_DASHBOARD_BASE_URL';

export const CHATBOT_CHIPS = [
  'Domácnost',
  'Airbnb',
  'Firma/SVJ',
  'Expres dnes?',
  'Ceník',
  'Kontakt'
] as const;

export type ChatbotIntent = 'price' | 'service' | 'contact' | 'booking' | 'complaint' | 'other';

export function normalizeText(input: string): string {
  const stripped = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  return stripped;
}

export function detectIntent(normalized: string): { intent: ChatbotIntent; confidence: number } {
  const buckets: Array<{ intent: ChatbotIntent; re: RegExp }> = [
    { intent: 'price', re: /(cena|cenik|kolik|naceni)/ },
    { intent: 'service', re: /(domacnost|airbnb|firma|svj|rekonstrukce|generalni|pradelna|prani|expres)/ },
    { intent: 'contact', re: /(kontakt)/ },
    { intent: 'booking', re: /(rezervace|poptavka|objednat|zavolejte)/ },
    { intent: 'complaint', re: /(stiznost|reklamace)/ }
  ];

  for (const b of buckets) {
    if (b.re.test(normalized)) return { intent: b.intent, confidence: 0.8 };
  }
  return { intent: 'other', confidence: 0.4 };
}


