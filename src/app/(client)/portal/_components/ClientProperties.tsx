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
  lastCleaning: {
    id: string;
    date: string;
    status: string;
  } | null;
}

interface ClientPropertiesProps {
  properties: ClientProperty[];
}

// Client properties component
export function ClientProperties({ properties }: ClientPropertiesProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'client-status-completed';
      case 'in_progress':
        return 'client-status-in-progress';
      case 'scheduled':
        return 'client-status-scheduled';
      case 'cancelled':
        return 'client-status-cancelled';
      default:
        return 'client-status-default';
    }
  };

  return (
    <div className="client-properties">
      {properties.length === 0 ? (
        <div className="client-empty-state">
          <p>Žádné objekty k zobrazení</p>
        </div>
      ) : (
        <div className="client-properties-grid">
          {properties.map((property) => (
            <div key={property.id} className="client-property-card">
              <div className="client-property-header">
                <h3 className="client-property-name">{property.name}</h3>
                <span className="client-property-type">{property.type}</span>
              </div>
              
              {property.address && (
                <div className="client-property-address">
                  <span className="client-property-street">{property.address.street}</span>
                  <span className="client-property-city">{property.address.city}</span>
                </div>
              )}

              <div className="client-property-last-cleaning">
                {property.lastCleaning ? (
                  <div className="client-last-cleaning-info">
                    <span className="client-last-cleaning-label">Poslední úklid:</span>
                    <span className="client-last-cleaning-date">
                      {formatDate(property.lastCleaning.date)}
                    </span>
                    <span className={`client-badge ${getStatusColor(property.lastCleaning.status)}`}>
                      {property.lastCleaning.status}
                    </span>
                  </div>
                ) : (
                  <div className="client-no-cleaning">
                    <span className="client-no-cleaning-text">Žádný úklid</span>
                  </div>
                )}
              </div>

              <div className="client-property-actions">
                <a 
                  href={`/portal/properties/${property.id}`}
                  className="client-button client-button-primary"
                >
                  Zobrazit detail
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}





