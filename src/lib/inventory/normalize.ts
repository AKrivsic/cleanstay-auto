import { createSupabaseClient } from '@/lib/supabase/client';

// Types for normalization
export interface NormalizedItem {
  supplyId?: string;
  qty?: number;
  name: string;
  needsMapping?: boolean;
  confidence?: number;
}

export interface SupplyAlias {
  id: string;
  supply_id: string;
  alias: string;
}

// Fuzzy match configuration
const FUZZY_MATCH_THRESHOLD = 0.6;
const MIN_CONFIDENCE = 0.5;

// Common item mappings for better normalization
const COMMON_MAPPINGS: Record<string, string> = {
  'domestos': 'Domestos',
  'domestox': 'Domestos',
  'kapsle': 'Kávové kapsle',
  'kapsle kafe': 'Kávové kapsle',
  'kávové kapsle': 'Kávové kapsle',
  'toaletní papír': 'Toaletní papír',
  'toaletak': 'Toaletní papír',
  'papír': 'Toaletní papír',
  'ručníky': 'Ručníky',
  'ručník': 'Ručníky',
  'povlečení': 'Povlečení set',
  'povlečení set': 'Povlečení set',
  'ložní prádlo': 'Povlečení set',
  'savó': 'Savó',
  'savo': 'Savó',
  'savon': 'Savó',
  'jar': 'Jar'
};

// Normalize items from free text to structured data
export async function normalizeItems(
  textItems: string[],
  tenantId: string
): Promise<NormalizedItem[]> {
  const supabase = createSupabaseClient();
  
  try {
    // Get all supplies for the tenant
    const { data: supplies, error: suppliesError } = await supabase
      .from('supplies')
      .select('id, name, unit')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (suppliesError) {
      console.error('Error fetching supplies:', suppliesError);
      return textItems.map(item => ({
        name: item,
        needsMapping: true
      }));
    }

    // Get aliases for better matching
    const { data: aliases, error: aliasesError } = await supabase
      .from('supply_aliases')
      .select('supply_id, alias')
      .eq('tenant_id', tenantId);

    if (aliasesError) {
      console.error('Error fetching aliases:', aliasesError);
    }

    // Create alias mapping
    const aliasMap = new Map<string, string>();
    aliases?.forEach((alias: any) => {
      aliasMap.set(alias.alias.toLowerCase(), alias.supply_id);
    });

    // Normalize each item
    const normalizedItems: NormalizedItem[] = [];

    for (const textItem of textItems) {
      const normalized = await normalizeSingleItem(
        textItem,
        supplies || [],
        aliasMap
      );
      normalizedItems.push(normalized);
    }

    // Log normalization results
    console.log('Items normalized:', {
      inputCount: textItems.length,
      normalizedCount: normalizedItems.length,
      needsMappingCount: normalizedItems.filter(item => item.needsMapping).length,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return normalizedItems;

  } catch (error) {
    console.error('Error in normalizeItems:', error);
    // Fallback: return items with needsMapping flag
    return textItems.map(item => ({
      name: item,
      needsMapping: true
    }));
  }
}

// Normalize a single item
async function normalizeSingleItem(
  textItem: string,
  supplies: Array<{ id: string; name: string; unit: string }>,
  aliasMap: Map<string, string>
): Promise<NormalizedItem> {
  const cleanItem = textItem.trim().toLowerCase();
  
  // Check common mappings first
  const commonMapped = COMMON_MAPPINGS[cleanItem];
  if (commonMapped) {
    const supply = supplies.find(s => s.name.toLowerCase() === commonMapped.toLowerCase());
    if (supply) {
      return {
        supplyId: supply.id,
        name: supply.name,
        qty: 1,
        confidence: 0.9
      };
    }
  }

  // Check aliases
  const aliasSupplyId = aliasMap.get(cleanItem);
  if (aliasSupplyId) {
    const supply = supplies.find(s => s.id === aliasSupplyId);
    if (supply) {
      return {
        supplyId: supply.id,
        name: supply.name,
        qty: 1,
        confidence: 0.8
      };
    }
  }

  // Fuzzy match against supplies
  let bestMatch: { supply: { id: string; name: string; unit: string }; score: number } | null = null;
  
  for (const supply of supplies) {
    const score = calculateSimilarity(cleanItem, supply.name.toLowerCase());
    if (score >= FUZZY_MATCH_THRESHOLD && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { supply, score };
    }
  }

  if (bestMatch && bestMatch.score >= MIN_CONFIDENCE) {
    return {
      supplyId: bestMatch.supply.id,
      name: bestMatch.supply.name,
      qty: 1,
      confidence: bestMatch.score
    };
  }

  // No match found
  return {
    name: textItem,
    needsMapping: true,
    confidence: 0
  };
}

// Calculate similarity between two strings (Levenshtein distance based)
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  // Create matrix
  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  
  return 1 - (distance / maxLen);
}

// Extract quantity from text (e.g., "3x Domestos" -> {qty: 3, name: "Domestos"})
export function extractQuantity(text: string): { qty: number; name: string } {
  const match = text.match(/^(\d+)\s*[x×]\s*(.+)$/i);
  if (match) {
    return {
      qty: parseInt(match[1], 10),
      name: match[2].trim()
    };
  }
  
  return { qty: 1, name: text };
}

// Create supply alias for better future matching
export async function createSupplyAlias(
  tenantId: string,
  supplyId: string,
  alias: string
): Promise<boolean> {
  const supabase = createSupabaseClient();
  
  try {
    const { error } = await supabase
      .from('supply_aliases')
      .insert({
        tenant_id: tenantId,
        supply_id: supplyId,
        alias: alias.toLowerCase()
      });

    if (error) {
      console.error('Error creating supply alias:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in createSupplyAlias:', error);
    return false;
  }
}

// Get suggestions for unmapped items
export async function getMappingSuggestions(
  tenantId: string,
  unmappedItems: string[]
): Promise<Array<{ item: string; suggestions: Array<{ id: string; name: string; score: number }> }>> {
  const supabase = createSupabaseClient();
  
  try {
    const { data: supplies, error } = await supabase
      .from('supplies')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error || !supplies) {
      return [];
    }

    const suggestions = unmappedItems.map(item => {
      const itemSuggestions = supplies
        .map((supply: any) => ({
          id: supply.id,
          name: supply.name,
          score: calculateSimilarity(item.toLowerCase(), supply.name.toLowerCase())
        }))
        .filter((suggestion: any) => suggestion.score >= 0.3)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 3);

      return {
        item,
        suggestions: itemSuggestions
      };
    });

    return suggestions;
  } catch (error) {
    console.error('Error in getMappingSuggestions:', error);
    return [];
  }
}




