import { Suspense } from 'react';
import { getClientCleaningDetail } from '../../_data';
import { ClientCleaningTimeline } from './_components/ClientCleaningTimeline';
import { ClientCleaningPhotos } from './_components/ClientCleaningPhotos';
import { ClientCleaningHeader } from './_components/ClientCleaningHeader';

interface ClientCleaningDetailPageProps {
  params: {
    id: string;
  };
}

// Client cleaning detail page
export default async function ClientCleaningDetailPage({ params }: ClientCleaningDetailPageProps) {
  const clientId = 'test-client-123'; // TODO: Get from auth context
  const cleaningId = params.id;

  const cleaning = await getClientCleaningDetail(clientId, cleaningId);

  if (!cleaning) {
    return (
      <div className="client-portal">
        <div className="client-error">
          <h1>Úklid nenalezen</h1>
          <p>Požadovaný úklid neexistuje nebo nemáte oprávnění k jeho zobrazení.</p>
          <a href="/portal" className="client-button client-button-primary">
            Zpět na portál
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="client-portal">
      <div className="client-header">
        <div className="client-breadcrumb">
          <a href="/portal" className="client-breadcrumb-link">Můj portál</a>
          <span className="client-breadcrumb-separator">›</span>
          <span className="client-breadcrumb-current">Detail úklidu</span>
        </div>
        <h1>Detail úklidu</h1>
      </div>

      <div className="client-content">
        <div className="client-main">
          {/* Cleaning Header */}
          <section className="client-section">
            <Suspense fallback={<div className="client-loading">Načítání...</div>}>
              <ClientCleaningHeader cleaning={cleaning} />
            </Suspense>
          </section>

          {/* Timeline */}
          <section className="client-section">
            <h3>Průběh úklidu</h3>
            <Suspense fallback={<div className="client-loading">Načítání timeline...</div>}>
              <ClientCleaningTimeline events={cleaning.events} />
            </Suspense>
          </section>

          {/* Photos */}
          <section className="client-section">
            <h3>Fotografie ({cleaning.photos.length})</h3>
            <Suspense fallback={<div className="client-loading">Načítání fotek...</div>}>
              <ClientCleaningPhotos photos={cleaning.photos} />
            </Suspense>
          </section>
        </div>

        <div className="client-sidebar">
          {/* Quick Info */}
          <section className="client-section">
            <h3>Informace o úklidu</h3>
            <div className="client-cleaning-info">
              <div className="client-info-item">
                <span className="client-info-label">Délka úklidu:</span>
                <span className="client-info-value">
                  {cleaning.duration ? `${cleaning.duration}h` : 'Probíhá'}
                </span>
              </div>
              <div className="client-info-item">
                <span className="client-info-label">Fotografií:</span>
                <span className="client-info-value">{cleaning.photos.length}</span>
              </div>
              <div className="client-info-item">
                <span className="client-info-label">Událostí:</span>
                <span className="client-info-value">{cleaning.events.length}</span>
              </div>
              <div className="client-info-item">
                <span className="client-info-label">Stav:</span>
                <span className={`client-badge client-badge-${cleaning.status}`}>
                  {cleaning.status}
                </span>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="client-section">
            <h3>Shrnutí</h3>
            <div className="client-cleaning-summary">
              {cleaning.summary && (
                <p className="client-summary-text">{cleaning.summary}</p>
              )}
              {cleaning.suppliesUsed && cleaning.suppliesUsed.length > 0 && (
                <div className="client-supplies-used">
                  <h4>Doplněné zásoby:</h4>
                  <ul>
                    {cleaning.suppliesUsed.map((supply: string, index: number) => (
                      <li key={index}>{supply}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Metadata for client pages
export const metadata = {
  title: 'Detail úklidu - CleanStay',
  robots: 'noindex, nofollow'
};




