'use client';

import { useState } from 'react';

interface ClientPropertyCleaning {
  id: string;
  scheduled_start: string;
  status: string;
  duration?: number;
}

interface ClientPropertyCleaningsProps {
  cleanings: ClientPropertyCleaning[];
  propertyId: string;
}

// Client property cleanings component
export function ClientPropertyCleanings({ cleanings, propertyId }: ClientPropertyCleaningsProps) {
  const [filter, setFilter] = useState<'week' | 'month' | 'custom'>('month');

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

  const getFilteredCleanings = () => {
    const now = new Date();
    const filterDate = new Date();

    switch (filter) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'custom':
        // For custom filter, show all (would need date picker in real implementation)
        return cleanings;
      default:
        return cleanings;
    }

    return cleanings.filter(cleaning => 
      new Date(cleaning.scheduled_start) >= filterDate
    );
  };

  const filteredCleanings = getFilteredCleanings();

  return (
    <div className="client-property-cleanings">
      <div className="client-cleanings-header">
        <h3>Historie úklidů</h3>
        <div className="client-cleanings-filters">
          <select 
            className="client-filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'week' | 'month' | 'custom')}
          >
            <option value="week">Týden</option>
            <option value="month">Měsíc</option>
            <option value="custom">Vlastní</option>
          </select>
        </div>
      </div>

      {filteredCleanings.length === 0 ? (
        <div className="client-empty-state">
          <p>Žádné úklidy v zvoleném období</p>
        </div>
      ) : (
        <div className="client-cleanings-list">
          {filteredCleanings.map((cleaning) => (
            <div key={cleaning.id} className="client-cleaning-item">
              <div className="client-cleaning-header">
                <div className="client-cleaning-date">
                  <span className="client-cleaning-date-text">
                    {formatDate(cleaning.scheduled_start)}
                  </span>
                  <span className="client-cleaning-time">
                    {formatTime(cleaning.scheduled_start)}
                  </span>
                </div>
                <span className={`client-status-badge ${getStatusColor(cleaning.status)}`}>
                  {cleaning.status}
                </span>
              </div>
              
              <div className="client-cleaning-details">
                <div className="client-cleaning-duration">
                  {cleaning.duration ? (
                    <span className="client-duration-value">
                      {cleaning.duration}h
                    </span>
                  ) : (
                    <span className="client-duration-ongoing">
                      Probíhá
                    </span>
                  )}
                </div>
              </div>

              <div className="client-cleaning-actions">
                <a 
                  href={`/portal/cleanings/${cleaning.id}`}
                  className="client-button client-button-secondary client-button-sm"
                >
                  Zobrazit detail
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="client-cleanings-footer">
        <p className="client-cleanings-info">
          Zobrazuje {filteredCleanings.length} úklidů z {cleanings.length} celkem
        </p>
      </div>
    </div>
  );
}





