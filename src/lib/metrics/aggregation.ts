import { getSupabaseServerClient } from '../supabase/server';
import { logSystemAction, AUDIT_ACTIONS, AUDIT_TABLES } from '../audit';

export interface DailyMetrics {
  date: string;
  ai_tokens_in: number;
  ai_tokens_out: number;
  ai_cost_eur: number;
  whatsapp_messages_in: number;
  whatsapp_messages_out: number;
  whatsapp_cost_eur: number;
  cleanings_done: number;
  photos_uploaded: number;
  supplies_out: number;
  avg_cleaning_time_min: number;
}

export interface MonthlyKPI {
  month: string;
  revenue_est: number;
  costs_est: number;
  profit_est: number;
  avg_rating: number;
  utilization_rate: number;
  total_cleanings: number;
}

export interface MetricsSummary {
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

/**
 * Aggregate daily metrics for a specific tenant and date
 * @param tenantId - Tenant ID
 * @param date - Date to aggregate (YYYY-MM-DD)
 */
export async function aggregateDailyMetrics(
  tenantId: string,
  date: string
): Promise<DailyMetrics> {
  try {
    const supabase = getSupabaseServerClient();
    
    // Call the PostgreSQL function
    const { data, error } = await supabase.rpc('aggregate_daily_metrics', {
      p_tenant_id: tenantId,
      p_date: date
    });

    if (error) {
      console.error('Error aggregating daily metrics:', error);
      throw error;
    }

    // Log the aggregation
    await logSystemAction(
      tenantId,
      AUDIT_ACTIONS.SYSTEM_ACTION,
      AUDIT_TABLES.AUDIT_LOG,
      undefined,
      {
        action: 'daily_metrics_aggregation',
        date,
        stats: data
      }
    );

    return data as DailyMetrics;
  } catch (error) {
    console.error('Error in aggregateDailyMetrics:', error);
    throw error;
  }
}

/**
 * Aggregate monthly KPIs for a specific tenant and month
 * @param tenantId - Tenant ID
 * @param month - Month to aggregate (YYYY-MM-01)
 */
export async function aggregateMonthlyKPI(
  tenantId: string,
  month: string
): Promise<MonthlyKPI> {
  try {
    const supabase = getSupabaseServerClient();
    
    // Call the PostgreSQL function
    const { data, error } = await supabase.rpc('aggregate_monthly_kpi', {
      p_tenant_id: tenantId,
      p_month: month
    });

    if (error) {
      console.error('Error aggregating monthly KPI:', error);
      throw error;
    }

    // Log the aggregation
    await logSystemAction(
      tenantId,
      AUDIT_ACTIONS.SYSTEM_ACTION,
      AUDIT_TABLES.AUDIT_LOG,
      undefined,
      {
        action: 'monthly_kpi_aggregation',
        month,
        stats: data
      }
    );

    return data as MonthlyKPI;
  } catch (error) {
    console.error('Error in aggregateMonthlyKPI:', error);
    throw error;
  }
}

/**
 * Get daily metrics summary for a date range
 * @param tenantId - Tenant ID
 * @param fromDate - Start date (YYYY-MM-DD)
 * @param toDate - End date (YYYY-MM-DD)
 */
export async function getDailyMetricsSummary(
  tenantId: string,
  fromDate: string,
  toDate: string
): Promise<DailyMetrics[]> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase.rpc('get_daily_metrics_summary', {
      p_tenant_id: tenantId,
      p_from_date: fromDate,
      p_to_date: toDate
    });

    if (error) {
      console.error('Error fetching daily metrics summary:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDailyMetricsSummary:', error);
    throw error;
  }
}

/**
 * Get monthly KPIs for a specific year
 * @param tenantId - Tenant ID
 * @param year - Year (YYYY)
 */
export async function getMonthlyKPIs(
  tenantId: string,
  year: number
): Promise<MonthlyKPI[]> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase.rpc('get_monthly_kpis', {
      p_tenant_id: tenantId,
      p_year: year
    });

    if (error) {
      console.error('Error fetching monthly KPIs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMonthlyKPIs:', error);
    throw error;
  }
}

/**
 * Get metrics summary for dashboard
 * @param tenantId - Tenant ID
 */
export async function getMetricsSummary(tenantId: string): Promise<MetricsSummary> {
  try {
    const supabase = getSupabaseServerClient();
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7) + '-01';

    // Get today's metrics
    const { data: todayMetrics, error: todayError } = await supabase
      .from('metrics_daily')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('date', today)
      .single();

    if (todayError && todayError.code !== 'PGRST116') {
      console.error('Error fetching today metrics:', todayError);
    }

    // Get this month's KPI
    const { data: monthKPI, error: monthError } = await supabase
      .from('kpi_monthly')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('month', thisMonth)
      .single();

    if (monthError && monthError.code !== 'PGRST116') {
      console.error('Error fetching month KPI:', monthError);
    }

    return {
      today: {
        cleanings_done: todayMetrics?.cleanings_done || 0,
        photos_uploaded: todayMetrics?.photos_uploaded || 0,
        ai_cost_eur: todayMetrics?.ai_cost_eur || 0,
        whatsapp_cost_eur: todayMetrics?.whatsapp_cost_eur || 0,
        total_cost_eur: (todayMetrics?.ai_cost_eur || 0) + (todayMetrics?.whatsapp_cost_eur || 0)
      },
      this_month: {
        revenue_est: monthKPI?.revenue_est || 0,
        costs_est: monthKPI?.costs_est || 0,
        profit_est: monthKPI?.profit_est || 0,
        utilization_rate: monthKPI?.utilization_rate || 0
      }
    };
  } catch (error) {
    console.error('Error in getMetricsSummary:', error);
    throw error;
  }
}

