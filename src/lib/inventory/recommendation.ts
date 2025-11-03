import { createSupabaseClient } from '@/lib/supabase/client';

// Types for recommendations
export interface RecommendationItem {
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

export interface InventorySnapshot {
  supply_id: string;
  supply_name: string;
  unit: string;
  current_qty: number;
  min_qty: number;
  max_qty: number;
  daily_average: number;
  last_used?: string;
}

// Get consumption data for a property and date range
export async function getConsumption(
  tenantId: string,
  propertyId: string,
  fromDate: string,
  toDate: string
): Promise<Array<{ supply_id: string; supply_name: string; unit: string; total_used: number; daily_average: number }>> {
  const supabase = createSupabaseClient();

  try {
    // Use the database function for consumption calculation
    const { data, error } = await supabase.rpc('get_consumption', {
      p_tenant_id: tenantId,
      p_property_id: propertyId,
      p_from_date: fromDate,
      p_to_date: toDate
    });

    if (error) {
      console.error('Error getting consumption data:', error);
      return [];
    }

    // Calculate daily averages
    const daysDiff = Math.ceil(
      (new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const consumptionData = (data || []).map((item: {
      supply_id: string;
      supply_name: string;
      unit: string;
      total_used: number;
    }) => ({
      supply_id: item.supply_id,
      supply_name: item.supply_name,
      unit: item.unit,
      total_used: item.total_used,
      daily_average: daysDiff > 0 ? item.total_used / daysDiff : 0
    }));

    // Log consumption data
    console.log('Consumption data retrieved:', {
      propertyId: propertyId.substring(0, 8) + '...',
      fromDate,
      toDate,
      itemsCount: consumptionData.length,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return consumptionData;

  } catch (error) {
    console.error('Error in getConsumption:', error);
    return [];
  }
}

// Get purchasing recommendations for a property
export async function getRecommendation(
  tenantId: string,
  propertyId: string,
  horizonDays: number = 21
): Promise<RecommendationItem[]> {
  const supabase = createSupabaseClient();

  try {
    // Use the database function for recommendations
    const { data, error } = await supabase.rpc('get_recommendations', {
      p_tenant_id: tenantId,
      p_property_id: propertyId,
      p_horizon_days: horizonDays
    });

    if (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }

    // Process recommendations
    const recommendations: RecommendationItem[] = (data || []).map((item: {
      supply_id: string;
      supply_name: string;
      unit: string;
      current_qty: number;
      min_qty: number;
      max_qty: number;
      daily_average: number;
    }) => ({
      supply_id: item.supply_id,
      supply_name: item.supply_name,
      unit: item.unit,
      current_qty: item.current_qty,
      min_qty: item.min_qty,
      max_qty: item.max_qty,
      daily_average: item.daily_average,
      recommended_buy: (item as any).recommended_buy,
      rationale: (item as any).rationale,
      priority: determinePriority((item as any).recommended_buy, item.current_qty, item.min_qty)
    }));

    // Log recommendations
    console.log('Recommendations generated:', {
      propertyId: propertyId.substring(0, 8) + '...',
      horizonDays,
      recommendationsCount: recommendations.length,
      highPriorityCount: recommendations.filter(r => r.priority === 'high').length,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return recommendations;

  } catch (error) {
    console.error('Error in getRecommendation:', error);
    return [];
  }
}

// Get inventory snapshot for a property
export async function getInventorySnapshot(
  tenantId: string,
  propertyId: string
): Promise<InventorySnapshot[]> {
  const supabase = createSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        supply_id,
        current_qty,
        min_qty,
        max_qty,
        supplies!inner(name, unit)
      `)
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId);

    if (error) {
      console.error('Error getting inventory snapshot:', error);
      return [];
    }

    // Get consumption data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const today = new Date().toISOString().split('T')[0];

    const consumptionData = await getConsumption(
      tenantId,
      propertyId,
      thirtyDaysAgo.toISOString().split('T')[0],
      today
    );

    // Combine inventory with consumption data
    const snapshot: InventorySnapshot[] = (data || []).map((item: {
      supply_id: string;
      supply_name: string;
      unit: string;
      current_qty: number;
      min_qty: number;
      max_qty: number;
    }) => {
      const consumption = consumptionData.find(c => c.supply_id === item.supply_id);
      
      return {
        supply_id: item.supply_id,
        supply_name: (item as any).supplies.name,
        unit: (item as any).supplies.unit,
        current_qty: item.current_qty,
        min_qty: item.min_qty,
        max_qty: item.max_qty,
        daily_average: consumption?.daily_average || 0
      };
    });

    // Log snapshot
    console.log('Inventory snapshot retrieved:', {
      propertyId: propertyId.substring(0, 8) + '...',
      itemsCount: snapshot.length,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return snapshot;

  } catch (error) {
    console.error('Error in getInventorySnapshot:', error);
    return [];
  }
}

// Determine priority based on recommendation and current state
function determinePriority(
  recommendedBuy: number,
  currentQty: number,
  minQty: number
): 'high' | 'medium' | 'low' {
  if (recommendedBuy <= 0) {
    return 'low';
  }

  if (currentQty < minQty) {
    return 'high';
  }

  if (recommendedBuy > currentQty * 0.5) {
    return 'high';
  }

  if (recommendedBuy > currentQty * 0.2) {
    return 'medium';
  }

  return 'low';
}

// Get low stock alerts
export async function getLowStockAlerts(
  tenantId: string,
  propertyId?: string
): Promise<Array<{
  property_id: string;
  property_name: string;
  supply_id: string;
  supply_name: string;
  current_qty: number;
  min_qty: number;
  unit: string;
  days_remaining: number;
}>> {
  const supabase = createSupabaseClient();

  try {
    let query = supabase
      .from('inventory')
      .select(`
        property_id,
        current_qty,
        min_qty,
        supplies!inner(name, unit),
        properties!inner(name)
      `)
      .eq('tenant_id', tenantId)
      .lt('current_qty', supabase.raw('min_qty'));

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting low stock alerts:', error);
      return [];
    }

    // Calculate days remaining based on daily average
    const alerts = await Promise.all(
      (data || []).map(async (item: {
        supply_id: string;
        supply_name: string;
        unit: string;
        current_qty: number;
        min_qty: number;
        max_qty: number;
      }) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const today = new Date().toISOString().split('T')[0];

        const consumption = await getConsumption(
          tenantId,
          (item as any).property_id,
          thirtyDaysAgo.toISOString().split('T')[0],
          today
        );

        const supplyConsumption = consumption.find(c => c.supply_id === item.supply_id);
        const dailyAverage = supplyConsumption?.daily_average || 0;
        const daysRemaining = dailyAverage > 0 ? Math.floor(item.current_qty / dailyAverage) : 999;

        return {
          property_id: (item as any).property_id,
          property_name: (item as any).properties.name,
          supply_id: item.supply_id,
          supply_name: (item as any).supplies.name,
          current_qty: item.current_qty,
          min_qty: item.min_qty,
          unit: (item as any).supplies.unit,
          days_remaining: daysRemaining
        };
      })
    );

    // Log alerts
    console.log('Low stock alerts retrieved:', {
      propertyId: propertyId?.substring(0, 8) + '...' || 'all',
      alertsCount: alerts.length,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return alerts;

  } catch (error) {
    console.error('Error in getLowStockAlerts:', error);
    return [];
  }
}

// Generate shopping list for recommendations
export async function generateShoppingList(
  tenantId: string,
  propertyId: string,
  horizonDays: number = 21
): Promise<{
  items: RecommendationItem[];
  totalItems: number;
  highPriorityItems: number;
  estimatedCost?: number;
}> {
  const recommendations = await getRecommendation(tenantId, propertyId, horizonDays);
  
  const highPriorityItems = recommendations.filter(r => r.priority === 'high').length;
  
  return {
    items: recommendations,
    totalItems: recommendations.length,
    highPriorityItems,
    estimatedCost: undefined // Could be calculated if we had price data
  };
}

// Get consumption trends for a supply
export async function getConsumptionTrends(
  tenantId: string,
  propertyId: string,
  supplyId: string,
  days: number = 30
): Promise<Array<{
  date: string;
  used: number;
  daily_average: number;
}>> {
  const supabase = createSupabaseClient();

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('inventory_movements')
      .select('created_at, qty')
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)
      .eq('supply_id', supplyId)
      .eq('type', 'out')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting consumption trends:', error);
      return [];
    }

    // Group by date and calculate daily usage
    const trends = (data || []).reduce((acc: Record<string, {
      supply_name: string;
      unit: string;
      trend: 'increasing' | 'decreasing' | 'stable';
      change_percent: number;
    }>, movement: {
      supply_id: string;
      supply_name: string;
      unit: string;
      qty_change: number;
      date: string;
    }) => {
      const date = (movement as any).created_at.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, used: 0, daily_average: 0 } as any;
      }
      (acc[date] as any).used += (movement as any).qty;
      return acc;
    }, {});

    // Calculate daily averages
    const trendArray = Object.values(trends).map((trend: any) => ({
      ...trend,
      daily_average: trend.used
    }));

    return trendArray;

  } catch (error) {
    console.error('Error in getConsumptionTrends:', error);
    return [];
  }
}




