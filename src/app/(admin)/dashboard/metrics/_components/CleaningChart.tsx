'use client';

import { useState, useEffect } from 'react';

interface CleaningChartProps {
  tenantId: string;
}

interface CleaningData {
  dates: string[];
  cleanings_done: number[];
  avg_cleaning_time: number[];
}

export default function CleaningChart({ tenantId }: CleaningChartProps) {
  const [data, setData] = useState<CleaningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCleaningData();
  }, [tenantId]);

  const fetchCleaningData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/metrics/daily?type=performance&from=${getDate30DaysAgo()}&to=${getToday()}`, {
        headers: {
          'Authorization': 'Bearer admin-token', // TODO: Use real auth
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cleaning data');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getDate30DaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="chart-loading">
        <div className="loading-spinner"></div>
        <p>Načítání dat o úklidech...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-error">
        <p>Chyba při načítání dat: {error}</p>
        <button onClick={fetchCleaningData} className="retry-button">
          Zkusit znovu
        </button>
      </div>
    );
  }

  if (!data || data.dates.length === 0) {
    return (
      <div className="chart-empty">
        <p>Žádná data o úklidech k zobrazení</p>
      </div>
    );
  }

  // Simple chart implementation
  const maxCleanings = Math.max(...data.cleanings_done);
  const maxTime = Math.max(...data.avg_cleaning_time);
  const chartHeight = 200;
  const chartWidth = 400;
  const barWidth = chartWidth / data.dates.length;

  return (
    <div className="cleaning-chart">
      <div className="chart-header">
        <h4>Výkon úklidů (posledních 30 dní)</h4>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color cleanings-color"></div>
            <span>Počet úklidů</span>
          </div>
          <div className="legend-item">
            <div className="legend-color time-color"></div>
            <span>Průměrný čas (min)</span>
          </div>
        </div>
      </div>
      
      <div className="chart-container">
        <svg width={chartWidth} height={chartHeight} className="cleaning-chart-svg">
          {data.dates.map((date: string, index: number) => {
            const cleanings = data.cleanings_done[index] || 0;
            const avgTime = data.avg_cleaning_time[index] || 0;
            
            const cleaningsHeight = (cleanings / maxCleanings) * chartHeight;
            const timeHeight = (avgTime / maxTime) * chartHeight;
            const x = index * barWidth;
            
            return (
              <g key={date}>
                {/* Cleanings bar */}
                <rect
                  x={x}
                  y={chartHeight - cleaningsHeight}
                  width={barWidth * 0.4}
                  height={cleaningsHeight}
                  fill="#007bff"
                  opacity={0.8}
                />
                {/* Time bar */}
                <rect
                  x={x + barWidth * 0.4}
                  y={chartHeight - timeHeight}
                  width={barWidth * 0.4}
                  height={timeHeight}
                  fill="#ffc107"
                  opacity={0.8}
                />
                {/* Date label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6c757d"
                >
                  {new Date(date).getDate()}
                </text>
                {/* Hover tooltip */}
                <rect
                  x={x}
                  y={0}
                  width={barWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="bar-hover"
                  data-tooltip={`${date}: ${cleanings} úklidů, ${avgTime.toFixed(1)} min`}
                />
              </g>
            );
          })}
          
          {/* Y-axis labels for cleanings */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <g key={`cleanings-${ratio}`}>
              <line
                x1={0}
                y1={chartHeight * ratio}
                x2={chartWidth}
                y2={chartHeight * ratio}
                stroke="#e9ecef"
                strokeWidth={1}
              />
              <text
                x={-5}
                y={chartHeight * ratio + 4}
                textAnchor="end"
                fontSize="10"
                fill="#6c757d"
              >
                {Math.round(maxCleanings * ratio)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">Průměrný denní počet úklidů:</span>
          <span className="summary-value">{(data.cleanings_done.reduce((a, b) => a + b, 0) / data.cleanings_done.length).toFixed(1)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Průměrný čas úklidu:</span>
          <span className="summary-value">{data.avg_cleaning_time.reduce((a, b) => a + b, 0) / data.avg_cleaning_time.length} min</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Celkem úklidů (30 dní):</span>
          <span className="summary-value">{data.cleanings_done.reduce((a, b) => a + b, 0)}</span>
        </div>
      </div>
    </div>
  );
}

// Add styles
const styles = `
  .cleaning-chart {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
  }

  .chart-header {
    margin-bottom: 20px;
  }

  .chart-header h4 {
    margin: 0 0 10px 0;
    font-size: 1.1rem;
    color: #495057;
  }

  .chart-legend {
    display: flex;
    gap: 20px;
    margin-bottom: 10px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
  }

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }

  .cleanings-color {
    background: #007bff;
  }

  .time-color {
    background: #ffc107;
  }

  .chart-container {
    margin-bottom: 20px;
    overflow-x: auto;
  }

  .cleaning-chart-svg {
    border: 1px solid #e9ecef;
    border-radius: 4px;
  }

  .bar-hover {
    cursor: pointer;
  }

  .bar-hover:hover {
    fill: rgba(0, 123, 255, 0.1);
  }

  .chart-summary {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }

  .summary-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .summary-label {
    font-size: 0.9rem;
    color: #6c757d;
  }

  .summary-value {
    font-weight: bold;
    color: #495057;
  }

  .chart-loading {
    text-align: center;
    padding: 40px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .chart-error {
    text-align: center;
    padding: 20px;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 8px;
    color: #721c24;
  }

  .retry-button {
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
  }

  .retry-button:hover {
    background: #0056b3;
  }

  .chart-empty {
    text-align: center;
    padding: 40px;
    color: #6c757d;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}




