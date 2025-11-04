import { getSupabaseServerClient } from './supabase/server';
import { ParsedMessage } from './ai/parseMessage';

// Types for session management
export type OpenSessionInput = {
  tenantId: string;
  cleanerPhone: string;
  propertyHint?: string;
  now?: Date;
};

export type AppendEventInput = {
  tenantId: string;
  cleanerPhone: string;
  parsed: ParsedMessage;
  now?: Date;
};

export type CloseSessionInput = {
  tenantId: string;
  cleanerPhone: string;
  reason?: 'done' | 'timeout' | 'manual';
  now?: Date;
};

export type SessionResult = {
  sessionId: string;
  propertyId: string;
};

export type EventResult = {
  sessionId: string;
  eventId: string;
};

export type ActiveSession = {
  sessionId: string;
  propertyId: string;
};

// Open a new cleaning session
export async function openSession(input: OpenSessionInput): Promise<SessionResult> {
  const supabase = getSupabaseServerClient();
  const now = input.now || new Date();
  
  try {
    // Check for existing active session
    const { data: existingSession } = await supabase
      .from('active_sessions')
      .select('id, property_id')
      .eq('tenant_id', input.tenantId)
      .eq('cleaner_phone', input.cleanerPhone)
      .eq('status', 'open')
      .single();

    if (existingSession) {
      // Get property name for conflict message
      const { data: property } = await supabase
        .from('properties')
        .select('name')
        .eq('id', existingSession.property_id)
        .single();

      const propertyName = property?.name || 'neznámý byt';
      throw new Error(`Mám ukončit předchozí (${propertyName}) a pokračovat tady?`);
    }

    // Resolve property from hint
    let propertyId: string;
    if (input.propertyHint) {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, name')
        .eq('tenant_id', input.tenantId)
        .or(`name.ilike.%${input.propertyHint}%,name.ilike.%${input.propertyHint}%`);

      if (error) throw error;

      if (!properties || properties.length === 0) {
        throw new Error(`Byt '${input.propertyHint}' nenalezen`);
      }

      if (properties.length > 1) {
        const names = properties.map((p: any) => p.name).join(', ');
        throw new Error(`Myslíš ${names}?`);
      }

      propertyId = properties[0].id;
    } else {
      throw new Error('U kterého bytu jsi? Napiš "Začínám úklid ..."');
    }

    // Create new session
    const { data: session, error: sessionError } = await supabase
      .from('active_sessions')
      .insert({
        tenant_id: input.tenantId,
        property_id: propertyId,
        cleaner_phone: input.cleanerPhone,
        started_at: now.toISOString(),
        expected_end_at: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
        status: 'open'
      })
      .select('id')
      .single();

    if (sessionError) throw sessionError;

    // Create start event
    const { error: eventError } = await supabase
      .from('events')
      .insert({
        tenant_id: input.tenantId,
        property_id: propertyId,
        type: 'cleaning_start',
        start: now.toISOString(),
        note: `Začátek úklidu${input.propertyHint ? ` - ${input.propertyHint}` : ''}`,
        done: false
      });

    if (eventError) throw eventError;

    return {
      sessionId: session.id,
      propertyId: propertyId
    };

  } catch (error) {
    console.error('Error opening session:', error);
    throw error;
  }
}

// Append event to active session
export async function appendEvent(input: AppendEventInput): Promise<EventResult> {
  const supabase = getSupabaseServerClient();
  const now = input.now || new Date();

  try {
    // Get active session
    const { data: session, error: sessionError } = await supabase
      .from('active_sessions')
      .select('id, property_id')
      .eq('tenant_id', input.tenantId)
      .eq('cleaner_phone', input.cleanerPhone)
      .eq('status', 'open')
      .single();

    if (sessionError || !session) {
      throw new Error('U kterého bytu jsi? Napiš "Začínám úklid ..."');
    }

    // Create event based on parsed type
    const eventData = {
      tenant_id: input.tenantId,
      property_id: session.property_id,
      type: input.parsed.type,
      start: now.toISOString(),
      note: getEventNote(input.parsed),
      done: input.parsed.type === 'done',
      ...getEventPayload(input.parsed)
    };

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert(eventData)
      .select('id')
      .single();

    if (eventError) throw eventError;

    return {
      sessionId: session.id,
      eventId: event.id
    };

  } catch (error) {
    console.error('Error appending event:', error);
    throw error;
  }
}

