import { getClientOverview, ClientOverview } from './_data';
import { ClientPortalView } from './_client-portal';

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// Client portal overview page
export default async function ClientPortal() {
  // Get client ID from auth (this would be from JWT in real implementation)
  const clientId = '00000000-0000-0000-0000-000000000000'; // Valid UUID format
  
  let overview: ClientOverview;
  
  try {
    overview = await getClientOverview(clientId);
  } catch (error) {
    console.error('Error loading client portal data:', error);
    // Return fallback data to prevent build crashes
    overview = {
      properties: [],
      recentCleanings: [],
      recentPhotos: [],
      monthlyCleanings: 0,
      lastCleaning: null
    };
  }

  return <ClientPortalView overview={overview} />;
}

// Metadata for client pages
export const metadata = {
  title: 'Můj portál - CleanStay',
  robots: 'noindex, nofollow'
};