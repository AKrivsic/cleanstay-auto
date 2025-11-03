'use client';

import { useState, useEffect } from 'react';

interface MetricsSummaryProps {
  tenantId: string;
}

interface SummaryData {
  today: {
    cleanings_done: number;
    photos_uploaded: number;
    ai_cost_eur: number;
    whatsapp_cost_eur: number;
    total_cost_eur: number;
  };
  this_month: {
    revenue_est: number;
    costs_est: number;
    profit_est: number;
    utilization_rate: number;
  };
}

export default function MetricsSummary({ tenantId }: MetricsSummaryProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, [tenantId]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/metrics/summary`, {
        headers: {
          'Authorization': 'Bearer admin-token', // TODO: Use real auth
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metrics summary');
      }

      const data = await response.json();
      setSummary(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="metrics-summary-loading">
        <div className="loading-spinner"></div>
        <p>Načítání metrik...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="metrics-summary-error">
        <p>Chyba při načítání metrik: {error}</p>
        <button onClick={fetchSummary} className="retry-button">
          Zkusit znovu
        </button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="metrics-summary-empty">
        <p>Žádná data k zobrazení</p>
      </div>
    );
  }

  return (
    <div className="metrics-summary">
      <div className="summary-section">
        <h3>Dnešní přehled</h3>
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">🧹</div>
            <div className="card-content">
              <div className="card-value">{summary.today.cleanings_done}</div>
              <div className="card-label">Úklidy</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">📸</div>
            <div className="card-content">
              <div className="card-value">{summary.today.photos_uploaded}</div>
              <div className="card-label">Fotografie</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">🤖</div>
            <div className="card-content">
              <div className="card-value">€{summary.today.ai_cost_eur.toFixed(2)}</div>
              <div className="card-label">AI náklady</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">💬</div>
            <div className="card-content">
              <div className="card-value">€{summary.today.whatsapp_cost_eur.toFixed(2)}</div>
              <div className="card-label">WhatsApp náklady</div>
            </div>
          </div>
        </div>
      </div>

      <div className="summary-section">
        <h3>Tento měsíc</h3>
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <div className="card-value">€{summary.this_month.revenue_est.toFixed(0)}</div>
              <div className="card-label">Odhad výnosů</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">💸</div>
            <div className="card-content">
              <div className="card-value">€{summary.this_month.costs_est.toFixed(0)}</div>
              <div className="card-label">Odhad nákladů</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">📈</div>
            <div className="card-content">
              <div className="card-value">€{summary.this_month.profit_est.toFixed(0)}</div>
              <div className="card-label">Odhad zisku</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">⚡</div>
            <div className="card-content">
              <div className="card-value">{summary.this_month.utilization_rate.toFixed(1)}%</div>
              <div className="card-label">Využití kapacity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add styles
const styles = `
  .metrics-summary {
    margin-bottom: 30px;
  }

  .summary-section {
    margin-bottom: 30px;
  }

  .summary-section h3 {
    font-size: 1.3rem;
    margin-bottom: 15px;
    color: #495057;
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }

  .summary-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    display: flex;
    align-items: center;
    gap: 15px;
    transition: transform 0.2s ease;
  }

  .summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }

  .card-icon {
    font-size: 2rem;
    opacity: 0.7;
  }

  .card-content {
    flex: 1;
  }

  .card-value {
    font-size: 1.8rem;
    font-weight: bold;
    color: #007bff;
    margin-bottom: 5px;
  }

  .card-label {
    font-size: 0.9rem;
    color: #6c757d;
  }

  .metrics-summary-loading {
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

  .metrics-summary-error {
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

  .metrics-summary-empty {
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





