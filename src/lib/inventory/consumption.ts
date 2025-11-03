import { createSupabaseClient } from '@/lib/supabase/client';
import { normalizeItems, extractQuantity } from './normalize';

// Types for consumption tracking
export interface InventoryMovement {
  id: string;
  tenant_id: string;
  property_id: string;
  supply_id: string;
  type: 'in' | 'out' | 'adjust';
  qty: number;
  source: string;
  ref_event_id?: string;
  created_at: string;
}

export interface ConsumptionData {
  supply_id: string;
  supply_name: string;
  unit: string;
  total_used: number;
  daily_average: number;
  last_used?: string;
}

// Apply supply out from event (creates inventory movements)
export async function applySupplyOutFromEvent(
  event: {
    id: string;
    tenant_id: string;
    property_id: string;
    note?: string;
    payload?: Record<string, unknown>;
  }
): Promise<{ movements: InventoryMovement[]; errors: string[] }> {
  const supabase = createSupabaseClient();
  const movements: InventoryMovement[] = [];
  const errors: string[] = [];

  try {
    // Extract items from event
    let items: string[] = [];
    
    if (event.payload?.items && Array.isArray(event.payload.items)) {
      items = event.payload.items;
    } else if (event.note) {
      // Parse note for items (comma-separated or line-separated)
      items = event.note.split(/[,\n]/).map(item => item.trim()).filter(Boolean);
    }

    if (items.length === 0) {
      errors.push('No items found in event');
      return { movements, errors };
    }

    // Normalize items
    const normalizedItems = await normalizeItems(items, event.tenant_id);

    // Create movements for each normalized item
    for (const item of normalizedItems) {
      if (item.supplyId && item.qty && item.qty > 0) {
        const { data: movement, error } = await supabase
          .from('inventory_movements')
          .insert({
            tenant_id: event.tenant_id,
            property_id: event.property_id,
            supply_id: item.supplyId,
            type: 'out',
            qty: item.qty,
            source: 'event:supply_out',
            ref_event_id: event.id
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating movement:', error);
          errors.push(`Failed to create movement for ${item.name}: ${error.message}`);
        } else if (movement) {
          movements.push(movement);
        }
      } else {
        // Item needs mapping
        errors.push(`Item "${item.name}" needs mapping to supply`);
      }
    }

    // Log results
    console.log('Supply out applied:', {
      eventId: event.id,
      itemsCount: items.length,
      movementsCount: movements.length,
      errorsCount: errors.length,
      tenantId: event.tenant_id.substring(0, 8) + '...'
    });

    return { movements, errors };

  } catch (error) {
    console.error('Error in applySupplyOutFromEvent:', error);
    errors.push(`Failed to process event: ${error}`);
    return { movements, errors };
  }
}

// Apply manual inventory in (adds items to inventory)
export async function applyManualIn(
  tenantId: string,
  propertyId: string,
  supplyId: string,
  qty: number,
  source: 'manual' | 'purchase' = 'manual'
): Promise<{ success: boolean; movement?: InventoryMovement; error?: string }> {
  const supabase = createSupabaseClient();

  try {
    if (qty <= 0) {
      return { success: false, error: 'Quantity must be positive' };
    }

    // Create movement
    const { data: movement, error } = await supabase
      .from('inventory_movements')
      .insert({
        tenant_id: tenantId,
        property_id: propertyId,
        supply_id: supplyId,
        type: 'in',
        qty: qty,
        source: source
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating manual in movement:', error);
      return { success: false, error: error.message };
    }

    // Log success
    console.log('Manual in applied:', {
      propertyId: propertyId.substring(0, 8) + '...',
      supplyId: supplyId.substring(0, 8) + '...',
      qty,
      source,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return { success: true, movement };

  } catch (error) {
    console.error('Error in applyManualIn:', error);
    return { success: false, error: `Failed to add inventory: ${error}` };
  }
}

// Apply manual inventory adjustment
export async function applyManualAdjust(
  tenantId: string,
  propertyId: string,
  supplyId: string,
  qty: number,
  reason: string
): Promise<{ success: boolean; movement?: InventoryMovement; error?: string }> {
  const supabase = createSupabaseClient();

  try {
    // Create adjustment movement
    const { data: movement, error } = await supabase
      .from('inventory_movements')
      .insert({
        tenant_id: tenantId,
        property_id: propertyId,
        supply_id: supplyId,
        type: 'adjust',
        qty: qty,
        source: `manual:${reason}`
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating adjustment movement:', error);
      return { success: false, error: error.message };
    }

    // Log success
    console.log('Manual adjustment applied:', {
      propertyId: propertyId.substring(0, 8) + '...',
      supplyId: supplyId.substring(0, 8) + '...',
      qty,
      reason,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return { success: true, movement };

  } catch (error) {
    console.error('Error in applyManualAdjust:', error);
    return { success: false, error: `Failed to adjust inventory: ${error}` };
  }
}

// Recount inventory for a property (recalculates current_qty from movements)
export async function recount(
  tenantId: string,
  propertyId: string
): Promise<{ success: boolean; updated: number; error?: string }> {
  const supabase = createSupabaseClient();

  try {
    // Get all inventory records for the property
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('supply_id')
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId);

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError);
      return { success: false, updated: 0, error: inventoryError.message };
    }

    let updatedCount = 0;

    // Recalculate each supply
    for (const inv of inventory || []) {
      const { data: movements, error: movementsError } = await supabase
        .from('inventory_movements')
        .select('type, qty')
        .eq('tenant_id', tenantId)
        .eq('property_id', propertyId)
        .eq('supply_id', inv.supply_id);

      if (movementsError) {
        console.error('Error fetching movements:', movementsError);
        continue;
      }

      // Calculate current quantity
      let currentQty = 0;
      for (const movement of movements || []) {
        switch (movement.type) {
          case 'in':
            currentQty += movement.qty;
            break;
          case 'out':
            currentQty -= movement.qty;
            break;
          case 'adjust':
            currentQty = movement.qty; // Adjustments set absolute value
            break;
        }
      }

      // Update inventory record
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ current_qty: currentQty })
        .eq('tenant_id', tenantId)
        .eq('property_id', propertyId)
        .eq('supply_id', inv.supply_id);

      if (updateError) {
        console.error('Error updating inventory:', updateError);
        continue;
      }

      updatedCount++;
    }

    // Log recount results
    console.log('Inventory recounted:', {
      propertyId: propertyId.substring(0, 8) + '...',
      updatedCount,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return { success: true, updated: updatedCount };

  } catch (error) {
    console.error('Error in recount:', error);
    return { success: false, updated: 0, error: `Failed to recount inventory: ${error}` };
  }
}

// Get consumption data for a property and date range
export async function getConsumptionData(
  tenantId: string,
  propertyId: string,
  fromDate: string,
  toDate: string
): Promise<ConsumptionData[]> {
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

    const consumptionData: ConsumptionData[] = (data || []).map((item: {
      supply_id: string;
      supply_name: string;
      unit: string;
      total_used: number;
      date: string;
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
    console.error('Error in getConsumptionData:', error);
    return [];
  }
}

// Process linen usage from events
export async function applyLinenUsageFromEvent(
  event: {
    id: string;
    tenant_id: string;
    property_id: string;
    payload?: Record<string, unknown>;
  }
): Promise<{ movements: InventoryMovement[]; errors: string[] }> {
  const supabase = createSupabaseClient();
  const movements: InventoryMovement[] = [];
  const errors: string[] = [];

  try {
    const payload = event.payload || {};
    const changed = payload.changed || 0;
    const dirty = payload.dirty || 0;

    if ((changed as number) <= 0 && (dirty as number) <= 0) {
      return { movements, errors };
    }

    // Find linen supply (assuming it exists)
    const { data: linenSupply, error: supplyError } = await supabase
      .from('supplies')
      .select('id')
      .eq('tenant_id', event.tenant_id)
      .ilike('name', '%povlečení%')
      .or('name.ilike.%ložní prádlo%,name.ilike.%prádlo%')
      .single();

    if (supplyError || !linenSupply) {
      errors.push('Linen supply not found');
      return { movements, errors };
    }

    // Create movements for changed linen
    if ((changed as number) > 0) {
      const { data: movement, error } = await supabase
        .from('inventory_movements')
        .insert({
          tenant_id: event.tenant_id,
          property_id: event.property_id,
          supply_id: linenSupply.id,
          type: 'out',
          qty: changed as number,
          source: 'event:linen_used',
          ref_event_id: event.id
        })
        .select()
        .single();

      if (error) {
        errors.push(`Failed to create linen movement: ${error.message}`);
      } else if (movement) {
        movements.push(movement);
      }
    }

    return { movements, errors };

  } catch (error) {
    console.error('Error in applyLinenUsageFromEvent:', error);
    errors.push(`Failed to process linen usage: ${error}`);
    return { movements, errors };
  }
}




