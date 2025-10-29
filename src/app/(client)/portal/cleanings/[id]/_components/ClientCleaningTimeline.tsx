'use client';

interface ClientCleaningEvent {
  id: string;
  type: string;
  start: string;
  note: string | null;
  phase?: string;
}

interface ClientCleaningTimelineProps {
  events: ClientCleaningEvent[];
}

// Client cleaning timeline component
export function ClientCleaningTimeline({ events }: ClientCleaningTimelineProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'cleaning_start':
        return '🏁';
      case 'note':
        return '📝';
      case 'supply_out':
        return '📦';
      case 'linen_used':
        return '🛏️';
      case 'photo':
        return '📸';
      case 'done':
        return '✅';
      default:
        return '📋';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'cleaning_start':
        return 'client-timeline-start';
      case 'note':
        return 'client-timeline-note';
      case 'supply_out':
        return 'client-timeline-supply';
      case 'linen_used':
        return 'client-timeline-linen';
      case 'photo':
        return 'client-timeline-photo';
      case 'done':
        return 'client-timeline-done';
      default:
        return 'client-timeline-default';
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'cleaning_start':
        return 'Začátek úklidu';
      case 'note':
        return 'Poznámka';
      case 'supply_out':
        return 'Doplnění zásob';
      case 'linen_used':
        return 'Výměna prádla';
      case 'photo':
        return 'Fotografie';
      case 'done':
        return 'Dokončeno';
      default:
        return 'Událost';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="client-timeline">
      {events.length === 0 ? (
        <div className="client-timeline-empty">
          <p>Žádné události k zobrazení</p>
        </div>
      ) : (
        <div className="client-timeline-events">
          {events.map((event, index) => (
            <div key={event.id} className={`client-timeline-item ${getEventColor(event.type)}`}>
              <div className="client-timeline-marker">
                <span className="client-timeline-icon">
                  {getEventIcon(event.type)}
                </span>
              </div>
              
              <div className="client-timeline-content">
                <div className="client-timeline-header">
                  <span className="client-timeline-time">
                    {formatTime(event.start)}
                  </span>
                  <span className="client-timeline-type">
                    {getEventLabel(event.type)}
                  </span>
                  {event.phase && (
                    <span className={`client-badge client-badge-${event.phase}`}>
                      {event.phase}
                    </span>
                  )}
                </div>

                {event.note && (
                  <div className="client-timeline-note">
                    {event.note}
                  </div>
                )}
              </div>

              {index < events.length - 1 && (
                <div className="client-timeline-line"></div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="client-timeline-footer">
        <p className="client-timeline-info">
          Celkem {events.length} událostí
        </p>
      </div>
    </div>
  );
}





