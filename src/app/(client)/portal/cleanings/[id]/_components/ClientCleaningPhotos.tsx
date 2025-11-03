'use client';

import { useState } from 'react';
import { getSignedPhotoUrls } from '@/lib/media/getSignedPhotoUrls';

interface ClientCleaningPhoto {
  eventId: string;
  thumbUrl: string;
  mainUrl: string;
  phase: string;
  timestamp: string;
  width: number;
  height: number;
}

interface ClientCleaningPhotosProps {
  photos: ClientCleaningPhoto[];
}

// Client cleaning photos component
export function ClientCleaningPhotos({ photos }: ClientCleaningPhotosProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ClientCleaningPhoto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handlePhotoClick = async (photo: ClientCleaningPhoto) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
    setIsLoading(true);
    setError('');

    try {
      // Generate fresh signed URL for main image
      const photoUrls = await getSignedPhotoUrls({
        eventIds: [photo.eventId],
        tenantId: 'test-client-123' // TODO: Get from context
      });

      if (photoUrls.length > 0 && photoUrls[0].mainUrl) {
        setSelectedPhoto({
          ...photo,
          mainUrl: photoUrls[0].mainUrl
        });
      } else {
        setError('Nepodařilo se načíst fotografii');
      }
    } catch (err) {
      console.error('Error loading photo:', err);
      setError('Chyba při načítání fotografie');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCloseModal();
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'before':
        return 'Před úklidem';
      case 'after':
        return 'Po úklidu';
      case 'other':
        return 'Během úklidu';
      default:
        return 'Fotografie';
    }
  };

  return (
    <div className="client-cleaning-photos">
      {photos.length === 0 ? (
        <div className="client-empty-state">
          <p>Žádné fotografie k zobrazení</p>
        </div>
      ) : (
        <div className="client-photos-grid">
          {photos.map((photo) => (
            <div key={photo.eventId} className="client-photo-item">
              <img 
                src={photo.thumbUrl} 
                alt={`Foto z ${getPhaseLabel(photo.phase)}`}
                className="client-photo-thumb"
                onClick={() => handlePhotoClick(photo)}
                loading="lazy"
              />
              <div className="client-photo-info">
                <span className={`client-badge client-badge-${photo.phase}`}>
                  {getPhaseLabel(photo.phase)}
                </span>
                <span className="client-photo-time">
                  {formatDate(photo.timestamp)} {formatTime(photo.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      {isModalOpen && selectedPhoto && (
        <div 
          className="client-photo-modal-overlay"
          onClick={handleCloseModal}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Zobrazení fotografie"
        >
          <div 
            className="client-photo-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="client-photo-modal-header">
              <h3>Fotografie</h3>
              <button 
                className="client-photo-modal-close"
                onClick={handleCloseModal}
                aria-label="Zavřít"
              >
                ×
              </button>
            </div>

            <div className="client-photo-modal-body">
              {isLoading && (
                <div className="client-photo-modal-loading">
                  <div className="client-loading-spinner"></div>
                  <p>Načítání fotografie...</p>
                </div>
              )}

              {error && (
                <div className="client-photo-modal-error">
                  <p>{error}</p>
                  <button 
                    className="client-button client-button-primary"
                    onClick={() => handlePhotoClick(selectedPhoto)}
                  >
                    Zkusit znovu
                  </button>
                </div>
              )}

              {selectedPhoto.mainUrl && !isLoading && !error && (
                <div className="client-photo-modal-image-container">
                  <img 
                    src={selectedPhoto.mainUrl} 
                    alt={`Foto z ${getPhaseLabel(selectedPhoto.phase)}`}
                    className="client-photo-modal-image"
                    onError={() => setError('Chyba při načítání obrázku')}
                  />
                </div>
              )}
            </div>

            <div className="client-photo-modal-footer">
              <div className="client-photo-modal-meta">
                <span className="client-photo-modal-phase">
                  {getPhaseLabel(selectedPhoto.phase)}
                </span>
                <span className="client-photo-modal-timestamp">
                  {formatDate(selectedPhoto.timestamp)} {formatTime(selectedPhoto.timestamp)}
                </span>
              </div>
              <p className="client-photo-modal-info">
                Fotografie se automaticky obnoví za 48 hodin
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





