import { Suspense } from 'react';
import { getClientOverview, ClientOverview } from './_data';
import { ClientProperties } from './_components/ClientProperties';
import { ClientRecentCleanings } from './_components/ClientRecentCleanings';

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

  return (
    <div className="client-portal">
      <div className="client-header">
        <h1>Můj portál</h1>
        <p className="client-welcome">
          Vítejte v portálu pro správu vašich objektů a úklidů
        </p>
      </div>

      <div className="client-content">
        <div className="client-main">
          {/* My Properties Section */}
          <section className="client-section">
            <h2>Moje objekty</h2>
            <Suspense fallback={<div className="client-loading">Načítání objektů...</div>}>
              <ClientProperties properties={overview.properties} />
            </Suspense>
          </section>

          {/* Recent Cleanings Section */}
          <section className="client-section">
            <h2>Poslední úklidy</h2>
            <Suspense fallback={<div className="client-loading">Načítání úklidů...</div>}>
              <ClientRecentCleanings cleanings={overview.recentCleanings} />
            </Suspense>
          </section>
        </div>

        <div className="client-sidebar">
          {/* Quick Stats */}
          <section className="client-section">
            <h3>Rychlé statistiky</h3>
            <div className="client-stats">
              <div className="client-stat">
                <span className="client-stat-label">Celkem objektů:</span>
                <span className="client-stat-value">{overview.properties.length}</span>
              </div>
              <div className="client-stat">
                <span className="client-stat-label">Úklidy tento měsíc:</span>
                <span className="client-stat-value">{overview.monthlyCleanings}</span>
              </div>
              <div className="client-stat">
                <span className="client-stat-label">Poslední úklid:</span>
                <span className="client-stat-value">
                  {overview.lastCleaning ? new Date(overview.lastCleaning).toLocaleDateString() : 'Žádný'}
                </span>
              </div>
            </div>
          </section>

          {/* Recent Photos */}
          <section className="client-section">
            <h3>Nedávné fotky</h3>
            <div className="client-recent-photos">
              {overview.recentPhotos.map(photo => (
                <div key={photo.eventId} className="client-photo-thumb">
                  <img 
                    src={photo.thumbUrl} 
                    alt={`Foto z ${photo.propertyName}`}
                    className="client-photo-thumb-img"
                  />
                  <div className="client-photo-meta">
                    <span className="client-photo-time">
                      {new Date(photo.timestamp).toLocaleDateString()}
                    </span>
                    <span className="client-photo-phase client-badge client-badge-{photo.phase}">
                      {photo.phase}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Metadata for client pages
export const metadata = {
  title: 'Můj portál - CleanStay',
  robots: 'noindex, nofollow'
};