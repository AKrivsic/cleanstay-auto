"use client";

import React, { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { Badge } from './Badge';
import { Card, CardContent, CardHeader } from './Card';
import { colors, spacing, typography, borderRadius } from '@/lib/design-system';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface AdvancedFiltersProps {
  filters: {
    search: string;
    role?: string;
    type?: string;
    status?: string;
    dateRange?: {
      from: string;
      to: string;
    };
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  searchPlaceholder?: string;
  roleOptions?: FilterOption[];
  typeOptions?: FilterOption[];
  statusOptions?: FilterOption[];
  showDateRange?: boolean;
  showRoleFilter?: boolean;
  showTypeFilter?: boolean;
  showStatusFilter?: boolean;
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  searchPlaceholder = "Vyhledat...",
  roleOptions = [],
  typeOptions = [],
  statusOptions = [],
  showDateRange = false,
  showRoleFilter = false,
  showTypeFilter = false,
  showStatusFilter = false,
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleRoleChange = (role: string) => {
    onFiltersChange({ ...filters, role: role === filters.role ? undefined : role });
  };

  const handleTypeChange = (type: string) => {
    onFiltersChange({ ...filters, type: type === filters.type ? undefined : type });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: status === filters.status ? undefined : status });
  };

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value,
      },
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.role) count++;
    if (filters.type) count++;
    if (filters.status) count++;
    if (filters.dateRange?.from || filters.dateRange?.to) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const containerStyle: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    border: `1px solid ${colors.border.light}`,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[6],
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
  };

  const expandButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    background: 'none',
    border: 'none',
    color: colors.primary[600],
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    padding: spacing[1],
    borderRadius: borderRadius.sm,
    transition: 'all 0.2s ease-in-out',
  };

  const searchContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing[3],
    alignItems: 'flex-end',
    marginBottom: spacing[4],
  };

  const searchInputStyle: React.CSSProperties = {
    flex: 1,
  };

  const clearButtonStyle: React.CSSProperties = {
    whiteSpace: 'nowrap',
  };

  const expandedContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
    paddingTop: spacing[4],
    borderTop: `1px solid ${colors.border.light}`,
  };

  const filterRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[3],
    alignItems: 'flex-end',
  };

  const filterGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
  };

  const filterLabelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    margin: 0,
  };

  const optionsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing[2],
  };

  const optionButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.border.medium}`,
    backgroundColor: colors.background.primary,
    color: colors.text.secondary,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    transition: 'all 0.2s ease-in-out',
  };

  const activeOptionStyle: React.CSSProperties = {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
    color: colors.primary[700],
  };

  const activeFiltersStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[3],
  };

  const activeFilterStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    padding: `${spacing[1]} ${spacing[2]}`,
    backgroundColor: colors.primary[100],
    color: colors.primary[700],
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  };

  const removeFilterStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: colors.primary[600],
    cursor: 'pointer',
    fontSize: '0.8em',
    padding: 0,
    marginLeft: spacing[1],
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Filtry a vyhledávání</h3>
        <button
          style={expandButtonStyle}
          onClick={() => setIsExpanded(!isExpanded)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.gray[50];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {isExpanded ? 'Sbalit' : 'Rozbalit'} filtry
          {activeFiltersCount > 0 && (
            <Badge variant="primary" size="sm">
              {activeFiltersCount}
            </Badge>
          )}
        </button>
      </div>

      <div style={searchContainerStyle}>
        <div style={searchInputStyle}>
          <Input
            placeholder={searchPlaceholder}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            leftIcon="🔍"
          />
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            style={clearButtonStyle}
          >
            Vymazat filtry
          </Button>
        )}
      </div>

      {isExpanded && (
        <div style={expandedContentStyle}>
          <div style={filterRowStyle}>
            {showRoleFilter && roleOptions.length > 0 && (
              <div style={filterGroupStyle}>
                <label style={filterLabelStyle}>Role</label>
                <div style={optionsContainerStyle}>
                  {roleOptions.map((option) => (
                    <button
                      key={option.value}
                      style={{
                        ...optionButtonStyle,
                        ...(filters.role === option.value ? activeOptionStyle : {}),
                      }}
                      onClick={() => handleRoleChange(option.value)}
                      onMouseEnter={(e) => {
                        if (filters.role !== option.value) {
                          e.currentTarget.style.backgroundColor = colors.gray[50];
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (filters.role !== option.value) {
                          e.currentTarget.style.backgroundColor = colors.background.primary;
                        }
                      }}
                    >
                      {option.label}
                      {option.count !== undefined && (
                        <Badge variant="secondary" size="sm">
                          {option.count}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showTypeFilter && typeOptions.length > 0 && (
              <div style={filterGroupStyle}>
                <label style={filterLabelStyle}>Typ</label>
                <div style={optionsContainerStyle}>
                  {typeOptions.map((option) => (
                    <button
                      key={option.value}
                      style={{
                        ...optionButtonStyle,
                        ...(filters.type === option.value ? activeOptionStyle : {}),
                      }}
                      onClick={() => handleTypeChange(option.value)}
                      onMouseEnter={(e) => {
                        if (filters.type !== option.value) {
                          e.currentTarget.style.backgroundColor = colors.gray[50];
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (filters.type !== option.value) {
                          e.currentTarget.style.backgroundColor = colors.background.primary;
                        }
                      }}
                    >
                      {option.label}
                      {option.count !== undefined && (
                        <Badge variant="secondary" size="sm">
                          {option.count}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showStatusFilter && statusOptions.length > 0 && (
              <div style={filterGroupStyle}>
                <label style={filterLabelStyle}>Stav</label>
                <div style={optionsContainerStyle}>
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      style={{
                        ...optionButtonStyle,
                        ...(filters.status === option.value ? activeOptionStyle : {}),
                      }}
                      onClick={() => handleStatusChange(option.value)}
                      onMouseEnter={(e) => {
                        if (filters.status !== option.value) {
                          e.currentTarget.style.backgroundColor = colors.gray[50];
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (filters.status !== option.value) {
                          e.currentTarget.style.backgroundColor = colors.background.primary;
                        }
                      }}
                    >
                      {option.label}
                      {option.count !== undefined && (
                        <Badge variant="secondary" size="sm">
                          {option.count}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showDateRange && (
              <div style={filterGroupStyle}>
                <label style={filterLabelStyle}>Datum</label>
                <div style={{ display: 'flex', gap: spacing[2] }}>
                  <Input
                    type="date"
                    placeholder="Od"
                    value={filters.dateRange?.from || ''}
                    onChange={(e) => handleDateRangeChange('from', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Input
                    type="date"
                    placeholder="Do"
                    value={filters.dateRange?.to || ''}
                    onChange={(e) => handleDateRangeChange('to', e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <div style={activeFiltersStyle}>
              <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                Aktivní filtry:
              </span>
              {filters.search && (
                <div style={activeFilterStyle}>
                  Vyhledávání: "{filters.search}"
                  <button
                    style={removeFilterStyle}
                    onClick={() => handleSearchChange('')}
                  >
                    ×
                  </button>
                </div>
              )}
              {filters.role && (
                <div style={activeFilterStyle}>
                  Role: {roleOptions.find(o => o.value === filters.role)?.label}
                  <button
                    style={removeFilterStyle}
                    onClick={() => handleRoleChange('')}
                  >
                    ×
                  </button>
                </div>
              )}
              {filters.type && (
                <div style={activeFilterStyle}>
                  Typ: {typeOptions.find(o => o.value === filters.type)?.label}
                  <button
                    style={removeFilterStyle}
                    onClick={() => handleTypeChange('')}
                  >
                    ×
                  </button>
                </div>
              )}
              {filters.status && (
                <div style={activeFilterStyle}>
                  Stav: {statusOptions.find(o => o.value === filters.status)?.label}
                  <button
                    style={removeFilterStyle}
                    onClick={() => handleStatusChange('')}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
