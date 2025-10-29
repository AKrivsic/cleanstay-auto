import { createSupabaseClient } from '@/lib/supabase/client';
import { clientAuth } from '@/lib/auth/client-auth';
import { getSignedPhotoUrls } from '@/lib/media/getSignedPhotoUrls';

// Types for client data
export interface ClientOverview {
  properties: Array<{
    id: string;
    name: string;
    type: string;
    address?: {
      street: string;
      city: string;
      zip: string;
    };
    lastCleaning: {
      id: string;
      date: string;
      status: string;
    } | null;
  }>;
  recentCleanings: Array<{
    id: string;
    propertyName: string;
    date: string;
    status: string;
    duration?: number;
  }>;
  recentPhotos: Array<{
    eventId: string;
    thumbUrl: string;
    propertyName: string;
    phase: string;
    timestamp: string;
  }>;
  monthlyCleanings: number;
  lastCleaning: string | null;
}

export interface ClientCleaningDetail {
  id: string;
  propertyName: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string | null;
  duration?: number;
  events: Array<{
    id: string;
    type: string;
    start: string;
    note: string | null;
    phase?: string;
  }>;
  photos: Array<{
    eventId: string;
    thumbUrl: string;
    mainUrl: string;
    phase: string;
    timestamp: string;
    width: number;
    height: number;
  }>;
  summary?: string;
  suppliesUsed?: string[];
}

export interface ClientPropertyDetail {
  id: string;
  name: string;
  type: string;
  address?: {
    street: string;
    city: string;
    zip: string;
  };
  totalCleanings: number;
  monthlyCleanings: number;
  avgDuration: number;
  lastCleaning: string | null;
  nextCleaning?: {
    id: string;
    scheduled_start: string;
    status: string;
  };
  recentCleanings: Array<{
    id: string;
    scheduled_start: string;
    status: string;
    duration?: number;
  }>;
  recentSupplies: Array<{
    name: string;
    date: string;
    quantity: number;
    unit: string;
  }>;
}

