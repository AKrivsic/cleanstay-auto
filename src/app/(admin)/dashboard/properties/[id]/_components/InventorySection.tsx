'use client';

import { useState, useEffect } from 'react';

interface InventoryItem {
  supply_id: string;
  supply_name: string;
  unit: string;
  current_qty: number;
  min_qty: number;
  max_qty: number;
  daily_average: number;
}

interface RecommendationItem {
  supply_id: string;
  supply_name: string;
  unit: string;
  current_qty: number;
  min_qty: number;
  max_qty: number;
  daily_average: number;
  recommended_buy: number;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

interface InventorySectionProps {
  propertyId: string;
}

export default function InventorySection({ propertyId }: InventorySectionProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState({ supplyId: '', qty: 0, source: 'manual' });

  useEffect(() => {
    loadInventory();
  }, [propertyId]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/inventory?propertyId=${propertyId}`);
      const data = await response.json();
      
      if (data.success) {
        setInventory(data.data.snapshot || []);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await fetch(`/api/admin/recommend?propertyId=${propertyId}&horizonDays=21`);
      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.data.recommendations || []);
        setShowRecommendations(true);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleAddItem = async () => {
    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          supplyId: newItem.supplyId,
          qty: newItem.qty,
          action: 'in',
          source: newItem.source
        })
      });

      if (response.ok) {
        setShowAddDialog(false);
        setNewItem({ supplyId: '', qty: 0, source: 'manual' });
        loadInventory();
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleAdjustItem = async (supplyId: string, qty: number, reason: string) => {
    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          supplyId,
          qty,
          action: 'adjust',
          reason
        })
      });

      if (response.ok) {
        loadInventory();
      }
    } catch (error) {
      console.error('Error adjusting item:', error);
    }
  };

  const exportInventory = async () => {
    try {
      const response = await fetch(`/api/admin/exports?type=inventory&propertyId=${propertyId}&format=csv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting inventory:', error);
    }
  };

  if (loading) {
    return (
      <div className="inventory-section">
        <h3>Zásoby</h3>
        <p>Načítání...</p>
      </div>
    );
  }

  return (
    <div className="inventory-section">
      <div className="inventory-header">
        <h3>Zásoby</h3>
        <div className="inventory-actions">
          <button 
            onClick={() => setShowAddDialog(true)}
            className="btn btn-primary"
          >
            + Přidat
          </button>
          <button 
            onClick={loadRecommendations}
            className="btn btn-secondary"
          >
            Doporučení
          </button>
          <button 
            onClick={exportInventory}
            className="btn btn-outline"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="inventory-table">
        <table>
          <thead>
            <tr>
              <th>Položka</th>
              <th>Aktuální</th>
              <th>Min</th>
              <th>Max</th>
              <th>Průměr/den</th>
              <th>Stav</th>
              <th>Akce</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.supply_id}>
                <td>{item.supply_name}</td>
                <td>{item.current_qty}</td>
                <td>{item.min_qty}</td>
                <td>{item.max_qty}</td>
                <td>{item.daily_average.toFixed(2)}</td>
                <td>
                  <span className={`status-badge ${
                    item.current_qty < item.min_qty ? 'status-low' :
                    item.current_qty > item.max_qty ? 'status-high' : 'status-ok'
                  }`}>
                    {item.current_qty < item.min_qty ? 'Nízké' :
                     item.current_qty > item.max_qty ? 'Vysoké' : 'OK'}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleAdjustItem(item.supply_id, item.current_qty, 'Manual adjustment')}
                    className="btn btn-sm"
                  >
                    Upravit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showRecommendations && (
        <div className="recommendations-section">
          <h4>Nákupní doporučení (21 dní)</h4>
          <div className="recommendations-table">
            <table>
              <thead>
                <tr>
                  <th>Položka</th>
                  <th>Doporučeno koupit</th>
                  <th>Priorita</th>
                  <th>Důvod</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((item) => (
                  <tr key={item.supply_id}>
                    <td>{item.supply_name}</td>
                    <td>{item.recommended_buy} {item.unit}</td>
                    <td>
                      <span className={`priority-badge priority-${item.priority}`}>
                        {item.priority === 'high' ? 'Vysoká' :
                         item.priority === 'medium' ? 'Střední' : 'Nízká'}
                      </span>
                    </td>
                    <td>{item.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddDialog && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Přidat položku do inventáře</h4>
            <div className="form-group">
              <label>Položka:</label>
              <select 
                value={newItem.supplyId}
                onChange={(e) => setNewItem({...newItem, supplyId: e.target.value})}
              >
                <option value="">Vyberte položku</option>
                {/* TODO: Load supplies from API */}
              </select>
            </div>
            <div className="form-group">
              <label>Množství:</label>
              <input 
                type="number"
                value={newItem.qty}
                onChange={(e) => setNewItem({...newItem, qty: parseInt(e.target.value)})}
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Zdroj:</label>
              <select 
                value={newItem.source}
                onChange={(e) => setNewItem({...newItem, source: e.target.value})}
              >
                <option value="manual">Manuální</option>
                <option value="purchase">Nákup</option>
              </select>
            </div>
            <div className="modal-actions">
              <button 
                onClick={handleAddItem}
                className="btn btn-primary"
                disabled={!newItem.supplyId || newItem.qty <= 0}
              >
                Přidat
              </button>
              <button 
                onClick={() => setShowAddDialog(false)}
                className="btn btn-secondary"
              >
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .inventory-section {
          margin-top: 2rem;
          padding: 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }

        .inventory-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .inventory-actions {
          display: flex;
          gap: 0.5rem;
        }

        .inventory-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .inventory-table th,
        .inventory-table td {
          padding: 0.5rem;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .inventory-table th {
          background-color: #f5f5f5;
          font-weight: 600;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status-low {
          background-color: #fee2e2;
          color: #dc2626;
        }

        .status-ok {
          background-color: #dcfce7;
          color: #16a34a;
        }

        .status-high {
          background-color: #fef3c7;
          color: #d97706;
        }

        .priority-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .priority-high {
          background-color: #fee2e2;
          color: #dc2626;
        }

        .priority-medium {
          background-color: #fef3c7;
          color: #d97706;
        }

        .priority-low {
          background-color: #dcfce7;
          color: #16a34a;
        }

        .recommendations-section {
          margin-top: 2rem;
          padding: 1rem;
          background-color: #f9fafb;
          border-radius: 8px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          min-width: 400px;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .modal-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }

        .btn-outline {
          background-color: transparent;
          color: #3b82f6;
          border: 1px solid #3b82f6;
        }

        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}





