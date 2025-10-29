'use client';

interface PropertySupply {
  name: string;
  current: number;
  min: number;
  max: number;
  unit: string;
}

interface PropertySuppliesProps {
  supplies: PropertySupply[];
}

// Property supplies component
export function PropertySupplies({ supplies }: PropertySuppliesProps) {
  const getSupplyStatus = (current: number, min: number, max: number) => {
    if (current <= min) {
      return { status: 'low', color: 'admin-supply-low', text: 'Nízké' };
    } else if (current >= max) {
      return { status: 'high', color: 'admin-supply-high', text: 'Vysoké' };
    } else {
      return { status: 'normal', color: 'admin-supply-normal', text: 'Normální' };
    }
  };

  const getSupplyPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  return (
    <div className="admin-property-supplies">
      {supplies.length === 0 ? (
        <div className="admin-empty-state">
          <p>Žádné zásoby k zobrazení</p>
        </div>
      ) : (
        <div className="admin-supplies-list">
          {supplies.map((supply, index) => {
            const status = getSupplyStatus(supply.current, supply.min, supply.max);
            const percentage = getSupplyPercentage(supply.current, supply.max);

            return (
              <div key={index} className="admin-supply-item">
                <div className="admin-supply-header">
                  <h4 className="admin-supply-name">{supply.name}</h4>
                  <span className={`admin-supply-status ${status.color}`}>
                    {status.text}
                  </span>
                </div>

                <div className="admin-supply-details">
                  <div className="admin-supply-quantity">
                    <span className="admin-supply-current">
                      {supply.current} {supply.unit}
                    </span>
                    <span className="admin-supply-range">
                      ({supply.min} - {supply.max} {supply.unit})
                    </span>
                  </div>

                  <div className="admin-supply-bar">
                    <div 
                      className={`admin-supply-progress ${status.color}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>

                  <div className="admin-supply-info">
                    <span className="admin-supply-percentage">
                      {percentage}%
                    </span>
                    <span className="admin-supply-status-text">
                      {status.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="admin-supplies-footer">
        <p className="admin-supplies-info">
          Celkem {supplies.length} položek zásob
        </p>
      </div>
    </div>
  );
}





