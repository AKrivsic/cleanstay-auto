"use client";

import React, { useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import { exportToCSV, exportToJSON, exportToExcel, exportToPDF, formatDataForExport, exportMappings } from '@/lib/export';
import { colors, spacing, typography, borderRadius } from '@/lib/design-system';

interface ExportButtonProps {
  data: any[];
  dataType: 'users' | 'properties' | 'cleanings';
  filename?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function ExportButton({
  data,
  dataType,
  filename,
  disabled = false,
  variant = 'outline',
  size = 'md',
}: ExportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'json' | 'excel' | 'pdf') => {
    if (!data || data.length === 0) {
      alert('Žádná data k exportu');
      return;
    }

    setIsExporting(true);
    
    try {
      const mapping = exportMappings[dataType];
      const formattedData = formatDataForExport(data, mapping);
      
      const defaultFilename = `${dataType}_export_${new Date().toISOString().split('T')[0]}`;
      const finalFilename = filename || defaultFilename;

      switch (format) {
        case 'csv':
          exportToCSV(formattedData, { filename: `${finalFilename}.csv` });
          break;
        case 'json':
          exportToJSON(formattedData, { filename: `${finalFilename}.json` });
          break;
        case 'excel':
          exportToExcel(formattedData, { filename: `${finalFilename}.xlsx` });
          break;
        case 'pdf':
          exportToPDF(formattedData, { filename: `${finalFilename}.pdf` });
          break;
      }

      setShowModal(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Chyba při exportu dat');
    } finally {
      setIsExporting(false);
    }
  };

  const modalContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
    marginBottom: spacing[2],
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    margin: 0,
    marginBottom: spacing[4],
  };

  const formatGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[3],
  };

  const formatCardStyle: React.CSSProperties = {
    padding: spacing[4],
    border: `1px solid ${colors.border.light}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    backgroundColor: colors.background.primary,
  };

  const formatIconStyle: React.CSSProperties = {
    fontSize: '2rem',
    marginBottom: spacing[2],
  };

  const formatTitleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    margin: 0,
    marginBottom: spacing[1],
  };

  const formatDescriptionStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    margin: 0,
  };

  const dataInfoStyle: React.CSSProperties = {
    padding: spacing[3],
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  };

  const exportFormats = [
    {
      id: 'csv',
      name: 'CSV',
      description: 'Excel, Google Sheets',
      icon: '📊',
      color: colors.success[500],
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'Programátorské nástroje',
      icon: '🔧',
      color: colors.warning[500],
    },
    {
      id: 'excel',
      name: 'Excel',
      description: 'Microsoft Excel',
      icon: '📈',
      color: colors.primary[500],
    },
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Tisk, sdílení',
      icon: '📄',
      color: colors.error[500],
    },
  ];

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowModal(true)}
        disabled={disabled || data.length === 0}
        leftIcon="📥"
      >
        Export ({data.length})
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Export dat"
        size="md"
      >
        <div style={modalContentStyle}>
          <div>
            <h3 style={titleStyle}>Vyberte formát exportu</h3>
            <p style={descriptionStyle}>
              Data budou exportována v zvoleném formátu a stažena do vašeho počítače.
            </p>
          </div>

          <div style={dataInfoStyle}>
            <strong>Počet záznamů:</strong> {data.length}<br />
            <strong>Typ dat:</strong> {dataType}
          </div>

          <div style={formatGridStyle}>
            {exportFormats.map((format) => (
              <div
                key={format.id}
                style={formatCardStyle}
                onClick={() => handleExport(format.id as any)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = format.color;
                  e.currentTarget.style.backgroundColor = colors.gray[50];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border.light;
                  e.currentTarget.style.backgroundColor = colors.background.primary;
                }}
              >
                <div style={{ ...formatIconStyle, color: format.color }}>
                  {format.icon}
                </div>
                <h4 style={formatTitleStyle}>{format.name}</h4>
                <p style={formatDescriptionStyle}>{format.description}</p>
              </div>
            ))}
          </div>

          {isExporting && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              padding: spacing[4],
              backgroundColor: colors.primary[50],
              borderRadius: borderRadius.md,
              color: colors.primary[700],
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: `2px solid ${colors.primary[300]}`,
                borderTop: `2px solid ${colors.primary[700]}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              Exportuji data...
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
