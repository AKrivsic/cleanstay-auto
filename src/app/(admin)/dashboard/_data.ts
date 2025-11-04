import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSignedPhotoUrls } from '@/lib/media/getSignedPhotoUrls';

// Types for admin data
export interface TodayOverview {
  cleanings: Array<{
    id: string;
    property_name: string;
    cleaner_name: string | null;
    status: string;
    scheduled_start: string;
    scheduled_end: string | null;
    last_event: string | null;
  }>;
  recentPhotos: Array<{
    eventId: string;
    thumbUrl: string;
    propertyName: string;
    phase: string;
    timestamp: string;
  }>;
}

// Photo event type
interface PhotoEvent {
  id: string;
  properties: {
    name: string;
  };
  phase: string;
  start: string;
  width?: number;
  height?: number;
}

// Cleaning type from database
interface Cleaning {
  id: string;
  properties: {
    name: string;
  };
  users?: {
    name: string;
  } | null;
  status: string;
  scheduled_start: string;
  scheduled_end: string | null;
}

// Event type from database
interface Event {
  cleaning_id: string;
  type: string;
  start: string;
}

export interface PropertyList {
  id: string;
  name: string;
  type: string;
  address?: {
    street: string;
    city: string;
    zip: string;
  };
}

export interface CleaningDetail {
  id: string;
  property_name: string;
  cleaner_name: string | null;
  status: string;
  scheduled_start: string;
  scheduled_end: string | null;
  events: Array<{
    id: string;
    type: string;
    start: string;
    note: string | null;
    phase?: string;
    width?: number;
    height?: number;
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
}

export interface PropertyDetail {
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
  recentCleanings: Array<{
    id: string;
    scheduled_start: string;
    status: string;
    cleaner_name: string | null;
  }>;
  supplies: Array<{
    name: string;
    current: number;
    min: number;
    max: number;
    unit: string;
  }>;
  notes: Array<{
    id: string;
    text: string;
    created_at: string;
    author: string;
  }>;
}

// Get today's overview data
export async function getTodayOverview(tenantId: string): Promise<TodayOverview> {
  // Safe guard for build time
  if (!tenantId || tenantId === '00000000-0000-0000-0000-000000000000') {
    return {
      cleanings: [],
      recentPhotos: []
    };
  }

  const supabase = getSupabaseServerClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    // Get today's cleanings
    const { data: cleanings, error: cleaningsError } = await supabase
      .from('cleanings')
      .select(`
        id,
        status,
        scheduled_date,
        started_at,
        completed_at,
        properties!inner(name),
        users!inner(name)
      `)
      .eq('tenant_id', tenantId)
      .gte('scheduled_date', today.toISOString())
      .lt('scheduled_date', tomorrow.toISOString())
      .order('scheduled_date', { ascending: true });

    if (cleaningsError) {
      console.error('Error fetching cleanings:', cleaningsError);
      throw new Error('Failed to fetch cleanings');
    }

    // Get recent events for last event info
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('cleaning_id, event_type, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
    }

    // Get recent photos
    const { data: photoEvents, error: photosError } = await supabase
      .from('events')
      .select(`
        id,
        created_at,
        event_data,
        properties!inner(name)
      `)
      .eq('tenant_id', tenantId)
      .eq('event_type', 'photo')
      .order('created_at', { ascending: false })
      .limit(5);

    if (photosError) {
      console.error('Error fetching photos:', photosError);
    }

    // Generate signed URLs for photos
    let recentPhotos = [];
    if (photoEvents && photoEvents.length > 0) {
      try {
        const photoUrls = await getSignedPhotoUrls({
          eventIds: photoEvents.map((e: PhotoEvent) => e.id),
          tenantId
        });

        recentPhotos = photoEvents.map((event: any, index: number) => ({
          eventId: event.id,
          thumbUrl: photoUrls[index]?.thumbUrl || '',
          propertyName: event.properties.name,
          phase: event.event_data?.phase || 'other',
          timestamp: event.created_at
        }));
      } catch (error) {
        console.error('Error generating signed URLs:', error);
      }
    }

    // Process cleanings data
    const processedCleanings = cleanings?.map((cleaning: any) => {
      const lastEvent = events?.find((e: any) => e.cleaning_id === cleaning.id);
      return {
        id: cleaning.id,
        property_name: cleaning.properties.name,
        cleaner_name: cleaning.users?.name || null,
        status: cleaning.status,
        scheduled_start: cleaning.scheduled_date,
        scheduled_end: cleaning.completed_at,
        last_event: lastEvent?.event_type || null
      };
    }) || [];

    // Log safe metadata
    console.log('Today overview loaded:', {
      cleaningsCount: processedCleanings.length,
      photosCount: recentPhotos.length,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return {
      cleanings: processedCleanings,
      recentPhotos
    };

  } catch (error) {
    console.error('Error in getTodayOverview:', error);
    throw new Error('Failed to load today overview');
  }
}

// Get property list with pagination
export async function getPropertyList(
  tenantId: string, 
  options: { search?: string; page?: number; pageSize?: number } = {}
): Promise<PropertyList[]> {
  // Safe guard for build time
  if (!tenantId || tenantId === '00000000-0000-0000-0000-000000000000') {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { search, page = 1, pageSize = 10 } = options;

  try {
    let query = supabase
      .from('properties')
      .select('id, name, type, address')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: properties, error } = await query;

    if (error) {
      console.error('Error fetching properties:', error);
      throw new Error('Failed to fetch properties');
    }

    // Log safe metadata
    console.log('Property list loaded:', {
      count: properties?.length || 0,
      search: search || 'none',
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return properties || [];

  } catch (error) {
    console.error('Error in getPropertyList:', error);
    throw new Error('Failed to load property list');
  }
}

// Get cleaning detail with events and photos
export async function getCleaningDetail(tenantId: string, cleaningId: string): Promise<CleaningDetail | null> {
  const supabase = getSupabaseServerClient();

  try {
    // Get cleaning info
    const { data: cleaning, error: cleaningError } = await supabase
      .from('cleanings')
      .select(`
        id,
        status,
        scheduled_start,
        scheduled_end,
        properties!inner(name),
        users!inner(name)
      `)
      .eq('tenant_id', tenantId)
      .eq('id', cleaningId)
      .single();

    if (cleaningError || !cleaning) {
      console.error('Error fetching cleaning:', cleaningError);
      return null;
    }

    // Get events for this cleaning
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, type, start, note, phase, width, height')
      .eq('tenant_id', tenantId)
      .eq('cleaning_id', cleaningId)
      .order('start', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
    }

    // Get photos and generate signed URLs
    const photoEvents = events?.filter((e: Event) => e.type === 'photo') || [];
    let photos = [];
    
    if (photoEvents.length > 0) {
      try {
        const photoUrls = await getSignedPhotoUrls({
          eventIds: photoEvents.map((e: PhotoEvent) => e.id),
          tenantId
        });

        photos = photoEvents.map((event: PhotoEvent, index: number) => ({
          eventId: event.id,
          thumbUrl: photoUrls[index]?.thumbUrl || '',
          mainUrl: photoUrls[index]?.mainUrl || '',
          phase: event.phase || 'other',
          timestamp: event.start,
          width: event.width || 0,
          height: event.height || 0
        }));
      } catch (error) {
        console.error('Error generating signed URLs for cleaning:', error);
      }
    }

    // Log safe metadata
    console.log('Cleaning detail loaded:', {
      cleaningId: cleaningId.substring(0, 8) + '...',
      eventsCount: events?.length || 0,
      photosCount: photos.length,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return {
      id: cleaning.id,
      property_name: cleaning.properties.name,
      cleaner_name: cleaning.users?.name || null,
      status: cleaning.status,
      scheduled_start: cleaning.scheduled_start,
      scheduled_end: cleaning.scheduled_end,
      events: events || [],
      photos
    };

  } catch (error) {
    console.error('Error in getCleaningDetail:', error);
    return null;
  }
}

// Get property detail
export async function getPropertyDetail(tenantId: string, propertyId: string): Promise<PropertyDetail | null> {
  const supabase = getSupabaseServerClient();

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
      .select('id, scheduled_start, status, users!inner(name)')
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)
      .order('scheduled_start', { ascending: false });

    if (cleaningsError) {
      console.error('Error fetching cleanings:', cleaningsError);
    }

    // Calculate statistics
    const totalCleanings = cleanings?.length || 0;
    const monthlyCleanings = cleanings?.filter((c: Cleaning) => {
      const cleaningDate = new Date(c.scheduled_start);
      const now = new Date();
      return cleaningDate.getMonth() === now.getMonth() && 
             cleaningDate.getFullYear() === now.getFullYear();
    }).length || 0;

    const lastCleaning = cleanings?.[0]?.scheduled_start || null;
    const recentCleanings = cleanings?.slice(0, 5).map((c: Cleaning) => ({
      id: c.id,
      scheduled_start: c.scheduled_start,
      status: c.status,
      cleaner_name: c.users?.name || null
    })) || [];

    // Mock supplies data (would come from inventory table)
    const supplies = [
      { name: 'All-Purpose Cleaner', current: 5, min: 2, max: 10, unit: 'l' },
      { name: 'Trash Bags', current: 50, min: 20, max: 100, unit: 'pcs' },
      { name: 'Toilet Paper', current: 12, min: 5, max: 30, unit: 'rolls' }
    ];

    // Mock notes data (would come from events table)
    const notes = [
      { id: '1', text: 'Klíče v zásuvce', created_at: new Date().toISOString(), author: 'Jan Uklízeč' },
      { id: '2', text: 'Pozor na nově natřené zábradlí', created_at: new Date().toISOString(), author: 'Admin' }
    ];

    // Log safe metadata
    console.log('Property detail loaded:', {
      propertyId: propertyId.substring(0, 8) + '...',
      totalCleanings,
      monthlyCleanings,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return {
      id: property.id,
      name: property.name,
      type: property.type,
      address: property.address,
      totalCleanings,
      monthlyCleanings,
      avgDuration: 3.5, // Mock data
      lastCleaning,
      recentCleanings,
      supplies,
      notes
    };

  } catch (error) {
    console.error('Error in getPropertyDetail:', error);
    return null;
  }
}




