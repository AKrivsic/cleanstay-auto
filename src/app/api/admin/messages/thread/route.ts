import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get('conversationId');
  if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
  const supabase = getSupabaseServerClient();
  const { data: msgs } = await supabase
    .from('messages')
    .select('id, created_at, role, source, text, unread')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  const { data: lead } = await supabase
    .from('leads')
    .select('id, name, email, phone, service_type, city, size_m2, cadence, rush, consent, created_at')
    .eq('conversation_id', conversationId)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ messages: msgs || [], lead: lead || null });
}


