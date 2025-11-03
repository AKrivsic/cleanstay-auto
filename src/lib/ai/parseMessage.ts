import OpenAI from 'openai';
import { z } from 'zod';
import { getOpenAIConfig } from '../env';

// Parsed message types
export type ParsedMessageType = 
  | 'start_cleaning'
  | 'supply_out'
  | 'linen_used'
  | 'note'
  | 'photo_meta'
  | 'done';

// Zod schema for parsed message validation
export const ParsedMessageSchema = z.object({
  type: z.enum(['start_cleaning', 'supply_out', 'linen_used', 'note', 'photo_meta', 'done']),
  property_hint: z.string().optional(),
  payload: z.record(z.any()).optional(),
  language: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export type ParsedMessage = z.infer<typeof ParsedMessageSchema>;

// Union type for return value
export type Parsed = ParsedMessage | { ask: string };

// OpenAI client initialization
const getOpenAIClient = () => {
  const config = getOpenAIConfig();
  
  if (!config) {
    return null;
  }
  
  return new OpenAI({
    apiKey: config.apiKey,
  });
};

// Language detection (heuristic)
export const detectLanguage = (text: string): string => {
  const czechWords = ['úklid', 'začínám', 'hotovo', 'došel', 'postel', 'byt', 'bytu', 'dokončeno'];
  const ukrainianWords = ['прибирання', 'починаю', 'готово', 'закінчив', 'ліжко', 'квартира', 'завершено'];
  const englishWords = ['cleaning', 'starting', 'done', 'finished', 'bed', 'apartment', 'completed'];
  const russianWords = ['уборка', 'начинаю', 'готово', 'закончил', 'кровать', 'квартира', 'завершено'];
  const germanWords = ['reinigung', 'beginne', 'fertig', 'beendet', 'bett', 'wohnung', 'abgeschlossen'];
  
  const lowerText = text.toLowerCase();
  
  const czechCount = czechWords.filter(word => lowerText.includes(word)).length;
  const ukrainianCount = ukrainianWords.filter(word => lowerText.includes(word)).length;
  const englishCount = englishWords.filter(word => lowerText.includes(word)).length;
  const russianCount = russianWords.filter(word => lowerText.includes(word)).length;
  const germanCount = germanWords.filter(word => lowerText.includes(word)).length;
  
  const counts = [
    { lang: 'cs', count: czechCount },
    { lang: 'uk', count: ukrainianCount },
    { lang: 'en', count: englishCount },
    { lang: 'ru', count: russianCount },
    { lang: 'de', count: germanCount }
  ];
  
  // Find language with highest count
  const maxCount = Math.max(...counts.map(c => c.count));
  const detectedLang = counts.find(c => c.count === maxCount)?.lang;
  
  // Return detected language or default to Czech
  return detectedLang || 'cs';
};

// AI prompt for message parsing with examples
const createPrompt = (text: string, detectedLang: string) => {
  return `You are an AI assistant that parses cleaning service messages from WhatsApp. 
Analyze the following message and extract structured information.

Message: "${text}"
Detected language: ${detectedLang}

Return ONLY valid JSON with this exact structure:
{
  "type": "start_cleaning" | "supply_out" | "linen_used" | "note" | "photo_meta" | "done",
  "property_hint": "optional property identifier like '302', 'Nikolajka', 'byt 302'",
  "payload": { "key": "value" },
  "language": "detected language code",
  "confidence": 0.0-1.0
}

EXAMPLES:

CZECH:
"Začínám úklid bytu 302" → {"type":"start_cleaning","property_hint":"302","language":"cs","confidence":0.95}
"Došel Domestos a Jar" → {"type":"supply_out","payload":{"items":["Domestos","Jar"]},"language":"cs","confidence":0.9}
"6 postelí vyměněno, 8 špinavých" → {"type":"linen_used","payload":{"changed":6,"dirty":8},"language":"cs","confidence":0.9}
"Hotovo" → {"type":"done","language":"cs","confidence":0.95}

UKRAINIAN:
"Починаю прибирання 302" → {"type":"start_cleaning","property_hint":"302","language":"uk","confidence":0.95}
"Закінчив прибирання" → {"type":"done","language":"uk","confidence":0.95}

ENGLISH:
"Starting cleaning apt 302" → {"type":"start_cleaning","property_hint":"302","language":"en","confidence":0.95}
"Finished cleaning" → {"type":"done","language":"en","confidence":0.95}

RUSSIAN:
"Начинаю уборку квартиры 302" → {"type":"start_cleaning","property_hint":"302","language":"ru","confidence":0.95}
"Уборка закончена" → {"type":"done","language":"ru","confidence":0.95}

GERMAN:
"Beginne Reinigung Wohnung 302" → {"type":"start_cleaning","property_hint":"302","language":"de","confidence":0.95}
"Reinigung beendet" → {"type":"done","language":"de","confidence":0.95}

IMPORTANT RULES:
1. Extract NUMBERS carefully - "6 postelí" = {"changed":6}, "8 špinavých" = {"dirty":8}
2. For supply lists, split by common separators (a, a, and, i, та) - "Domestos a Jar" = ["Domestos","Jar"]
3. Property hints can be numbers (302), names (Nikolajka), or combinations (byt 302)
4. If message is unclear or ambiguous, set confidence < 0.6
5. For typos, try to understand intent but lower confidence slightly
6. Short messages like "Hotovo" should have high confidence (0.95+)
7. Complex messages with multiple actions should have lower confidence (0.7-0.8)

Message types:
- start_cleaning: Beginning of cleaning process
- supply_out: Running out of supplies  
- linen_used: Linen/cleaning materials used
- note: General note or update
- photo_meta: Photo with metadata
- done: Cleaning completed

Return ONLY the JSON object, no other text.`;
};

// Main parsing function
export const parseMessage = async (text: string): Promise<Parsed> => {
  const startTime = Date.now();
  const textLength = text.length;
  
  const openai = getOpenAIClient();
  
  if (!openai) {
    // Return asking question when OpenAI is not available
    return { ask: 'Potřebuji více informací. Můžete to zopakovat?' };
  }
  
  try {
    // Detect language first
    const detectedLang = detectLanguage(text);
    const prompt = createPrompt(text, detectedLang);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a cleaning service message parser. Always return valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 300,
    });
    
    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }
    
    // Parse JSON response
    const parsed = JSON.parse(response);
    
    // Validate with Zod schema
    const validated = ParsedMessageSchema.parse(parsed);
    
    // Check confidence threshold - if too low, return ask
    if (validated.confidence < 0.6) {
      const detectedLang = detectLanguage(text);
      const askQuestions = {
        cs: 'Můžete to zopakovat jasněji?',
        uk: 'Можете повторити чіткіше?',
        en: 'Can you repeat that more clearly?',
        ru: 'Можете повторить четче?',
        de: 'Können Sie das klarer wiederholen?'
      };
      
      return { ask: askQuestions[detectedLang as keyof typeof askQuestions] || askQuestions.cs };
    }
    
    // Log safe metadata
    const duration = Date.now() - startTime;
    console.log('AI parsing completed:', {
      textLength,
      duration: `${duration}ms`,
      confidence: validated.confidence,
      type: validated.type
    });
    
    return validated;
    
  } catch (error) {
    console.error('AI parsing failed:', error);
    
    // Return asking question for unclear input
    const detectedLang = detectLanguage(text);
    const askQuestions = {
      cs: 'U kterého bytu jsi?',
      uk: 'В якій квартирі ви?',
      en: 'Which apartment are you in?',
      ru: 'В какой квартире вы?',
      de: 'In welcher Wohnung sind Sie?'
    };
    
    return { ask: askQuestions[detectedLang as keyof typeof askQuestions] || askQuestions.cs };
  }
};

