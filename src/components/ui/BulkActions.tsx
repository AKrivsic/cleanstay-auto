"use client";

import React, { useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { colors, spacing, typography, borderRadius } from '@/lib/design-system';

interface BulkActionsProps {
  selectedItems: string[];
  totalItems: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkExport: (ids: string[]) => void;
  onBulkUpdate?: (ids: string[], updates: any) => Promise<void>;
  itemType: string; // 'users', 'properties', 'cleanings'
  disabled?: boolean;
}

export function BulkActions({
  selectedItems,
  totalItems,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  onBulkUpdate,
  itemType,
  disabled = false,
}: BulkActionsProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedCount = selectedItems.length;
  const isAllSelected = selectedCount === totalItems && totalItems > 0;
  const hasSelection = selectedCount > 0;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    setIsProcessing(true);
    try {
      await onBulkDelete(selectedItems);
      setShowDeleteModal(false);
      onClearSelection();
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Chyba při mazání položek');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedItems.length === 0) return;
    onBulkExport(selectedItems);
  };

  const getItemTypeLabel = (type: string) => {
    const labels = {
      users: 'uživatelů',
      properties: 'nemovitostí',
      cleanings: 'úklidů',
    };
    return labels[type as keyof typeof labels] || 'položek';
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    backgroundColor: hasSelection ? colors.primary[50] : colors.background.primary,
    border: `1px solid ${hasSelection ? colors.primary[200] : colors.border.light}`,
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
    transition: 'all 0.2s ease-in-out',
  };

  const leftSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
  };

  const rightSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  };

  const checkboxStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: hasSelection ? colors.primary[700] : colors.text.secondary,
    cursor: 'pointer',
    userSelect: 'none',
  };

  const countStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  };

  const deleteModalContentStyle: React.CSSProperties = {
    textAlign: 'center',
  };

  const warningIconStyle: React.CSSProperties = {
    fontSize: '3rem',
    color: colors.error[500],
    marginBottom: spacing[4],
  };

  const warningTitleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
    marginBottom: spacing[2],
  };

  const warningTextStyle: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    margin: 0,
    marginBottom: spacing[6],
    lineHeight: typography.lineHeight.relaxed,
  };

  const selectedItemsStyle: React.CSSProperties = {
    backgroundColor: colors.error[50],
    border: `1px solid ${colors.error[200]}`,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[4],
  };

  const selectedItemsTitleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.error[700],
    margin: 0,
    marginBottom: spacing[2],
  };

  const selectedItemsListStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.error[600],
    margin: 0,
    maxHeight: '100px',
    overflowY: 'auto',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing[3],
    justifyContent: 'center',
  };

  if (!hasSelection && !disabled) {
    return (
      <div style={containerStyle}>
        <div style={leftSectionStyle}>
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={handleSelectAll}
            style={checkboxStyle}
            disabled={disabled || totalItems === 0}
          />
          <label style={labelStyle} onClick={handleSelectAll}>
            {isAllSelected ? 'Zrušit výběr všech' : 'Vybrat všechny'}
          </label>
          <span style={countStyle}>
            ({totalItems} {getItemTypeLabel(itemType)})
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={containerStyle}>
        <div style={leftSectionStyle}>
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={handleSelectAll}
            style={checkboxStyle}
            disabled={disabled}
          />
          <label style={labelStyle} onClick={handleSelectAll}>
            {isAllSelected ? 'Zrušit výběr všech' : 'Vybrat všechny'}
          </label>
          <Badge variant="primary">
            {selectedCount} vybráno
          </Badge>
        </div>

        <div style={rightSectionStyle}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkExport}
            disabled={disabled || selectedCount === 0}
            leftIcon="📥"
          >
            Export
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={disabled || selectedCount === 0}
          >
            Zrušit výběr
          </Button>
          
          <Button
            variant="error"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            disabled={disabled || selectedCount === 0}
            leftIcon="🗑️"
          >
            Smazat ({selectedCount})
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Hromadné mazání"
        size="md"
      >
        <div style={deleteModalContentStyle}>
          <div style={warningIconStyle}>⚠️</div>
          <h3 style={warningTitleStyle}>Opravdu chcete smazat vybrané položky?</h3>
          <p style={warningTextStyle}>
            Tato akce je nevratná. Smazáno bude <strong>{selectedCount}</strong> {getItemTypeLabel(itemType)}.
          </p>

          <div style={selectedItemsStyle}>
            <h4 style={selectedItemsTitleStyle}>Vybráno k smazání:</h4>
            <p style={selectedItemsListStyle}>
              {selectedCount} {getItemTypeLabel(itemType)}
            </p>
          </div>

          <div style={actionsStyle}>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isProcessing}
            >
              Zrušit
            </Button>
            <Button
              variant="error"
              onClick={handleBulkDelete}
              loading={isProcessing}
              disabled={isProcessing}
            >
              {isProcessing ? 'Mažu...' : 'Smazat'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
