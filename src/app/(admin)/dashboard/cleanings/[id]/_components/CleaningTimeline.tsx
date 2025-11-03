'use client';

import { useState } from 'react';
import { PhotoModal, usePhotoModal } from './PhotoModal';

interface CleaningEvent {
  id: string;
  type: string;
  start: string;
  note: string | null;
  phase?: string;
  width?: number;
  height?: number;
}

interface CleaningTimelineProps {
  events: CleaningEvent[];
}

// Timeline component for cleaning events
export function CleaningTimeline({ events }: CleaningTimelineProps) {
  const { isOpen, eventId, openModal, closeModal } = usePhotoModal();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'cleaning_start':
        return '🏁';
      case 'note':
        return '📝';
      case 'supply_out':
        return '📦';
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
        return 'admin-timeline-start';
      case 'note':
        return 'admin-timeline-note';
      case 'supply_out':
        return 'admin-timeline-supply';
      case 'photo':
        return 'admin-timeline-photo';
      case 'done':
        return 'admin-timeline-done';
      default:
        return 'admin-timeline-default';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handlePhotoClick = (eventId: string) => {
    openModal(eventId);
  };

  return (
    <div className="admin-timeline">
      <PhotoModal 
        isOpen={isOpen}
        eventId={eventId}
        onClose={closeModal}
      />

      {events.length === 0 ? (
        <div className="admin-timeline-empty">
          <p>Žádné události k zobrazení</p>
        </div>
      ) : (
        <div className="admin-timeline-events">
          {events.map((event, index) => (
            <div key={event.id} className={`admin-timeline-item ${getEventColor(event.type)}`}>
              <div className="admin-timeline-marker">
                <span className="admin-timeline-icon">
                  {getEventIcon(event.type)}
                </span>
              </div>
              
              <div className="admin-timeline-content">
                <div className="admin-timeline-header">
                  <span className="admin-timeline-time">
                    {formatTime(event.start)}
                  </span>
                  <span className="admin-timeline-type">
                    {event.type}
                  </span>
                  {event.phase && (
                    <span className={`admin-badge admin-badge-${event.phase}`}>
                      {event.phase}
                    </span>
                  )}
                </div>

                {event.note && (
                  <div className="admin-timeline-note">
                    {event.note}
                  </div>
                )}

                {event.type === 'photo' && (
                  <div className="admin-timeline-photo">
                    <button 
                      className="admin-timeline-photo-button"
                      onClick={() => handlePhotoClick(event.id)}
                      aria-label="Zobrazit fotografii"
                    >
                      <span className="admin-timeline-photo-icon">📸</span>
                      <span className="admin-timeline-photo-text">
                        Zobrazit fotografii
                        {event.width && event.height && (
                          <span className="admin-timeline-photo-size">
                            ({event.width}×{event.height})
                          </span>
                        )}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {index < events.length - 1 && (
                <div className="admin-timeline-line"></div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="admin-timeline-footer">
        <p className="admin-timeline-info">
          Celkem {events.length} událostí
        </p>
      </div>
    </div>
  );
}





