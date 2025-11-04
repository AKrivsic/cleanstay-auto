'use client';

interface ClientProperty {
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
}

interface ClientPropertyHeaderProps {
  property: ClientProperty;
}

// Client property header component
export function ClientPropertyHeader({ property }: ClientPropertyHeaderProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="client-property-header">
      <div className="client-property-info">
        <h2 className="client-property-name">{property.name}</h2>
        
        <div className="client-property-meta">
          <div className="client-meta-item">
            <span className="client-meta-label">Typ:</span>
            <span className="client-meta-value">{property.type}</span>
          </div>
          
          {property.address && (
            <div className="client-meta-item">
              <span className="client-meta-label">Adresa:</span>
              <span className="client-meta-value">
                {property.address.street}, {property.address.city}
              </span>
            </div>
          )}
          
          <div className="client-meta-item">
            <span className="client-meta-label">Celkem úklidů:</span>
            <span className="client-meta-value">{property.totalCleanings}</span>
          </div>
          
          <div className="client-meta-item">
            <span className="client-meta-label">Tento měsíc:</span>
            <span className="client-meta-value">{property.monthlyCleanings}</span>
          </div>
          
          <div className="client-meta-item">
            <span className="client-meta-label">Průměrná délka:</span>
            <span className="client-meta-value">{property.avgDuration}h</span>
          </div>
          
          <div className="client-meta-item">
            <span className="client-meta-label">Poslední úklid:</span>
            <span className="client-meta-value">
              {property.lastCleaning ? formatDate(property.lastCleaning) : 'Žádný'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}