// Get client overview data
export async function getClientOverview(clientId: string): Promise<ClientOverview> {
  // Safe guard for build time
  if (!clientId || clientId === '00000000-0000-0000-0000-000000000000') {
    return {
      properties: [],
      recentCleanings: [],
      recentPhotos: [],
      monthlyCleanings: 0,
      lastCleaning: null
    };
  }

  try {
    // Verify client role and get authenticated client
    const isClient = await clientAuth.verifyClientRole();
    if (!isClient) {
      throw new Error('Access denied. Client role required.');
    }

    const supabase = await clientAuth.getAuthenticatedClient();
    const tenantId = await clientAuth.getTenantId();
    // Get client's properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        name,
        type,
        address,
        cleanings!inner(
          id,
          scheduled_start,
          status,
          scheduled_end
        )
      `)
      .eq('tenant_id', tenantId) // RLS will filter by client
      .order('name', { ascending: true });

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      throw new Error('Failed to fetch properties');
    }

    // Get recent cleanings
    const { data: recentCleanings, error: cleaningsError } = await supabase
      .from('cleanings')
      .select(`
        id,
        scheduled_start,
        status,
        scheduled_end,
        properties!inner(name)
      `)
      .eq('tenant_id', tenantId)
      .order('scheduled_start', { ascending: false })
      .limit(10);

    if (cleaningsError) {
      console.error('Error fetching cleanings:', cleaningsError);
    }

    // Get recent photos
    const { data: photoEvents, error: photosError } = await supabase
      .from('events')
      .select(`
        id,
        start,
        phase,
        width,
        height,
        properties!inner(name)
      `)
      .eq('tenant_id', tenantId)
      .eq('type', 'photo')
      .order('start', { ascending: false })
      .limit(5);

    if (photosError) {
      console.error('Error fetching photos:', photosError);
    }

    // Generate signed URLs for photos
    let recentPhotos = [];
    if (photoEvents && photoEvents.length > 0) {
      try {
        const photoUrls = await getSignedPhotoUrls({
          eventIds: photoEvents.map((e: any) => e.id),
          tenantId: tenantId
        });

        recentPhotos = photoEvents.map((event: any, index: number) => ({
          eventId: event.id,
          thumbUrl: photoUrls[index]?.thumbUrl || '',
          propertyName: event.properties.name,
          phase: event.phase || 'other',
          timestamp: event.start
        }));
      } catch (error) {
        console.error('Error generating signed URLs:', error);
      }
    }

    // Process properties with last cleaning
    const processedProperties = properties?.map((property: any) => {
      const lastCleaning = property.cleanings?.[0]; // Most recent cleaning
      return {
        id: property.id,
        name: property.name,
        type: property.type,
        address: property.address,
        lastCleaning: lastCleaning ? {
          id: lastCleaning.id,
          date: lastCleaning.scheduled_start,
          status: lastCleaning.status
        } : null
      };
    }) || [];

    // Process recent cleanings
    const processedCleanings = recentCleanings?.map((cleaning: any) => ({
      id: cleaning.id,
      propertyName: cleaning.properties.name,
      date: cleaning.scheduled_start,
      status: cleaning.status,
      duration: cleaning.scheduled_end ? 
        Math.round((new Date(cleaning.scheduled_end).getTime() - new Date(cleaning.scheduled_start).getTime()) / (1000 * 60 * 60) * 10) / 10 : 
        undefined
    })) || [];

    // Calculate monthly cleanings
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthlyCleanings = recentCleanings?.filter((c: any) => 
      new Date(c.scheduled_start) >= thisMonth
    ).length || 0;

    const lastCleaning = recentCleanings?.[0]?.scheduled_start || null;

    // Log safe metadata
    console.log('Client overview loaded:', {
      propertiesCount: processedProperties.length,
      cleaningsCount: processedCleanings.length,
      photosCount: recentPhotos.length,
      clientId: tenantId.substring(0, 8) + '...'
    });

    return {
      properties: processedProperties,
      recentCleanings: processedCleanings,
      recentPhotos,
      monthlyCleanings,
      lastCleaning
    };

  } catch (error) {
    console.error('Error in getClientOverview:', error);
    throw new Error('Failed to load client overview');
  }
}

// Get client cleanings with pagination
export async function getClientCleanings(
  clientId: string,
  propertyId: string,
  options: { from?: string; to?: string; page?: number; pageSize?: number } = {}
): Promise<Array<{
  id: string;
  scheduled_start: string;
  status: string;
  duration?: number;
}>> {
  // Verify client role and get authenticated client
  const isClient = await clientAuth.verifyClientRole();
  if (!isClient) {
    throw new Error('Access denied. Client role required.');
  }

  const supabase = await clientAuth.getAuthenticatedClient();
  const tenantId = await clientAuth.getTenantId();
  const { from, to, page = 1, pageSize = 10 } = options;

  try {
    let query = supabase
      .from('cleanings')
      .select('id, scheduled_start, status, scheduled_end')
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)
      .order('scheduled_start', { ascending: false });

    if (from) {
      query = query.gte('scheduled_start', from);
    }
    if (to) {
      query = query.lte('scheduled_start', to);
    }

    // Add pagination
    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;
    query = query.range(fromIndex, toIndex);

    const { data: cleanings, error } = await query;

    if (error) {
      console.error('Error fetching cleanings:', error);
      throw new Error('Failed to fetch cleanings');
    }

    // Calculate durations
    const processedCleanings = cleanings?.map((cleaning: any) => ({
      id: cleaning.id,
      scheduled_start: cleaning.scheduled_start,
      status: cleaning.status,
      duration: cleaning.scheduled_end ? 
        Math.round((new Date(cleaning.scheduled_end).getTime() - new Date(cleaning.scheduled_start).getTime()) / (1000 * 60 * 60) * 10) / 10 : 
        undefined
    })) || [];

    // Log safe metadata
    console.log('Client cleanings loaded:', {
      count: processedCleanings.length,
      propertyId: propertyId.substring(0, 8) + '...',
      clientId: tenantId.substring(0, 8) + '...'
    });

    return processedCleanings;

  } catch (error) {
    console.error('Error in getClientCleanings:', error);
    throw new Error('Failed to load client cleanings');
  }
}

// Get client cleaning detail
export async function getClientCleaningDetail(
  clientId: string, 
  cleaningId: string
): Promise<ClientCleaningDetail | null> {
  // Verify client role and get authenticated client
  const isClient = await clientAuth.verifyClientRole();
  if (!isClient) {
    throw new Error('Access denied. Client role required.');
  }

  const supabase = await clientAuth.getAuthenticatedClient();
  const tenantId = await clientAuth.getTenantId();

  try {
    // Get cleaning info
    const { data: cleaning, error: cleaningError } = await supabase
      .from('cleanings')
      .select(`
        id,
        status,
        scheduled_start,
        scheduled_end,
        properties!inner(name)
      `)
      .eq('tenant_id', tenantId)
      .eq('id', cleaningId)
      .single();

    if (cleaningError || !cleaning) {
      console.error('Error fetching cleaning:', cleaningError);
      return null;
    }

    // Get events for this cleaning (filter out internal notes)
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, type, start, note, phase')
      .eq('tenant_id', tenantId)
      .eq('cleaning_id', cleaningId)
      .not('note', 'ilike', '%interní%') // Filter out internal notes
      .not('note', 'ilike', '%internal%')
      .order('start', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
    }

    // Get photos and generate signed URLs
    const photoEvents = events?.filter((e: any) => e.type === 'photo') || [];
    let photos = [];
    
    if (photoEvents.length > 0) {
      try {
        const photoUrls = await getSignedPhotoUrls({
          eventIds: photoEvents.map((e: any) => e.id),
          tenantId: tenantId
        });

        photos = photoEvents.map((event: any, index: number) => ({
          eventId: event.id,
          thumbUrl: photoUrls[index]?.thumbUrl || '',
          mainUrl: photoUrls[index]?.mainUrl || '',
          phase: event.phase || 'other',
          timestamp: event.start,
          width: 0, // Will be filled from event data if available
          height: 0
        }));
      } catch (error) {
        console.error('Error generating signed URLs for cleaning:', error);
      }
    }

    // Calculate duration
    const duration = cleaning.scheduled_end ? 
      Math.round((new Date(cleaning.scheduled_end).getTime() - new Date(cleaning.scheduled_start).getTime()) / (1000 * 60 * 60) * 10) / 10 : 
      undefined;

    // Generate summary from events
    const summary = generateCleaningSummary(events || []);

    // Extract supplies used from supply_out events
    const suppliesUsed = events?.filter((e: any) => e.type === 'supply_out')
      .map((e: any) => e.note)
      .filter(Boolean) || [];

    // Log safe metadata
    console.log('Client cleaning detail loaded:', {
      cleaningId: cleaningId.substring(0, 8) + '...',
      eventsCount: events?.length || 0,
      photosCount: photos.length,
      clientId: tenantId.substring(0, 8) + '...'
    });

    return {
      id: cleaning.id,
      propertyName: cleaning.properties.name,
      status: cleaning.status,
      scheduled_start: cleaning.scheduled_start,
      scheduled_end: cleaning.scheduled_end,
      duration,
      events: events || [],
      photos,
      summary,
      suppliesUsed
    };

  } catch (error) {
    console.error('Error in getClientCleaningDetail:', error);
    return null;
  }
}

// Get client property detail
export async function getClientPropertyDetail(
  clientId: string, 
  propertyId: string
): Promise<ClientPropertyDetail | null> {
  // Verify client role and get authenticated client
  const isClient = await clientAuth.verifyClientRole();
  if (!isClient) {
    throw new Error('Access denied. Client role required.');
  }

  const supabase = await clientAuth.getAuthenticatedClient();
  const tenantId = await clientAuth.getTenantId();

  try {
    // Get property info
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, name, type, address')
      .eq('tenant_id', tenantId)
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('Error fetching property:', propertyError);
      return null;
    }

    // Get cleaning statistics
    const { data: cleanings, error: cleaningsError } = await supabase
      .from('cleanings')
      .select('id, scheduled_start, status, scheduled_end')
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)
      .order('scheduled_start', { ascending: false });

    if (cleaningsError) {
      console.error('Error fetching cleanings:', cleaningsError);
    }

    // Calculate statistics
    const totalCleanings = cleanings?.length || 0;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthlyCleanings = cleanings?.filter((c: any) => 
      new Date(c.scheduled_start) >= thisMonth
    ).length || 0;

    const lastCleaning = cleanings?.[0]?.scheduled_start || null;
    const nextCleaning = cleanings?.find((c: any) => c.status === 'scheduled');

    // Get recent cleanings (last 10)
    const recentCleanings = cleanings?.slice(0, 10).map((cleaning: any) => ({
      id: cleaning.id,
      scheduled_start: cleaning.scheduled_start,
      status: cleaning.status,
      duration: cleaning.scheduled_end ? 
        Math.round((new Date(cleaning.scheduled_end).getTime() - new Date(cleaning.scheduled_start).getTime()) / (1000 * 60 * 60) * 10) / 10 : 
        undefined
    })) || [];

    // Get recent supplies (from supply_out events)
    const { data: supplyEvents, error: suppliesError } = await supabase
      .from('events')
      .select('start, note')
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)
      .eq('type', 'supply_out')
      .order('start', { ascending: false })
      .limit(5);

    if (suppliesError) {
      console.error('Error fetching supplies:', suppliesError);
    }

    const recentSupplies = supplyEvents?.map((event: any) => ({
      name: event.note || 'Neznámá zásoba',
      date: event.start,
      quantity: 1, // Mock data
      unit: 'ks'
    })) || [];

    // Calculate average duration
    const completedCleanings = cleanings?.filter((c: any) => c.scheduled_end) || [];
    const avgDuration = completedCleanings.length > 0 ? 
      completedCleanings.reduce((sum: number, c: any) => {
        const duration = (new Date(c.scheduled_end!).getTime() - new Date(c.scheduled_start).getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0) / completedCleanings.length : 0;

    // Log safe metadata
    console.log('Client property detail loaded:', {
      propertyId: propertyId.substring(0, 8) + '...',
      totalCleanings,
      monthlyCleanings,
      clientId: tenantId.substring(0, 8) + '...'
    });

    return {
      id: property.id,
      name: property.name,
      type: property.type,
      address: property.address,
      totalCleanings,
      monthlyCleanings,
      avgDuration: Math.round(avgDuration * 10) / 10,
      lastCleaning,
      nextCleaning: nextCleaning ? {
        id: nextCleaning.id,
        scheduled_start: nextCleaning.scheduled_start,
        status: nextCleaning.status
      } : undefined,
      recentCleanings,
      recentSupplies
    };

  } catch (error) {
    console.error('Error in getClientPropertyDetail:', error);
    return null;
  }
}

// Helper function to generate cleaning summary
function generateCleaningSummary(events: Array<{ type: string; note: string | null }>): string {
  const eventTypes = events.map(e => e.type);
  const hasPhotos = eventTypes.includes('photo');
  const hasSupplies = eventTypes.includes('supply_out');
  const hasLinen = eventTypes.includes('linen_used');
  const isCompleted = eventTypes.includes('done');

  const summaryParts = [];
  
  if (isCompleted) {
    summaryParts.push('Úklid byl dokončen');
  } else {
    summaryParts.push('Úklid probíhá');
  }

  if (hasPhotos) {
    summaryParts.push('s fotografiemi');
  }

  if (hasSupplies) {
    summaryParts.push('s doplněním zásob');
  }

  if (hasLinen) {
    summaryParts.push('s výměnou prádla');
  }

  return summaryParts.join(' ');
}
