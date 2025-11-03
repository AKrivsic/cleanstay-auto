"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { colors, spacing, typography, borderRadius } from '@/lib/design-system';

interface Suggestion {
  id: string;
  type: 'tip' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface SmartSuggestionsProps {
  suggestions: Suggestion[];
  onDismiss?: (suggestionId: string) => void;
  onAction?: (suggestionId: string, action: string) => void;
  maxSuggestions?: number;
  showPriority?: boolean;
}

export function SmartSuggestions({
  suggestions,
  onDismiss,
  onAction,
  maxSuggestions = 5,
  showPriority = true,
}: SmartSuggestionsProps) {
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const handleDismiss = (suggestionId: string) => {
    setDismissedSuggestions(prev => {
      const newSet = new Set(prev);
      newSet.add(suggestionId);
      return newSet;
    });
    onDismiss?.(suggestionId);
  };

  const handleAction = (suggestionId: string, actionLabel: string) => {
    onAction?.(suggestionId, actionLabel);
  };

  const visibleSuggestions = suggestions
    .filter(s => !dismissedSuggestions.has(s.id))
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, maxSuggestions);

  if (visibleSuggestions.length === 0) {
    return null;
  }

  const getSuggestionIcon = (type: string) => {
    const icons = {
      tip: '💡',
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️',
    };
    return icons[type as keyof typeof icons] || 'ℹ️';
  };

  const getSuggestionColor = (type: string) => {
    const suggestionColors = {
      tip: colors.warning[500],
      warning: colors.error[500],
      success: colors.success[500],
      info: colors.primary[500],
    };
    return suggestionColors[type as keyof typeof suggestionColors] || colors.primary[500];
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors = {
      high: colors.error[500],
      medium: colors.warning[500],
      low: colors.success[500],
    };
    return priorityColors[priority as keyof typeof priorityColors] || colors.gray[500];
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[3],
  };

  const suggestionStyle: React.CSSProperties = {
    position: 'relative',
    border: `1px solid ${colors.border.light}`,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    transition: 'all 0.2s ease-in-out',
  };

  const suggestionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.background.primary,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    flexShrink: 0,
    marginTop: '2px',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
    marginBottom: spacing[1],
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    margin: 0,
    marginBottom: spacing[3],
    lineHeight: typography.lineHeight.relaxed,
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  };

  const dismissButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: colors.text.tertiary,
    cursor: 'pointer',
    padding: spacing[1],
    borderRadius: borderRadius.sm,
    fontSize: '1.25rem',
    lineHeight: 1,
    transition: 'all 0.2s ease-in-out',
  };

  const priorityBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
  };

  return (
    <div style={containerStyle}>
      {visibleSuggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          style={{
            ...suggestionStyle,
            borderLeftColor: getSuggestionColor(suggestion.type),
            borderLeftWidth: '4px',
          }}
        >
          {showPriority && (
            <div style={priorityBadgeStyle}>
              <Badge
                variant={suggestion.priority === 'high' ? 'error' : suggestion.priority === 'medium' ? 'warning' : 'success'}
                size="sm"
              >
                {suggestion.priority}
              </Badge>
            </div>
          )}

          <div style={suggestionHeaderStyle}>
            <div style={{ ...iconStyle, color: getSuggestionColor(suggestion.type) }}>
              {getSuggestionIcon(suggestion.type)}
            </div>
            
            <div style={contentStyle}>
              <h4 style={titleStyle}>{suggestion.title}</h4>
              <p style={descriptionStyle}>{suggestion.description}</p>
              
              <div style={actionsStyle}>
                {suggestion.action && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAction(suggestion.id, suggestion.action!.label)}
                  >
                    {suggestion.action.label}
                  </Button>
                )}
                
                {suggestion.dismissible !== false && (
                  <button
                    style={dismissButtonStyle}
                    onClick={() => handleDismiss(suggestion.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.gray[100];
                      e.currentTarget.style.color = colors.text.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = colors.text.tertiary;
                    }}
                    aria-label="Zavřít návrh"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Hook for generating smart suggestions
export function useSmartSuggestions(data: any) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    const newSuggestions: Suggestion[] = [];

    // Analyze data and generate suggestions
    if (data.users && data.users.length === 0) {
      newSuggestions.push({
        id: 'no-users',
        type: 'tip',
        title: 'Přidejte první uživatele',
        description: 'Začněte přidáním klientů a uklízeček do systému.',
        action: {
          label: 'Přidat uživatele',
          onClick: () => {
            // This would be handled by the parent component
          },
        },
        priority: 'high',
      });
    }

    if (data.properties && data.properties.length === 0) {
      newSuggestions.push({
        id: 'no-properties',
        type: 'tip',
        title: 'Přidejte první nemovitost',
        description: 'Registrujte nemovitosti, které chcete uklízet.',
        action: {
          label: 'Přidat nemovitost',
          onClick: () => {
            // This would be handled by the parent component
          },
        },
        priority: 'high',
      });
    }

    if (data.cleanings && data.cleanings.length === 0) {
      newSuggestions.push({
        id: 'no-cleanings',
        type: 'info',
        title: 'Naplánujte první úklid',
        description: 'Začněte plánováním úklidů pro vaše nemovitosti.',
        action: {
          label: 'Naplánovat úklid',
          onClick: () => {
            // This would be handled by the parent component
          },
        },
        priority: 'medium',
      });
    }

    // Check for incomplete user profiles
    if (data.users) {
      const incompleteUsers = data.users.filter((user: any) => 
        !user.phone || !user.email || !user.name
      );
      
      if (incompleteUsers.length > 0) {
        newSuggestions.push({
          id: 'incomplete-profiles',
          type: 'warning',
          title: 'Nedokončené profily',
          description: `${incompleteUsers.length} uživatelů má neúplné informace.`,
          priority: 'medium',
        });
      }
    }

    // Check for properties without assigned cleaners
    if (data.properties) {
      const unassignedProperties = data.properties.filter((property: any) => 
        !property.cleaner_id
      );
      
      if (unassignedProperties.length > 0) {
        newSuggestions.push({
          id: 'unassigned-properties',
          type: 'info',
          title: 'Nemovitosti bez uklízečky',
          description: `${unassignedProperties.length} nemovitostí nemá přiřazenou uklízečku.`,
          priority: 'low',
        });
      }
    }

    setSuggestions(newSuggestions);
  }, [JSON.stringify(data)]);

  return suggestions;
}
