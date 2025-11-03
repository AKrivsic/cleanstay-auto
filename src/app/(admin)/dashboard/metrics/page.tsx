import { Suspense } from 'react';
import { getMetricsSummary } from '@/lib/metrics/aggregation';
import MetricsSummary from './_components/MetricsSummary';
import CostChart from './_components/CostChart';
import CleaningChart from './_components/CleaningChart';
import KPICard from './_components/KPICard';
import PerformanceChart from './_components/PerformanceChart';

export default async function MetricsPage() {
  // TODO: Get real tenant ID from auth
  const tenantId = 'tenant-123';
  
  let summary;
  try {
    summary = await getMetricsSummary(tenantId);
  } catch (error) {
    console.error('Error fetching metrics summary:', error);
    summary = {
      today: {
        cleanings_done: 0,
        photos_uploaded: 0,
        ai_cost_eur: 0,
        whatsapp_cost_eur: 0,
        total_cost_eur: 0
      },
      this_month: {
        revenue_est: 0,
        costs_est: 0,
        profit_est: 0,
        utilization_rate: 0
      }
    };
  }

  return (
    <div className="metrics-page">
      <div className="page-header">
        <h1>Monitoring a KPI</h1>
        <p>Přehled nákladů, výkonu a provozních metrik</p>
      </div>

      {/* Summary Cards */}
      <div className="metrics-summary">
        <h2>Dnešní přehled</h2>
        <div className="summary-grid">
          <div className="summary-card">
            <h3>Úklidy</h3>
            <div className="metric-value">{summary.today.cleanings_done}</div>
            <div className="metric-label">dokončeno dnes</div>
          </div>
          <div className="summary-card">
            <h3>Fotografie</h3>
            <div className="metric-value">{summary.today.photos_uploaded}</div>
            <div className="metric-label">nahrané dnes</div>
          </div>
          <div className="summary-card">
            <h3>AI náklady</h3>
            <div className="metric-value">€{summary.today.ai_cost_eur.toFixed(2)}</div>
            <div className="metric-label">dnes</div>
          </div>
          <div className="summary-card">
            <h3>WhatsApp náklady</h3>
            <div className="metric-value">€{summary.today.whatsapp_cost_eur.toFixed(2)}</div>
            <div className="metric-label">dnes</div>
          </div>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="monthly-overview">
        <h2>Tento měsíc</h2>
        <div className="kpi-grid">
          <KPICard
            title="Odhad výnosů"
            value={`€${summary.this_month.revenue_est.toFixed(0)}`}
            subtitle="odhad na základě úklidů"
          />
          <KPICard
            title="Odhad nákladů"
            value={`€${summary.this_month.costs_est.toFixed(0)}`}
            subtitle="AI + WhatsApp + mzdy"
          />
          <KPICard
            title="Odhad zisku"
            value={`€${summary.this_month.profit_est.toFixed(0)}`}
            subtitle={`marže ${((summary.this_month.profit_est / summary.this_month.revenue_est) * 100).toFixed(1)}%`}
          />
          <KPICard
            title="Využití kapacity"
            value={`${summary.this_month.utilization_rate.toFixed(1)}%`}
            subtitle="uklízečky"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="charts-section">
        <h2>Grafy a trendy</h2>
        
        <div className="chart-grid">
          <div className="chart-container">
            <h3>Denní náklady (AI + WhatsApp)</h3>
            <Suspense fallback={<div className="chart-loading">Načítání grafu...</div>}>
              <CostChart tenantId={tenantId} />
            </Suspense>
          </div>

          <div className="chart-container">
            <h3>Počet úklidů a průměrný čas</h3>
            <Suspense fallback={<div className="chart-loading">Načítání grafu...</div>}>
              <CleaningChart tenantId={tenantId} />
            </Suspense>
          </div>

          <div className="chart-container">
            <h3>Fotografie a zásoby</h3>
            <Suspense fallback={<div className="chart-loading">Načítání grafu...</div>}>
              <PerformanceChart tenantId={tenantId} />
            </Suspense>
          </div>

          <div className="chart-container">
            <h3>Měsíční KPI - Výnosy vs Náklady</h3>
            <Suspense fallback={<div className="chart-loading">Načítání grafu...</div>}>
              <KPICard 
                title="Měsíční KPI - Výnosy vs Náklady"
                value="Graf"
                tenantId={tenantId} 
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Cost Limits Alert */}
      <div className="cost-limits">
        <h2>Limity nákladů</h2>
        <div className="limits-info">
          <div className="limit-item">
            <span className="limit-label">AI limit:</span>
            <span className="limit-value">€2.00/den</span>
            <span className={`limit-status ${summary.today.ai_cost_eur > 2 ? 'exceeded' : 'ok'}`}>
              {summary.today.ai_cost_eur > 2 ? 'PŘEKROČENO' : 'OK'}
            </span>
          </div>
          <div className="limit-item">
            <span className="limit-label">WhatsApp limit:</span>
            <span className="limit-value">€5.00/den</span>
            <span className={`limit-status ${summary.today.whatsapp_cost_eur > 5 ? 'exceeded' : 'ok'}`}>
              {summary.today.whatsapp_cost_eur > 5 ? 'PŘEKROČENO' : 'OK'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add some basic styling
const styles = `
  .metrics-page {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 30px;
  }

  .page-header h1 {
    font-size: 2rem;
    margin-bottom: 10px;
  }

  .page-header p {
    color: #666;
    font-size: 1.1rem;
  }

  .metrics-summary {
    margin-bottom: 40px;
  }

  .metrics-summary h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }

  .summary-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }

  .summary-card h3 {
    font-size: 1rem;
    margin-bottom: 10px;
    color: #495057;
  }

  .metric-value {
    font-size: 2rem;
    font-weight: bold;
    color: #007bff;
    margin-bottom: 5px;
  }

  .metric-label {
    font-size: 0.9rem;
    color: #6c757d;
  }

  .monthly-overview {
    margin-bottom: 40px;
  }

  .monthly-overview h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }

  .charts-section {
    margin-bottom: 40px;
  }

  .charts-section h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }

  .chart-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 30px;
  }

  .chart-container {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .chart-container h3 {
    font-size: 1.2rem;
    margin-bottom: 20px;
    color: #495057;
  }

  .chart-loading {
    text-align: center;
    padding: 40px;
    color: #6c757d;
  }

  .cost-limits {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }

  .cost-limits h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }

  .limits-info {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
  }

  .limit-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .limit-label {
    font-weight: 500;
  }

  .limit-value {
    color: #495057;
  }

  .limit-status {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
  }

  .limit-status.ok {
    background: #d4edda;
    color: #155724;
  }

  .limit-status.exceeded {
    background: #f8d7da;
    color: #721c24;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}




