'use client';

interface ClientCleaning {
  id: string;
  propertyName: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string | null;
  duration?: number;
}

interface ClientCleaningHeaderProps {
  cleaning: ClientCleaning;
}

// Client cleaning header component
export function ClientCleaningHeader({ cleaning }: ClientCleaningHeaderProps) {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
    <div className="client-cleaning-header">
      <div className="client-cleaning-info">
        <h2 className="client-cleaning-property">{cleaning.propertyName}</h2>
        
        <div className="client-cleaning-meta">
          <div className="client-meta-item">
            <span className="client-meta-label">Čas:</span>
            <span className="client-meta-value">
              {formatDateTime(cleaning.scheduled_start)}
              {cleaning.scheduled_end && (
                <span className="client-meta-separator"> - </span>
              )}
              {cleaning.scheduled_end && formatDateTime(cleaning.scheduled_end)}
              {!cleaning.scheduled_end && (
                <span className="client-meta-ongoing"> (probíhá)</span>
              )}
            </span>
          </div>
          
          <div className="client-meta-item">
            <span className="client-meta-label">Délka:</span>
            <span className="client-meta-value">
              {cleaning.duration ? `${cleaning.duration}h` : 'Probíhá'}
            </span>
          </div>
          
          <div className="client-meta-item">
            <span className="client-meta-label">Stav:</span>
            <span className={`client-badge ${getStatusColor(cleaning.status)}`}>
              {cleaning.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}





