'use client';

import { useState, useEffect } from 'react';

interface PerformanceChartProps {
  tenantId: string;
}

interface PerformanceData {
  dates: string[];
  photos_uploaded: number[];
  supplies_out: number[];
}

export default function PerformanceChart({ tenantId }: PerformanceChartProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceData();
  }, [tenantId]);

  const fetchPerformanceData = async () => {
    // For now, use mock data since we don't have the API endpoint yet
    const mockData: PerformanceData = {
      dates: Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 29 + i);
        return date.toISOString().split('T')[0];
      }),
      photos_uploaded: Array.from({ length: 30 }, () => Math.floor(Math.random() * 20) + 5),
      supplies_out: Array.from({ length: 30 }, () => Math.floor(Math.random() * 15) + 3)
    };

    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="chart-loading">
        <div className="loading-spinner"></div>
        <p>Načítání dat o výkonu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-error">
        <p>Chyba při načítání dat: {error}</p>
        <button onClick={fetchPerformanceData} className="retry-button">
          Zkusit znovu
        </button>
      </div>
    );
  }

  if (!data || data.dates.length === 0) {
    return (
      <div className="chart-empty">
        <p>Žádná data o výkonu k zobrazení</p>
      </div>
    );
  }

  // Simple area chart implementation
  const maxPhotos = Math.max(...data.photos_uploaded);
  const maxSupplies = Math.max(...data.supplies_out);
  const chartHeight = 200;
  const chartWidth = 400;
  const barWidth = chartWidth / data.dates.length;

  return (
    <div className="performance-chart">
      <div className="chart-header">
        <h4>Fotografie a zásoby (posledních 30 dní)</h4>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color photos-color"></div>
            <span>Fotografie</span>
          </div>
          <div className="legend-item">
            <div className="legend-color supplies-color"></div>
            <span>Zásoby</span>
          </div>
        </div>
      </div>
      
      <div className="chart-container">
        <svg width={chartWidth} height={chartHeight} className="performance-chart-svg">
          {data.dates.map((date: string, index: number) => {
            const photos = data.photos_uploaded[index] || 0;
            const supplies = data.supplies_out[index] || 0;
            
            const photosHeight = (photos / maxPhotos) * chartHeight;
            const suppliesHeight = (supplies / maxSupplies) * chartHeight;
            const x = index * barWidth;
            
            return (
              <g key={date}>
                {/* Photos bar */}
                <rect
                  x={x}
                  y={chartHeight - photosHeight}
                  width={barWidth * 0.4}
                  height={photosHeight}
                  fill="#17a2b8"
                  opacity={0.8}
                />
                {/* Supplies bar */}
                <rect
                  x={x + barWidth * 0.4}
                  y={chartHeight - suppliesHeight}
                  width={barWidth * 0.4}
                  height={suppliesHeight}
                  fill="#fd7e14"
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
                  data-tooltip={`${date}: ${photos} fotek, ${supplies} zásob`}
                />
              </g>
            );
          })}
          
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <g key={ratio}>
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
                {Math.round(maxPhotos * ratio)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">Průměrné denní fotografie:</span>
          <span className="summary-value">{(data.photos_uploaded.reduce((a, b) => a + b, 0) / data.photos_uploaded.length).toFixed(1)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Průměrné denní zásoby:</span>
          <span className="summary-value">{(data.supplies_out.reduce((a, b) => a + b, 0) / data.supplies_out.length).toFixed(1)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Celkem fotek (30 dní):</span>
          <span className="summary-value">{data.photos_uploaded.reduce((a, b) => a + b, 0)}</span>
        </div>
      </div>
    </div>
  );
}

// Add styles
const styles = `
  .performance-chart {
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

  .photos-color {
    background: #17a2b8;
  }

  .supplies-color {
    background: #fd7e14;
  }

  .chart-container {
    margin-bottom: 20px;
    overflow-x: auto;
  }

  .performance-chart-svg {
    border: 1px solid #e9ecef;
    border-radius: 4px;
  }

  .bar-hover {
    cursor: pointer;
  }

  .bar-hover:hover {
    fill: rgba(23, 162, 184, 0.1);
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




