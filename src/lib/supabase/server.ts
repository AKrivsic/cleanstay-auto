import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../env';

// Server-side Supabase client with service role key (for admin operations)
export const createSupabaseServerClient = () => {
  const config = getSupabaseConfig();
  
  if (!config || !config.serviceRoleKey) {
    // Return a mock client when CleanStay is disabled or service role key is missing
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null }),
      }),
      auth: {
        admin: {
          getUserById: () => Promise.resolve({ data: { user: null }, error: null }),
          createUser: () => Promise.resolve({ data: { user: null }, error: null }),
          updateUserById: () => Promise.resolve({ data: { user: null }, error: null }),
          deleteUser: () => Promise.resolve({ data: {}, error: null }),
        },
      },
    } as any;
  }
  
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Helper to get server client with error handling
export const getSupabaseServerClient = () => {
  try {
    return createSupabaseServerClient();
  } catch (error) {
    console.error('Failed to create Supabase server client:', error);
    throw new Error('Database connection failed');
  }
};
