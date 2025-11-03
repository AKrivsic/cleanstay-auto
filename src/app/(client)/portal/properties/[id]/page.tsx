import { Suspense } from 'react';
import { getClientPropertyDetail } from '../../_data';
import { ClientPropertyCleanings } from './_components/ClientPropertyCleanings';
import { ClientPropertySupplies } from './_components/ClientPropertySupplies';
import { ClientPropertyHeader } from './_components/ClientPropertyHeader';

interface ClientPropertyDetailPageProps {
  params: {
    id: string;
  };
}

// Client property detail page
export default async function ClientPropertyDetailPage({ params }: ClientPropertyDetailPageProps) {
  const clientId = 'test-client-123'; // TODO: Get from auth context
  const propertyId = params.id;

  const property = await getClientPropertyDetail(clientId, propertyId);

  if (!property) {
    return (
      <div className="client-portal">
        <div className="client-error">
          <h1>Objekt nenalezen</h1>
          <p>Požadovaný objekt neexistuje nebo nemáte oprávnění k jeho zobrazení.</p>
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
          <span className="client-breadcrumb-current">Detail objektu</span>
        </div>
        <h1>{property.name}</h1>
      </div>

      <div className="client-content">
        <div className="client-main">
          {/* Property Header */}
          <section className="client-section">
            <Suspense fallback={<div className="client-loading">Načítání...</div>}>
              <ClientPropertyHeader property={property} />
            </Suspense>
          </section>

          {/* Recent Cleanings */}
          <section className="client-section">
            <h3>Historie úklidů</h3>
            <Suspense fallback={<div className="client-loading">Načítání úklidů...</div>}>
              <ClientPropertyCleanings 
                cleanings={property.recentCleanings}
                propertyId={propertyId}
              />
            </Suspense>
          </section>

          {/* Next Cleaning */}
          {property.nextCleaning && (
            <section className="client-section">
              <h3>Další plánovaný úklid</h3>
              <div className="client-next-cleaning">
                <div className="client-next-cleaning-info">
                  <span className="client-next-cleaning-date">
                    {new Date(property.nextCleaning.scheduled_start).toLocaleDateString()}
                  </span>
                  <span className="client-next-cleaning-time">
                    {new Date(property.nextCleaning.scheduled_start).toLocaleTimeString()}
                  </span>
                </div>
                <div className="client-next-cleaning-status">
                  <span className={`client-badge client-badge-${property.nextCleaning.status}`}>
                    {property.nextCleaning.status}
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="client-sidebar">
          {/* Property Info */}
          <section className="client-section">
            <h3>Informace o objektu</h3>
            <div className="client-property-info">
              <div className="client-info-item">
                <span className="client-info-label">Typ:</span>
                <span className="client-info-value">{property.type}</span>
              </div>
              {property.address && (
                <div className="client-info-item">
                  <span className="client-info-label">Adresa:</span>
                  <span className="client-info-value">
                    {property.address.street}, {property.address.city}
                  </span>
                </div>
              )}
              <div className="client-info-item">
                <span className="client-info-label">Celkem úklidů:</span>
                <span className="client-info-value">{property.totalCleanings}</span>
              </div>
              <div className="client-info-item">
                <span className="client-info-label">Tento měsíc:</span>
                <span className="client-info-value">{property.monthlyCleanings}</span>
              </div>
            </div>
          </section>

          {/* Recent Supplies */}
          <section className="client-section">
            <h3>Co se doplnilo naposledy</h3>
            <Suspense fallback={<div className="client-loading">Načítání zásob...</div>}>
              <ClientPropertySupplies supplies={property.recentSupplies} />
            </Suspense>
          </section>

          {/* Quick Stats */}
          <section className="client-section">
            <h3>Statistiky</h3>
            <div className="client-property-stats">
              <div className="client-stat">
                <span className="client-stat-label">Průměrná délka:</span>
                <span className="client-stat-value">{property.avgDuration}h</span>
              </div>
              <div className="client-stat">
                <span className="client-stat-label">Poslední úklid:</span>
                <span className="client-stat-value">
                  {property.lastCleaning ? new Date(property.lastCleaning).toLocaleDateString() : 'Žádný'}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Metadata for client pages
export const metadata = {
  title: 'Detail objektu - CleanStay',
  robots: 'noindex, nofollow'
};