/**
 * Check cost limits and create alerts if exceeded
 * @param tenantId - Tenant ID
 * @param date - Date to check (YYYY-MM-DD)
 */
export async function checkCostLimits(
  tenantId: string,
  date: string
): Promise<{ ai_limit_exceeded: boolean; whatsapp_limit_exceeded: boolean }> {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get today's metrics
    const { data: metrics, error } = await supabase
      .from('metrics_daily')
      .select('ai_cost_eur, whatsapp_cost_eur')
      .eq('tenant_id', tenantId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching metrics for cost check:', error);
      return { ai_limit_exceeded: false, whatsapp_limit_exceeded: false };
    }

    const aiCost = metrics?.ai_cost_eur || 0;
    const whatsappCost = metrics?.whatsapp_cost_eur || 0;
    
    const aiLimitExceeded = aiCost > 2.0; // €2 daily limit
    const whatsappLimitExceeded = whatsappCost > 5.0; // €5 daily limit

    // Create alert events if limits exceeded
    if (aiLimitExceeded) {
      await logSystemAction(
        tenantId,
        'alert_cost_limit',
        AUDIT_TABLES.AUDIT_LOG,
        undefined,
        {
          type: 'ai_cost_limit',
          date,
          cost: aiCost,
          limit: 2.0,
          exceeded_by: aiCost - 2.0
        }
      );
    }

    if (whatsappLimitExceeded) {
      await logSystemAction(
        tenantId,
        'alert_cost_limit',
        AUDIT_TABLES.AUDIT_LOG,
        undefined,
        {
          type: 'whatsapp_cost_limit',
          date,
          cost: whatsappCost,
          limit: 5.0,
          exceeded_by: whatsappCost - 5.0
        }
      );
    }

    return {
      ai_limit_exceeded: aiLimitExceeded,
      whatsapp_limit_exceeded: whatsappLimitExceeded
    };
  } catch (error) {
    console.error('Error in checkCostLimits:', error);
    return { ai_limit_exceeded: false, whatsapp_limit_exceeded: false };
  }
}

/**
 * Get cost trends for the last 30 days
 * @param tenantId - Tenant ID
 */
export async function getCostTrends(tenantId: string): Promise<{
  dates: string[];
  ai_costs: number[];
  whatsapp_costs: number[];
  total_costs: number[];
}> {
  try {
    const supabase = getSupabaseServerClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
    const toDate = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('metrics_daily')
      .select('date, ai_cost_eur, whatsapp_cost_eur')
      .eq('tenant_id', tenantId)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date');

    if (error) {
      console.error('Error fetching cost trends:', error);
      throw error;
    }

    const dates: string[] = [];
    const aiCosts: number[] = [];
    const whatsappCosts: number[] = [];
    const totalCosts: number[] = [];

    data?.forEach((metric: any) => {
      dates.push(metric.date);
      aiCosts.push(metric.ai_cost_eur || 0);
      whatsappCosts.push(metric.whatsapp_cost_eur || 0);
      totalCosts.push((metric.ai_cost_eur || 0) + (metric.whatsapp_cost_eur || 0));
    });

    return {
      dates,
      ai_costs: aiCosts,
      whatsapp_costs: whatsappCosts,
      total_costs: totalCosts
    };
  } catch (error) {
    console.error('Error in getCostTrends:', error);
    throw error;
  }
}

/**
 * Get cleaning performance trends
 * @param tenantId - Tenant ID
 */
export async function getCleaningPerformanceTrends(tenantId: string): Promise<{
  dates: string[];
  cleanings_done: number[];
  avg_cleaning_time: number[];
  photos_uploaded: number[];
}> {
  try {
    const supabase = getSupabaseServerClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
    const toDate = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('metrics_daily')
      .select('date, cleanings_done, avg_cleaning_time_min, photos_uploaded')
      .eq('tenant_id', tenantId)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date');

    if (error) {
      console.error('Error fetching cleaning performance trends:', error);
      throw error;
    }

    const dates: string[] = [];
    const cleaningsDone: number[] = [];
    const avgCleaningTime: number[] = [];
    const photosUploaded: number[] = [];

    data?.forEach((metric: any) => {
      dates.push(metric.date);
      cleaningsDone.push(metric.cleanings_done || 0);
      avgCleaningTime.push(metric.avg_cleaning_time_min || 0);
      photosUploaded.push(metric.photos_uploaded || 0);
    });

    return {
      dates,
      cleanings_done: cleaningsDone,
      avg_cleaning_time: avgCleaningTime,
      photos_uploaded: photosUploaded
    };
  } catch (error) {
    console.error('Error in getCleaningPerformanceTrends:', error);
    throw error;
  }
}




