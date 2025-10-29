'use client';

interface ClientCleaning {
  id: string;
  propertyName: string;
  date: string;
  status: string;
  duration?: number;
}

interface ClientRecentCleaningsProps {
  cleanings: ClientCleaning[];
}

// Client recent cleanings component
export function ClientRecentCleanings({ cleanings }: ClientRecentCleaningsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
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
    <div className="client-recent-cleanings">
      {cleanings.length === 0 ? (
        <div className="client-empty-state">
          <p>Žádné úklidy k zobrazení</p>
        </div>
      ) : (
        <div className="client-cleanings-table-container">
          <table className="client-cleanings-table" role="table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Objekt</th>
                <th>Stav</th>
                <th>Délka</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {cleanings.map((cleaning) => (
                <tr key={cleaning.id}>
                  <td>
                    <div className="client-cleaning-date">
                      <span className="client-cleaning-date-text">
                        {formatDate(cleaning.date)}
                      </span>
                      <span className="client-cleaning-time">
                        {formatTime(cleaning.date)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="client-cleaning-property">
                      {cleaning.propertyName}
                    </span>
                  </td>
                  <td>
                    <span className={`client-badge ${getStatusColor(cleaning.status)}`}>
                      {cleaning.status}
                    </span>
                  </td>
                  <td>
                    {cleaning.duration ? (
                      <span className="client-cleaning-duration">
                        {cleaning.duration}h
                      </span>
                    ) : (
                      <span className="client-cleaning-duration client-duration-ongoing">
                        Probíhá
                      </span>
                    )}
                  </td>
                  <td>
                    <a 
                      href={`/portal/cleanings/${cleaning.id}`}
                      className="client-button client-button-secondary client-button-sm"
                    >
                      Detail
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="client-cleanings-footer">
        <p className="client-cleanings-info">
          Zobrazuje posledních {cleanings.length} úklidů
        </p>
      </div>
    </div>
  );
}





