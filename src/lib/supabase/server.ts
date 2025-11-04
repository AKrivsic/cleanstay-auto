import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../env';

// Server-side Supabase client with service role key (for admin operations)
export const createSupabaseServerClient = () => {
  const config = getSupabaseConfig();
  
  if (!config || !config.serviceRoleKey) {
    // Return a mock client when CleanStay is disabled or service role key is missing
    const chainableResponse = (data: any = null) => ({
      select: (_cols?: string) => chainableResponse(data),
      eq: (_col?: string, _val?: any) => chainableResponse(data),
      neq: (_col?: string, _val?: any) => chainableResponse(data),
      gt: (_col?: string, _val?: any) => chainableResponse(data),
      gte: (_col?: string, _val?: any) => chainableResponse(data),
      lt: (_col?: string, _val?: any) => chainableResponse(data),
      lte: (_col?: string, _val?: any) => chainableResponse(data),
      like: (_col?: string, _pattern?: string) => chainableResponse(data),
      ilike: (_col?: string, _pattern?: string) => chainableResponse(data),
      is: (_col?: string, _val?: any) => chainableResponse(data),
      in: (_col?: string, _val?: any[]) => chainableResponse(data),
      contains: (_col?: string, _val?: any) => chainableResponse(data),
      order: (_col?: string, _opts?: any) => chainableResponse(data),
      limit: (_n?: number) => chainableResponse(data),
      range: (_from?: number, _to?: number) => chainableResponse(data),
      single: () => Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'No rows found' } }),
      then: (onfulfilled?: any) => Promise.resolve({ data, error: null }).then(onfulfilled),
    });
    
    return {
      from: (_table: string) => chainableResponse(),
      rpc: (_fn: string, _params?: any) => Promise.resolve({ data: null, error: null }),
      auth: {
        admin: {
          getUserById: () => Promise.resolve({ data: { user: null }, error: null }),
          createUser: () => Promise.resolve({ data: { user: null }, error: null }),
          updateUserById: () => Promise.resolve({ data: { user: null }, error: null }),
          deleteUser: () => Promise.resolve({ data: {}, error: null }),
        },
      },
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: null }),
          download: () => Promise.resolve({ data: null, error: null }),
          list: () => Promise.resolve({ data: [], error: null }),
          remove: () => Promise.resolve({ data: [], error: null }),
          createSignedUrl: () => Promise.resolve({ 
            data: { signedUrl: null }, 
            error: { message: 'Storage not configured' } 
          }),
        }),
        listBuckets: () => Promise.resolve({ data: [], error: null }),
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
