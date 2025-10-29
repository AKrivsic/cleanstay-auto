import { Suspense } from 'react';
import { getCleaningDetail } from '../../_data';
import { PhotoModal } from './_components/PhotoModal';
import { CleaningTimeline } from './_components/CleaningTimeline';
import { CleaningMetrics } from './_components/CleaningMetrics';

interface CleaningDetailPageProps {
  params: {
    id: string;
  };
}

// Admin cleaning detail page
export default async function CleaningDetailPage({ params }: CleaningDetailPageProps) {
  const tenantId = 'test-tenant-123'; // TODO: Get from auth context
  const cleaningId = params.id;

  const cleaning = await getCleaningDetail(tenantId, cleaningId);

  if (!cleaning) {
    return (
      <div className="admin-dashboard">
        <div className="admin-error">
          <h1>Úklid nenalezen</h1>
          <p>Požadovaný úklid neexistuje nebo nemáte oprávnění k jeho zobrazení.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-breadcrumb">
          <a href="/admin/dashboard" className="admin-breadcrumb-link">Dashboard</a>
          <span className="admin-breadcrumb-separator">›</span>
          <span className="admin-breadcrumb-current">Detail úklidu</span>
        </div>
        <h1>Detail úklidu</h1>
      </div>

      <div className="admin-content">
        <div className="admin-main">
          {/* Cleaning Header */}
          <section className="admin-section admin-cleaning-header">
            <div className="admin-cleaning-info">
              <h2>{cleaning.property_name}</h2>
              <div className="admin-cleaning-meta">
                <div className="admin-meta-item">
                  <span className="admin-meta-label">Čas:</span>
                  <span className="admin-meta-value">
                    {new Date(cleaning.scheduled_start).toLocaleString()} - 
                    {cleaning.scheduled_end ? new Date(cleaning.scheduled_end).toLocaleString() : 'Probíhá'}
                  </span>
                </div>
                <div className="admin-meta-item">
                  <span className="admin-meta-label">Uklízečka:</span>
                  <span className="admin-meta-value">{cleaning.cleaner_name || 'Nepřiřazeno'}</span>
                </div>
                <div className="admin-meta-item">
                  <span className="admin-meta-label">Stav:</span>
                  <span className={`admin-badge admin-badge-${cleaning.status}`}>
                    {cleaning.status}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="admin-section">
            <h3>Timeline událostí</h3>
            <Suspense fallback={<div className="admin-loading">Načítání timeline...</div>}>
              <CleaningTimeline events={cleaning.events} />
            </Suspense>
          </section>
        </div>

        <div className="admin-sidebar">
          {/* Quick Metrics */}
          <section className="admin-section">
            <h3>Rychlé metriky</h3>
            <Suspense fallback={<div className="admin-loading">Načítání metrik...</div>}>
              <CleaningMetrics cleaning={cleaning} />
            </Suspense>
          </section>

          {/* Photo Gallery */}
          <section className="admin-section">
            <h3>Fotky ({cleaning.photos.length})</h3>
            <div className="admin-photo-gallery">
              {cleaning.photos.map(photo => (
                <div key={photo.eventId} className="admin-photo-item">
                  <img 
                    src={photo.thumbUrl} 
                    alt={`Foto z ${photo.phase} fáze`}
                    className="admin-photo-thumb"
                    onClick={() => {
                      // This would open the photo modal
                      console.log('Open photo modal for:', photo.eventId);
                    }}
                  />
                  <div className="admin-photo-info">
                    <span className="admin-photo-phase admin-badge admin-badge-{photo.phase}">
                      {photo.phase}
                    </span>
                    <span className="admin-photo-time">
                      {new Date(photo.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Photo Modal */}
      <PhotoModal />
    </div>
  );
}

// Metadata for admin pages
export const metadata = {
  title: 'Detail úklidu - CleanStay Admin',
  robots: 'noindex, nofollow'
};




