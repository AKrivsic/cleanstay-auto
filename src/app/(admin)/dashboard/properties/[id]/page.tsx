import { Suspense } from 'react';
import { getPropertyDetail } from '../../_data';
import { PropertyCleanings } from './_components/PropertyCleanings';
import { PropertySupplies } from './_components/PropertySupplies';
import { PropertyNotes } from './_components/PropertyNotes';
import InventorySection from './_components/InventorySection';

interface PropertyDetailPageProps {
  params: {
    id: string;
  };
}

// Admin property detail page
export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const tenantId = 'test-tenant-123'; // TODO: Get from auth context
  const propertyId = params.id;

  const property = await getPropertyDetail(tenantId, propertyId);

  if (!property) {
    return (
      <div className="admin-dashboard">
        <div className="admin-error">
          <h1>Byt nenalezen</h1>
          <p>Požadovaný byt neexistuje nebo nemáte oprávnění k jeho zobrazení.</p>
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
          <span className="admin-breadcrumb-current">Detail bytu</span>
        </div>
        <h1>{property.name}</h1>
      </div>

      <div className="admin-content">
        <div className="admin-main">
          {/* Property Info */}
          <section className="admin-section admin-property-header">
            <div className="admin-property-info">
              <h2>{property.name}</h2>
              <div className="admin-property-meta">
                <div className="admin-meta-item">
                  <span className="admin-meta-label">Typ:</span>
                  <span className="admin-meta-value">{property.type}</span>
                </div>
                {property.address && (
                  <div className="admin-meta-item">
                    <span className="admin-meta-label">Adresa:</span>
                    <span className="admin-meta-value">
                      {property.address.street}, {property.address.city}
                    </span>
                  </div>
                )}
                <div className="admin-meta-item">
                  <span className="admin-meta-label">Celkem úklidů:</span>
                  <span className="admin-meta-value">{property.totalCleanings}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Cleanings */}
          <section className="admin-section">
            <h3>Poslední úklidy</h3>
            <Suspense fallback={<div className="admin-loading">Načítání úklidů...</div>}>
              <PropertyCleanings cleanings={property.recentCleanings} />
            </Suspense>
          </section>

          {/* Notes */}
          <section className="admin-section">
            <h3>Poznámky</h3>
            <Suspense fallback={<div className="admin-loading">Načítání poznámek...</div>}>
              <PropertyNotes notes={property.notes} />
            </Suspense>
          </section>

          {/* Inventory */}
          <section className="admin-section">
            <InventorySection propertyId={propertyId} />
          </section>
        </div>

        <div className="admin-sidebar">
          {/* Supplies */}
          <section className="admin-section">
            <h3>Zásoby</h3>
            <Suspense fallback={<div className="admin-loading">Načítání zásob...</div>}>
              <PropertySupplies supplies={property.supplies} />
            </Suspense>
          </section>

          {/* Quick Stats */}
          <section className="admin-section">
            <h3>Rychlé statistiky</h3>
            <div className="admin-stats">
              <div className="admin-stat">
                <span className="admin-stat-label">Tento měsíc:</span>
                <span className="admin-stat-value">{property.monthlyCleanings}</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-label">Průměrná délka:</span>
                <span className="admin-stat-value">{property.avgDuration}h</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-label">Poslední úklid:</span>
                <span className="admin-stat-value">
                  {property.lastCleaning ? new Date(property.lastCleaning).toLocaleDateString() : 'Nikdy'}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Metadata for admin pages
export const metadata = {
  title: 'Detail bytu - CleanStay Admin',
  robots: 'noindex, nofollow'
};
