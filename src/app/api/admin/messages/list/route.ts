import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getDefaultTenantId } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  
  // Use DEFAULT_TENANT_ID for admin messages list
  // All web chat messages are stored under DEFAULT_TENANT_ID
  const tenantId = getDefaultTenantId();
  
  if (!tenantId) {
    console.error('DEFAULT_TENANT_ID is not set! Cannot load messages.');
    return NextResponse.json({ error: 'Server configuration error', rows: [], leads: [] }, { status: 500 });
  }
  
  // Latest messages for WEB chat - filter by source='web' and tenant_id
  let query = supabase
    .from('messages')
    .select('id, conversation_id, created_at, source, role, text, unread')
    .eq('source', 'web') // Only web chat messages
    .order('created_at', { ascending: false })
    .limit(200);
  
  // Filter by tenant
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }
  
  const { data: msgs, error: msgError } = await query;
  
  if (msgError) {
    console.error('Error loading messages:', msgError);
    return NextResponse.json({ error: msgError.message, rows: [], leads: [] }, { status: 500 });
  }
  
  console.log(`[Admin Messages] Loaded ${msgs?.length || 0} web messages for tenant_id: ${tenantId}`);
  if (msgs && msgs.length > 0) {
    console.log(`[Admin Messages] Sample message:`, {
      id: msgs[0].id,
      conversation_id: msgs[0].conversation_id,
      source: msgs[0].source,
      role: msgs[0].role,
      text: msgs[0].text?.substring(0, 50),
      has_conversation_id: !!msgs[0].conversation_id
    });
  }

  let leadsQuery = supabase
    .from('leads')
    .select('id, conversation_id')
    .order('created_at', { ascending: false })
    .limit(200);
  
  if (tenantId) {
    leadsQuery = leadsQuery.eq('tenant_id', tenantId);
  }
  
  const { data: leads, error: leadsError } = await leadsQuery;
  
  if (leadsError) {
    console.error('Error loading leads:', leadsError);
  }

  return NextResponse.json({ rows: msgs || [], leads: leads || [] });
}


