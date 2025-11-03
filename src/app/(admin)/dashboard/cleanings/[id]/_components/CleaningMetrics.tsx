'use client';

interface CleaningMetricsProps {
  cleaning: {
    id: string;
    status: string;
    scheduled_start: string;
    scheduled_end: string | null;
    events: Array<{
      type: string;
      start: string;
    }>;
    photos: Array<{
      eventId: string;
      phase: string;
      timestamp: string;
    }>;
  };
}

// Metrics component for cleaning details
export function CleaningMetrics({ cleaning }: CleaningMetricsProps) {
  const calculateDuration = () => {
    const start = new Date(cleaning.scheduled_start);
    const end = cleaning.scheduled_end ? new Date(cleaning.scheduled_end) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return Math.round(durationHours * 10) / 10; // Round to 1 decimal
  };

  const getPhotoCountByPhase = () => {
    const phases = cleaning.photos.reduce((acc, photo) => {
      acc[photo.phase] = (acc[photo.phase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return phases;
  };

  const getEventCountByType = () => {
    const types = cleaning.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return types;
  };

  const duration = calculateDuration();
  const photoCounts = getPhotoCountByPhase();
  const eventCounts = getEventCountByType();

  return (
    <div className="admin-metrics">
      <div className="admin-metrics-section">
        <h4>Délka úklidu</h4>
        <div className="admin-metric-item">
          <span className="admin-metric-label">Celková délka:</span>
          <span className="admin-metric-value">{duration}h</span>
        </div>
        <div className="admin-metric-item">
          <span className="admin-metric-label">Stav:</span>
          <span className={`admin-badge admin-badge-${cleaning.status}`}>
            {cleaning.status}
          </span>
        </div>
      </div>

      <div className="admin-metrics-section">
        <h4>Fotografie</h4>
        <div className="admin-metric-item">
          <span className="admin-metric-label">Celkem:</span>
          <span className="admin-metric-value">{cleaning.photos.length}</span>
        </div>
        {Object.entries(photoCounts).map(([phase, count]) => (
          <div key={phase} className="admin-metric-item">
            <span className="admin-metric-label">{phase}:</span>
            <span className="admin-metric-value">{count}</span>
          </div>
        ))}
      </div>

      <div className="admin-metrics-section">
        <h4>Události</h4>
        <div className="admin-metric-item">
          <span className="admin-metric-label">Celkem:</span>
          <span className="admin-metric-value">{cleaning.events.length}</span>
        </div>
        {Object.entries(eventCounts).map(([type, count]) => (
          <div key={type} className="admin-metric-item">
            <span className="admin-metric-label">{type}:</span>
            <span className="admin-metric-value">{count}</span>
          </div>
        ))}
      </div>

      <div className="admin-metrics-section">
        <h4>Časové údaje</h4>
        <div className="admin-metric-item">
          <span className="admin-metric-label">Začátek:</span>
          <span className="admin-metric-value">
            {new Date(cleaning.scheduled_start).toLocaleTimeString()}
          </span>
        </div>
        {cleaning.scheduled_end && (
          <div className="admin-metric-item">
            <span className="admin-metric-label">Konec:</span>
            <span className="admin-metric-value">
              {new Date(cleaning.scheduled_end).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}





