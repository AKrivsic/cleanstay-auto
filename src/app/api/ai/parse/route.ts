import { NextRequest, NextResponse } from 'next/server';
import { isCleanStayEnabled } from '@/lib/env';
import { parseMessage } from '@/lib/ai/parseMessage';
import { z } from 'zod';

// Request schema validation
const ParseRequestSchema = z.object({
  text: z.string().min(1).max(1000),
  locale: z.string().optional().default('en'),
});

export async function POST(request: NextRequest) {
  if (!isCleanStayEnabled()) {
    return NextResponse.json(
      { error: 'CleanStay feature is disabled' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    
    // Validate request
    const { text, locale } = ParseRequestSchema.parse(body);
    
    // Parse message with AI
    const parsed = await parseMessage(text, locale);
    
    return NextResponse.json({
      success: true,
      data: parsed,
    });
    
  } catch (error) {
    console.error('AI parse API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  if (!isCleanStayEnabled()) {
    return NextResponse.json(
      { error: 'CleanStay feature is disabled' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: 'ok',
    service: 'AI Parse API',
    enabled: true,
  });
}
