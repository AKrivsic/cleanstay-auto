'use client';

import { useState, useEffect } from 'react';
import { getSignedPhotoUrls } from '@/lib/media/getSignedPhotoUrls';

interface PhotoModalProps {
  eventId?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

// Photo modal component for viewing full-size images
export function PhotoModal({ eventId, isOpen = false, onClose }: PhotoModalProps) {
  const [mainUrl, setMainUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && eventId) {
      loadPhoto();
    }
  }, [isOpen, eventId]);

  const loadPhoto = async () => {
    if (!eventId) return;

    setIsLoading(true);
    setError('');

    try {
      // Generate signed URL for the photo
      const photoUrls = await getSignedPhotoUrls({
        eventIds: [eventId],
        tenantId: 'test-tenant-123' // TODO: Get from context
      });

      if (photoUrls.length > 0 && photoUrls[0].mainUrl) {
        setMainUrl(photoUrls[0].mainUrl);
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

  const handleClose = () => {
    setMainUrl('');
    setError('');
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="admin-photo-modal-overlay"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Zobrazení fotografie"
    >
      <div 
        className="admin-photo-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-photo-modal-header">
          <h3>Fotografie</h3>
          <button 
            className="admin-photo-modal-close"
            onClick={handleClose}
            aria-label="Zavřít"
          >
            ×
          </button>
        </div>

        <div className="admin-photo-modal-body">
          {isLoading && (
            <div className="admin-photo-modal-loading">
              <div className="admin-loading-spinner"></div>
              <p>Načítání fotografie...</p>
            </div>
          )}

          {error && (
            <div className="admin-photo-modal-error">
              <p>{error}</p>
              <button 
                className="admin-button admin-button-primary"
                onClick={loadPhoto}
              >
                Zkusit znovu
              </button>
            </div>
          )}

          {mainUrl && !isLoading && !error && (
            <div className="admin-photo-modal-image-container">
              <img 
                src={mainUrl} 
                alt="Fotografie z úklidu"
                className="admin-photo-modal-image"
                onError={() => setError('Chyba při načítání obrázku')}
              />
            </div>
          )}
        </div>

        <div className="admin-photo-modal-footer">
          <p className="admin-photo-modal-info">
            Fotografie se automaticky obnoví za 48 hodin
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook for managing photo modal state
export function usePhotoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [eventId, setEventId] = useState<string>('');

  const openModal = (id: string) => {
    setEventId(id);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEventId('');
  };

  return {
    isOpen,
    eventId,
    openModal,
    closeModal
  };
}