// Close active session
export async function closeSession(input: CloseSessionInput): Promise<{ sessionId: string }> {
  const supabase = getSupabaseServerClient();
  const now = input.now || new Date();

  try {
    // Get active session
    const { data: session, error: sessionError } = await supabase
      .from('active_sessions')
      .select('id, property_id')
      .eq('tenant_id', input.tenantId)
      .eq('cleaner_phone', input.cleanerPhone)
      .eq('status', 'open')
      .single();

    if (sessionError || !session) {
      throw new Error('U kterého bytu ukončuješ?');
    }

    // Close session
    const { error: closeError } = await supabase
      .from('active_sessions')
      .update({
        status: 'closed',
        ended_at: now.toISOString()
      })
      .eq('id', session.id);

    if (closeError) throw closeError;

    // Create done event if reason is 'done'
    if (input.reason === 'done') {
      const { error: eventError } = await supabase
        .from('events')
        .insert({
          tenant_id: input.tenantId,
          property_id: session.property_id,
          type: 'done',
          start: now.toISOString(),
          note: 'Úklid dokončen',
          done: true
        });

      if (eventError) throw eventError;
    }

    return { sessionId: session.id };

  } catch (error) {
    console.error('Error closing session:', error);
    throw error;
  }
}

// Get active session for cleaner
export async function getActiveSession(
  tenantId: string, 
  cleanerPhone: string
): Promise<ActiveSession | null> {
  const supabase = getSupabaseServerClient();

  try {
    const { data: session, error } = await supabase
      .from('active_sessions')
      .select('id, property_id')
      .eq('tenant_id', tenantId)
      .eq('cleaner_phone', cleanerPhone)
      .eq('status', 'open')
      .single();

    if (error || !session) {
      return null;
    }

    return {
      sessionId: session.id,
      propertyId: session.property_id
    };

  } catch (error) {
    console.error('Error getting active session:', error);
    return null;
  }
}

// Helper function to get event note from parsed message
function getEventNote(parsed: ParsedMessage): string {
  switch (parsed.type) {
    case 'start_cleaning':
      return `Začátek úklidu${parsed.property_hint ? ` - ${parsed.property_hint}` : ''}`;
    case 'supply_out':
      return `Došly zásoby: ${parsed.payload?.items?.join(', ') || 'neznámé'}`;
    case 'linen_used':
      return `Ložní prádlo: ${parsed.payload?.changed || 0} vyměněno, ${parsed.payload?.dirty || 0} špinavých`;
    case 'done':
      return 'Úklid dokončen';
    case 'note':
      return parsed.payload?.text || 'Poznámka';
    case 'photo_meta':
      return `Foto: ${parsed.payload?.description || 'bez popisu'}`;
    default:
      return 'Neznámý typ zprávy';
  }
}

// Helper function to get event payload from parsed message
function getEventPayload(parsed: ParsedMessage): any {
  const payload: any = {};

  if (parsed.type === 'supply_out' && parsed.payload?.items) {
    payload.supply_out = parsed.payload;
  }

  if (parsed.type === 'linen_used' && parsed.payload?.changed) {
    payload.linen_used = parsed.payload.changed;
  }

  if (parsed.type === 'photo_meta' && parsed.payload?.url) {
    payload.photo = parsed.payload.url;
  }

  return payload;
}

// Auto-close sessions after timeout (for cron jobs)
export async function autoCloseExpiredSessions(): Promise<number> {
  const supabase = getSupabaseServerClient();
  const now = new Date();

  try {
    // Find expired sessions
    const { data: expiredSessions, error: findError } = await supabase
      .from('active_sessions')
      .select('id, tenant_id, property_id')
      .eq('status', 'open')
      .lt('expected_end_at', now.toISOString());

    if (findError) throw findError;

    if (!expiredSessions || expiredSessions.length === 0) {
      return 0;
    }

    // Close all expired sessions
    const { error: closeError } = await supabase
      .from('active_sessions')
      .update({
        status: 'closed',
        ended_at: now.toISOString()
      })
      .in('id', expiredSessions.map((s: any) => s.id));

    if (closeError) throw closeError;

    console.log(`Auto-closed ${expiredSessions.length} expired sessions`);
    return expiredSessions.length;

  } catch (error) {
    console.error('Error auto-closing sessions:', error);
    throw error;
  }
}




