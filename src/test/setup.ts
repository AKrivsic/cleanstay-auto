import { vi } from 'vitest';

// Mock environment variables
vi.mock('./lib/env', () => ({
  isCleanStayEnabled: vi.fn(() => true),
  getSupabaseConfig: vi.fn(() => ({
    url: 'https://test.supabase.co',
    anonKey: 'test-anon-key',
    serviceRoleKey: 'test-service-key',
  })),
  getOpenAIConfig: vi.fn(() => ({
    apiKey: 'test-openai-key',
  })),
  getWhatsAppConfig: vi.fn(() => ({
    apiKey: 'test-whatsapp-key',
    baseUrl: 'https://test.whatsapp.com',
  })),
}));

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((data, init) => ({ data, init })),
    redirect: vi.fn((url) => ({ url })),
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
      insert: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
      update: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
      delete: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
    })),
    auth: {
      getUser: vi.fn().mockReturnValue(Promise.resolve({ data: { user: null }, error: null })),
    },
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
      })),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
  })),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
      insert: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
      update: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
      delete: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
    })),
    auth: {
      getUser: vi.fn().mockReturnValue(Promise.resolve({ data: { user: null }, error: null })),
    },
  })),
}));

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockReturnValue(Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                type: 'note',
                confidence: 0.8,
                language: 'en',
              }),
            },
          }],
        })),
      },
    },
  })),
}));
