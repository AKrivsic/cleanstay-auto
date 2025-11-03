import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../env';

// Public Supabase client for browser usage (realtime, auth)
export const createSupabaseClient = () => {
  const config = getSupabaseConfig();
  
  if (!config) {
    // Return a mock client when CleanStay is disabled or config is missing
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null }),
      }),
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signIn: () => Promise.resolve({ data: { user: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
    } as any;
  }
  
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
};

// Default client instance
export const supabase = createSupabaseClient();

// Export createClient for backward compatibility
export { createClient } from '@supabase/supabase-js';
