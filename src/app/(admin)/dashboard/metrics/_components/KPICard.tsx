'use client';

import { useState, useEffect } from 'react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  tenantId?: string;
}

interface MonthlyKPIData {
  month: string;
  revenue_est: number;
  costs_est: number;
  profit_est: number;
  avg_rating: number;
  utilization_rate: number;
}

export default function KPICard({ title, value, subtitle, tenantId }: KPICardProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyKPIData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenantId && title === 'Měsíční KPI - Výnosy vs Náklady') {
      fetchMonthlyKPIs();
    }
  }, [tenantId, title]);

  const fetchMonthlyKPIs = async () => {
    try {
      setLoading(true);
      const currentYear = new Date().getFullYear();
      const response = await fetch(`/api/admin/metrics/monthly?year=${currentYear}`, {
        headers: {
          'Authorization': 'Bearer admin-token', // TODO: Use real auth
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch monthly KPIs');
      }

      const result = await response.json();
      setMonthlyData(result.data);
    } catch (err) {
      console.error('Error fetching monthly KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  // If this is the monthly KPI chart, render the chart
  if (title === 'Měsíční KPI - Výnosy vs Náklady' && tenantId) {
    return (
      <div className="kpi-chart">
        <div className="chart-header">
          <h4>Měsíční KPI - Výnosy vs Náklady</h4>
        </div>
        
        {loading ? (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <p>Načítání měsíčních KPI...</p>
          </div>
        ) : monthlyData.length > 0 ? (
          <div className="chart-container">
            <svg width={400} height={200} className="kpi-chart-svg">
              {monthlyData.map((kpi: MonthlyKPIData, index: number) => {
                const maxValue = Math.max(...monthlyData.map(d => Math.max(d.revenue_est, d.costs_est)));
                const revenueHeight = (kpi.revenue_est / maxValue) * 150;
                const costsHeight = (kpi.costs_est / maxValue) * 150;
                const x = (index * 400) / monthlyData.length;
                const barWidth = 400 / monthlyData.length * 0.8;
                
                return (
                  <g key={kpi.month}>
                    {/* Revenue bar */}
                    <rect
                      x={x}
                      y={200 - revenueHeight}
                      width={barWidth * 0.4}
                      height={revenueHeight}
                      fill="#28a745"
                      opacity={0.8}
                    />
                    {/* Costs bar */}
                    <rect
                      x={x + barWidth * 0.4}
                      y={200 - costsHeight}
                      width={barWidth * 0.4}
                      height={costsHeight}
                      fill="#dc3545"
                      opacity={0.8}
                    />
                    {/* Month label */}
                    <text
                      x={x + barWidth / 2}
                      y={215}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#6c757d"
                    >
                      {new Date(kpi.month).toLocaleDateString('cs-CZ', { month: 'short' })}
                    </text>
                    {/* Values on bars */}
                    <text
                      x={x + barWidth * 0.2}
                      y={200 - revenueHeight - 5}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#28a745"
                    >
                      €{kpi.revenue_est.toFixed(0)}
                    </text>
                    <text
                      x={x + barWidth * 0.6}
                      y={200 - costsHeight - 5}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#dc3545"
                    >
                      €{kpi.costs_est.toFixed(0)}
                    </text>
                  </g>
                );
              })}
              
              {/* Y-axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                <g key={ratio}>
                  <line
                    x1={0}
                    y1={200 - (150 * ratio)}
                    x2={400}
                    y2={200 - (150 * ratio)}
                    stroke="#e9ecef"
                    strokeWidth={1}
                  />
                  <text
                    x={-5}
                    y={200 - (150 * ratio) + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#6c757d"
                  >
                    €{Math.round(Math.max(...monthlyData.map(d => Math.max(d.revenue_est, d.costs_est))) * ratio)}
                  </text>
                </g>
              ))}
            </svg>
            
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color revenue-color"></div>
                <span>Výnosy</span>
              </div>
              <div className="legend-item">
                <div className="legend-color costs-color"></div>
                <span>Náklady</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="chart-empty">
            <p>Žádná měsíční KPI data k zobrazení</p>
          </div>
        )}
      </div>
    );
  }

  // Regular KPI card
  return (
    <div className="kpi-card">
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-content">
        <div className="card-value">{value}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

// Add styles
const styles = `
  .kpi-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    transition: transform 0.2s ease;
  }

  .kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }

  .card-header h3 {
    margin: 0 0 15px 0;
    font-size: 1.1rem;
    color: #495057;
  }

  .card-content {
    text-align: center;
  }

  .card-value {
    font-size: 2rem;
    font-weight: bold;
    color: #007bff;
    margin-bottom: 5px;
  }

  .card-subtitle {
    font-size: 0.9rem;
    color: #6c757d;
  }

  .kpi-chart {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
  }

  .chart-header h4 {
    margin: 0 0 20px 0;
    font-size: 1.1rem;
    color: #495057;
  }

  .chart-container {
    margin-bottom: 20px;
  }

  .kpi-chart-svg {
    border: 1px solid #e9ecef;
    border-radius: 4px;
  }

  .chart-legend {
    display: flex;
    gap: 20px;
    justify-content: center;
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

  .revenue-color {
    background: #28a745;
  }

  .costs-color {
    background: #dc3545;
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




