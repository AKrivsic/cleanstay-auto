'use client';

interface ClientPropertySupply {
  name: string;
  date: string;
  quantity: number;
  unit: string;
}

interface ClientPropertySuppliesProps {
  supplies: ClientPropertySupply[];
}

// Client property supplies component
export function ClientPropertySupplies({ supplies }: ClientPropertySuppliesProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="client-property-supplies">
      {supplies.length === 0 ? (
        <div className="client-empty-state">
          <p>Žádné nedávné doplnění zásob</p>
        </div>
      ) : (
        <div className="client-supplies-list">
          {supplies.map((supply, index) => (
            <div key={index} className="client-supply-item">
              <div className="client-supply-header">
                <h4 className="client-supply-name">{supply.name}</h4>
                <span className="client-supply-date">
                  {formatDate(supply.date)} {formatTime(supply.date)}
                </span>
              </div>
              
              <div className="client-supply-details">
                <div className="client-supply-quantity">
                  <span className="client-supply-amount">
                    {supply.quantity} {supply.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="client-supplies-footer">
        <p className="client-supplies-info">
          Zobrazuje posledních {supplies.length} doplnění zásob
        </p>
      </div>
    </div>
  );
}