// Helper function to check if message is actionable
export const isActionableMessage = (parsed: ParsedMessage): boolean => {
  return parsed.confidence > 0.7 && 
         ['start_cleaning', 'supply_out', 'done'].includes(parsed.type);
};

// Helper function to extract property information
export const extractPropertyInfo = (parsed: ParsedMessage): string | null => {
  return parsed.property_hint || null;
};

// Helper function to get message priority
export const getMessagePriority = (parsed: ParsedMessage): 'low' | 'medium' | 'high' => {
  if (parsed.type === 'supply_out') return 'high';
  if (parsed.type === 'done') return 'medium';
  if (parsed.type === 'start_cleaning') return 'medium';
  return 'low';
};

// Helper function to convert parsed message to event data
export const toEvent = (parsed: ParsedMessage, context: {
  tenantId: string;
  propertyId?: string;
  userId?: string;
  cleaningId?: string;
}) => {
  const baseEvent = {
    tenant_id: context.tenantId,
    property_id: context.propertyId,
    cleaning_id: context.cleaningId,
    type: parsed.type,
    start: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  switch (parsed.type) {
    case 'start_cleaning':
      return {
        ...baseEvent,
        note: `Začátek úklidu${parsed.property_hint ? ` - ${parsed.property_hint}` : ''}`,
        done: false,
      };
    
    case 'supply_out':
      return {
        ...baseEvent,
        supply_out: parsed.payload,
        note: `Došly zásoby: ${parsed.payload?.items?.join(', ') || 'neznámé'}`,
        done: false,
      };
    
    case 'linen_used':
      return {
        ...baseEvent,
        linen_used: parsed.payload?.changed || 0,
        note: `Ložní prádlo: ${parsed.payload?.changed || 0} vyměněno, ${parsed.payload?.dirty || 0} špinavých`,
        done: false,
      };
    
    case 'done':
      return {
        ...baseEvent,
        note: 'Úklid dokončen',
        done: true,
      };
    
    case 'note':
      return {
        ...baseEvent,
        note: parsed.payload?.text || 'Poznámka',
        done: false,
      };
    
    case 'photo_meta':
      return {
        ...baseEvent,
        photo: parsed.payload?.url || null,
        note: `Foto: ${parsed.payload?.description || 'bez popisu'}`,
        done: false,
      };
    
    default:
      return {
        ...baseEvent,
        note: 'Neznámý typ zprávy',
        done: false,
      };
  }
};

/*
TEST CASES - 20 testovacích vět (CZ/UA/EN) s očekávanými výstupy:

CZECH TESTS:
1. "Začínám úklid bytu 302" 
   → {"type":"start_cleaning","property_hint":"302","language":"cs","confidence":0.95}

2. "Došel Domestos a Jar" 
   → {"type":"supply_out","payload":{"items":["Domestos","Jar"]},"language":"cs","confidence":0.9}

3. "6 postelí vyměněno, 8 špinavých" 
   → {"type":"linen_used","payload":{"changed":6,"dirty":8},"language":"cs","confidence":0.9}

4. "Hotovo" 
   → {"type":"done","language":"cs","confidence":0.95}

5. "Začínám úklid Nikolajka" 
   → {"type":"start_cleaning","property_hint":"Nikolajka","language":"cs","confidence":0.95}

6. "Došel toaletní papír" 
   → {"type":"supply_out","payload":{"items":["toaletní papír"]},"language":"cs","confidence":0.9}

7. "3 postele vyměněno" 
   → {"type":"linen_used","payload":{"changed":3},"language":"cs","confidence":0.9}

8. "Úklid dokončen" 
   → {"type":"done","language":"cs","confidence":0.95}

9. "Poznámka: klíče v zásuvce" 
   → {"type":"note","payload":{"text":"klíče v zásuvce"},"language":"cs","confidence":0.8}

10. "Foto: po úklidu" 
    → {"type":"photo_meta","payload":{"description":"po úklidu"},"language":"cs","confidence":0.8}

UKRAINIAN TESTS:
11. "Починаю прибирання 302" 
    → {"type":"start_cleaning","property_hint":"302","language":"uk","confidence":0.95}

12. "Закінчив прибирання" 
    → {"type":"done","language":"uk","confidence":0.95}

13. "Закінчилось мило" 
    → {"type":"supply_out","payload":{"items":["мило"]},"language":"uk","confidence":0.9}

14. "4 ліжка змінені" 
    → {"type":"linen_used","payload":{"changed":4},"language":"uk","confidence":0.9}

15. "Прибирання квартири 15" 
    → {"type":"start_cleaning","property_hint":"15","language":"uk","confidence":0.95}

ENGLISH TESTS:
16. "Starting cleaning apt 302" 
    → {"type":"start_cleaning","property_hint":"302","language":"en","confidence":0.95}

17. "Finished cleaning" 
    → {"type":"done","language":"en","confidence":0.95}

18. "Out of detergent" 
    → {"type":"supply_out","payload":{"items":["detergent"]},"language":"en","confidence":0.9}

19. "5 beds changed" 
    → {"type":"linen_used","payload":{"changed":5},"language":"en","confidence":0.9}

20. "Cleaning apartment 15" 
    → {"type":"start_cleaning","property_hint":"15","language":"en","confidence":0.95}

EDGE CASES:
- "ahoj" → {"ask":"U kterého bytu jsi?"}
- "123" → {"ask":"U kterého bytu jsi?"}
- "" → {"ask":"Potřebuji více informací. Můžete to zopakovat?"}
- "xyz" → {"ask":"U kterého bytu jsi?"}
*/
