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

// AI prompt for message parsing
const createPrompt = (text: string, locale: string = 'en') => {
  return `You are an AI assistant that parses cleaning service messages from WhatsApp. 
Analyze the following message and extract structured information.

Message: "${text}"
Locale: ${locale}

Return a JSON object with the following structure:
{
  "type": "start_cleaning" | "supply_out" | "linen_used" | "note" | "photo_meta" | "done",
  "property_hint": "optional property identifier",
  "payload": { "key": "value" },
  "language": "detected language code",
  "confidence": 0.0-1.0
}

Message types:
- start_cleaning: Beginning of cleaning process
- supply_out: Running out of supplies
- linen_used: Linen/cleaning materials used
- note: General note or update
- photo_meta: Photo with metadata
- done: Cleaning completed

Be precise and only return valid JSON.`;
};

// Main parsing function
export const parseMessage = async (
  text: string, 
  locale: string = 'en'
): Promise<ParsedMessage> => {
  const openai = getOpenAIClient();
  
  if (!openai) {
    // Return default parsing when OpenAI is not available
    return {
      type: 'note',
      language: locale,
      confidence: 0.5,
      payload: { raw_text: text },
    };
  }
  
  try {
    const prompt = createPrompt(text, locale);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a cleaning service message parser. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });
    
    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }
    
    // Parse JSON response
    const parsed = JSON.parse(response);
    
    // Validate with Zod schema
    const validated = ParsedMessageSchema.parse(parsed);
    
    return validated;
    
  } catch (error) {
    console.error('AI parsing failed:', error);
    
    // Fallback parsing
    return {
      type: 'note',
      language: locale,
      confidence: 0.3,
      payload: { 
        raw_text: text,
        error: 'AI parsing failed',
        fallback: true,
      },
    };
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
