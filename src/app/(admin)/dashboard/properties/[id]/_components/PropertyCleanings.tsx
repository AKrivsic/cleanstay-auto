'use client';

interface PropertyCleaning {
  id: string;
  scheduled_start: string;
  status: string;
  cleaner_name: string | null;
}

interface PropertyCleaningsProps {
  cleanings: PropertyCleaning[];
}

// Property cleanings component
export function PropertyCleanings({ cleanings }: PropertyCleaningsProps) {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'admin-status-completed';
      case 'in_progress':
        return 'admin-status-in-progress';
      case 'scheduled':
        return 'admin-status-scheduled';
      case 'cancelled':
        return 'admin-status-cancelled';
      default:
        return 'admin-status-default';
    }
  };

  return (
    <div className="admin-property-cleanings">
      {cleanings.length === 0 ? (
        <div className="admin-empty-state">
          <p>Žádné úklidy k zobrazení</p>
        </div>
      ) : (
        <div className="admin-cleanings-list">
          {cleanings.map((cleaning) => (
            <div key={cleaning.id} className="admin-cleaning-item">
              <div className="admin-cleaning-header">
                <div className="admin-cleaning-date">
                  <span className="admin-cleaning-date-text">
                    {formatDate(cleaning.scheduled_start)}
                  </span>
                  <span className="admin-cleaning-time">
                    {formatTime(cleaning.scheduled_start)}
                  </span>
                </div>
                <span className={`admin-status-badge ${getStatusColor(cleaning.status)}`}>
                  {cleaning.status}
                </span>
              </div>
              
              <div className="admin-cleaning-details">
                <div className="admin-cleaning-cleaner">
                  <span className="admin-cleaning-label">Uklízečka:</span>
                  <span className="admin-cleaning-value">
                    {cleaning.cleaner_name || 'Nepřiřazeno'}
                  </span>
                </div>
              </div>

              <div className="admin-cleaning-actions">
                <a 
                  href={`/admin/dashboard/cleanings/${cleaning.id}`}
                  className="admin-button admin-button-secondary admin-button-sm"
                >
                  Zobrazit detail
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="admin-cleanings-footer">
        <p className="admin-cleanings-info">
          Zobrazuje posledních {cleanings.length} úklidů
        </p>
      </div>
    </div>
  );
}





