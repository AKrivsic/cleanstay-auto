import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  
  // WhatsApp Business API
  WABA_API_KEY: z.string().optional(),
  WABA_BASE_URL: z.string().url().optional().or(z.literal('')),
  
  // Feature flags
  CLEANSTAY_ENABLED: z.string().transform(val => val === 'true').default('false'),
  DEFAULT_TENANT_ID: z.string().uuid().optional(),
});

// Validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables');
  }
};

// Export validated environment
export const env = parseEnv();

// Type-safe environment access
export type Env = z.infer<typeof envSchema>;

// Helper to check if CleanStay is enabled
export const isCleanStayEnabled = () => {
  // On the client, treat CleanStay as enabled if public Supabase vars exist
  if (typeof window !== 'undefined') {
    const hasPublicSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return hasPublicSupabase || true; // default to true on client to allow auth/UI
  }
  return env.CLEANSTAY_ENABLED as unknown as boolean;
};

// Helper to get Supabase config (only if enabled)
export const getSupabaseConfig = () => {
  // Allow client to configure from NEXT_PUBLIC_* even if CLEANSTAY_ENABLED isn't set on client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn('⚠️ Supabase configuration missing');
    return null;
  }
  
  return {
    url,
    anonKey,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
};

// Helper to get OpenAI config (only if enabled)
export const getOpenAIConfig = () => {
  // Allow OpenAI usage if key exists, regardless of CLEANSTAY flag
  if (!env.OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API key missing');
    return null;
  }
  
  return {
    apiKey: env.OPENAI_API_KEY,
  };
};

// Helper to get WhatsApp config (only if enabled)
export const getWhatsAppConfig = () => {
  if (!isCleanStayEnabled()) {
    return null;
  }
  
  if (!env.WABA_API_KEY || !env.WABA_BASE_URL) {
    console.warn('⚠️ WhatsApp Business API configuration missing');
    return null;
  }
  
  return {
    apiKey: env.WABA_API_KEY,
    baseUrl: env.WABA_BASE_URL,
  };
};

// Alias for backward compatibility
export const getWABAConfig = getWhatsAppConfig;

export const getDefaultTenantId = () => env.DEFAULT_TENANT_ID || null;
