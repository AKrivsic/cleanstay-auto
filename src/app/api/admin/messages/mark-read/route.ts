import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const supabase = getSupabaseServerClient();
  await supabase.from('messages').update({ unread: false }).eq('id', id);
  return NextResponse.json({ ok: true });
}


