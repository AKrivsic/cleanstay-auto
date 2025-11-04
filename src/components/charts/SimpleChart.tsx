"use client";

import React from 'react';
import { colors, spacing, typography, borderRadius } from '@/lib/design-system';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  data: ChartData[];
  type: 'bar' | 'line' | 'pie' | 'donut';
  title?: string;
  subtitle?: string;
  height?: number;
  showValues?: boolean;
  showLegend?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function SimpleChart({
  data,
  type,
  title,
  subtitle,
  height = 200,
  showValues = true,
  showLegend = true,
  className,
  style,
}: SimpleChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  const defaultColors = [
    colors.primary[500],
    colors.success[500],
    colors.warning[500],
    colors.error[500],
    colors.secondary[500],
    colors.primary[300],
    colors.success[300],
    colors.warning[300],
    colors.error[300],
    colors.secondary[300],
  ];

  const getColor = (index: number, customColor?: string) => {
    return customColor || defaultColors[index % defaultColors.length];
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: height,
    position: 'relative',
    ...style,
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: spacing[4],
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
    marginBottom: subtitle ? spacing[1] : 0,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    margin: 0,
  };

  const chartContainerStyle: React.CSSProperties = {
    width: '100%',
    height: showLegend ? height - 60 : height,
    position: 'relative',
  };

  const legendStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[3],
  };

  const legendItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  };

  const legendDotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  };

  const renderBarChart = () => {
    const barWidth = 100 / data.length;
    const barSpacing = barWidth * 0.1;
    const actualBarWidth = barWidth - barSpacing;

    return (
      <div style={{ display: 'flex', alignItems: 'end', height: '100%', gap: '2%' }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          const color = getColor(index, item.color);

          return (
            <div
              key={index}
              style={{
                width: `${actualBarWidth}%`,
                height: `${barHeight}%`,
                backgroundColor: color,
                borderRadius: borderRadius.sm,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                transition: 'all 0.3s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scaleY(1.05)';
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scaleY(1)';
                e.currentTarget.style.opacity = '1';
              }}
            >
              {showValues && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.value}
                </div>
              )}
              <div
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  textAlign: 'center',
                  padding: spacing[1],
                  transform: 'rotate(-45deg)',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (item.value / maxValue) * 100;
      return { x, y, value: item.value, label: item.label };
    });

    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    return (
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.primary[500]} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.primary[500]} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area under the line */}
        <path
          d={`${pathData} L 100 100 L 0 100 Z`}
          fill="url(#lineGradient)"
        />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={colors.primary[500]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={colors.primary[500]}
            stroke="white"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
          />
        ))}
        
        {/* Labels */}
        {showValues && points.map((point, index) => (
          <text
            key={index}
            x={point.x}
            y={point.y - 10}
            textAnchor="middle"
            fontSize={typography.fontSize.xs}
            fill={colors.text.primary}
            fontWeight={typography.fontWeight.medium}
          >
            {point.value}
          </text>
        ))}
      </svg>
    );
  };

  const renderPieChart = () => {
    let currentAngle = 0;
    const radius = Math.min(height - 40, 120) / 2;
    const centerX = 50;
    const centerY = 50;

    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
        {data.map((item, index) => {
          const percentage = (item.value / totalValue) * 100;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const startAngleRad = (startAngle * Math.PI) / 180;
          const endAngleRad = (endAngle * Math.PI) / 180;
          
          const x1 = centerX + radius * Math.cos(startAngleRad);
          const y1 = centerY + radius * Math.sin(startAngleRad);
          const x2 = centerX + radius * Math.cos(endAngleRad);
          const y2 = centerY + radius * Math.sin(endAngleRad);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          const color = getColor(index, item.color);
          
          return (
            <path
              key={index}
              d={pathData}
              fill={color}
              stroke="white"
              strokeWidth="1"
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            />
          );
        })}
      </svg>
    );
  };

  const renderDonutChart = () => {
    let currentAngle = 0;
    const radius = Math.min(height - 40, 120) / 2;
    const centerX = 50;
    const centerY = 50;
    const innerRadius = radius * 0.6;

    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
        {data.map((item, index) => {
          const percentage = (item.value / totalValue) * 100;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const startAngleRad = (startAngle * Math.PI) / 180;
          const endAngleRad = (endAngle * Math.PI) / 180;
          
          const x1 = centerX + radius * Math.cos(startAngleRad);
          const y1 = centerY + radius * Math.sin(startAngleRad);
          const x2 = centerX + radius * Math.cos(endAngleRad);
          const y2 = centerY + radius * Math.sin(endAngleRad);
          
          const x1Inner = centerX + innerRadius * Math.cos(startAngleRad);
          const y1Inner = centerY + innerRadius * Math.sin(startAngleRad);
          const x2Inner = centerX + innerRadius * Math.cos(endAngleRad);
          const y2Inner = centerY + innerRadius * Math.sin(endAngleRad);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `L ${x2Inner} ${y2Inner}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1Inner} ${y1Inner}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          const color = getColor(index, item.color);
          
          return (
            <path
              key={index}
              d={pathData}
              fill={color}
              stroke="white"
              strokeWidth="1"
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            />
          );
        })}
        
        {/* Center text */}
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          fontSize={typography.fontSize.sm}
          fontWeight={typography.fontWeight.semibold}
          fill={colors.text.primary}
        >
          {totalValue}
        </text>
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          fontSize={typography.fontSize.xs}
          fill={colors.text.secondary}
        >
          celkem
        </text>
      </svg>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'donut':
        return renderDonutChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <div className={className} style={containerStyle}>
      {(title || subtitle) && (
        <div style={headerStyle}>
          {title && <h3 style={titleStyle}>{title}</h3>}
          {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
        </div>
      )}
      
      <div style={chartContainerStyle}>
        {renderChart()}
      </div>
      
      {showLegend && data.length > 1 && (
        <div style={legendStyle}>
          {data.map((item, index) => (
            <div key={index} style={legendItemStyle}>
              <div
                style={{
                  ...legendDotStyle,
                  backgroundColor: getColor(index, item.color),
                }}
              />
              <span>{item.label}</span>
              {showValues && (
                <span style={{ fontWeight: typography.fontWeight.medium }}>
                  ({item.value})
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
