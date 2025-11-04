import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../env';

// Public Supabase client for browser usage (realtime, auth)
export const createSupabaseClient = () => {
  const config = getSupabaseConfig();
  
  if (!config) {
    // Return a mock client when CleanStay is disabled or config is missing
    const chainableResponse = (data: any[] = []) => ({
      select: (_cols?: string) => chainableResponse(data),
      eq: (_col?: string, _val?: any) => chainableResponse(data),
      order: (_col?: string, _opts?: any) => Promise.resolve({ data, error: null }),
      insert: (_rows?: any) => Promise.resolve({ data: [], error: null }),
      update: (_values?: any) => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
    });

    return {
      from: (_table: string) => chainableResponse(),
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signIn: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: ({ email, password }: { email: string; password: string }) => {
          console.error('Mock client: Cannot sign in. Missing Supabase env variables.');
          return Promise.resolve({ 
            data: { user: null, session: null }, 
            error: { message: 'Supabase not configured. Check env variables.' } 
          });
        },
        signUp: ({ email, password }: { email: string; password: string }) => {
          console.error('Mock client: Cannot sign up. Missing Supabase env variables.');
          return Promise.resolve({ 
            data: { user: null, session: null }, 
            error: { message: 'Supabase not configured. Check env variables.' } 
          });
        },
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
