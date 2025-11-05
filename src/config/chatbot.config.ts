export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

export function detectIntent(text: string): { intent: string; confidence: number } {
  const normalized = normalizeText(text);
  
  const intents = {
    price: ['cena', 'kolik', 'stojí', 'zaplatím', 'náklady', 'ceník'],
    service: ['úklid', 'služba', 'co nabízíte', 'druh', 'typ'],
    contact: ['kontakt', 'zavolejte', 'zavolat', 'volejte', 'zavolám', 'kontaktovat'],
    booking: ['objednat', 'rezervovat', 'domluvit', 'sjednat', 'poptávka']
  };

  let bestIntent = 'general';
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(intents)) {
    const score = keywords.reduce((acc, keyword) => {
      return acc + (normalized.includes(keyword) ? 1 : 0);
    }, 0);
    
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return {
    intent: bestScore > 0 ? bestIntent : 'general',
    confidence: bestScore > 0 ? Math.min(bestScore / 3, 1) : 0.1
  };
}

export const GDPR_SENTENCE = 'Souhlasím se zpracováním osobních údajů';
