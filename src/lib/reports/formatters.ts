import { CleaningReport, PhotosReport, InventoryReport } from '@/app/api/admin/reports/_data';

// Format cleaning report for chat (WhatsApp/AI)
export function formatCleaningReportForChat(report: CleaningReport): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`📋 Úklid ${report.property.name} - ${formatDate(report.date)}`);
  
  // Status and duration
  if (report.startedAt && report.endedAt) {
    lines.push(`✅ Dokončeno (${report.durationMin} min)`);
  } else if (report.startedAt) {
    lines.push(`🔄 Probíhá od ${formatTime(report.startedAt)}`);
  } else {
    lines.push(`❓ Žádný úklid v tento den`);
  }
  
  // Cleaner info
  if (report.cleaner) {
    lines.push(`👤 ${report.cleaner.name} (${report.cleaner.phone})`);
  }
  
  // Summary
  if (report.summary.notesCount > 0) {
    lines.push(`📝 ${report.summary.notesCount} poznámek`);
  }
  
  if (report.summary.photosCount > 0) {
    lines.push(`📸 ${report.summary.photosCount} fotek`);
  }
  
  if (report.summary.supplies.length > 0) {
    lines.push(`📦 Doplněno: ${report.summary.supplies.slice(0, 3).join(', ')}`);
  }
  
  if (report.summary.linen.changed || report.summary.linen.dirty) {
    const linenInfo = [];
    if (report.summary.linen.changed) linenInfo.push(`${report.summary.linen.changed} změněno`);
    if (report.summary.linen.dirty) linenInfo.push(`${report.summary.linen.dirty} špinavé`);
    lines.push(`🛏️ Prádlo: ${linenInfo.join(', ')}`);
  }
  
  // Limit to 6 lines max
  return lines.slice(0, 6).join('\n');
}

// Format photos report for chat
export function formatPhotosForChat(report: PhotosReport): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`📸 Fotky ${report.property.name} - ${formatDate(report.date)}`);
  
  if (report.items.length === 0) {
    lines.push(`❌ Žádné fotky k dispozici`);
    return lines.join('\n');
  }
  
  // Group by phase
  const byPhase = report.items.reduce((acc, item) => {
    if (!acc[item.phase]) acc[item.phase] = [];
    acc[item.phase].push(item);
    return acc;
  }, {} as Record<string, typeof report.items>);
  
  // Add phase summaries
  Object.entries(byPhase).forEach(([phase, items]) => {
    const phaseLabel = getPhaseLabel(phase);
    lines.push(`${phaseLabel}: ${items.length} fotek`);
  });
  
  // Summary
  lines.push(`📊 Celkem ${report.items.length} fotek`);
  
  return lines.join('\n');
}

// Format inventory report for chat
export function formatInventoryForChat(report: InventoryReport): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`📦 Zásoby ${report.property.name} (${formatDateRange(report.range.from, report.range.to)})`);
  
  if (report.consumption.length === 0) {
    lines.push(`❌ Žádná spotřeba v období`);
    return lines.join('\n');
  }
  
  // Top 5 consumed items
  const topItems = report.consumption.slice(0, 5);
  lines.push(`🔝 Top spotřeba:`);
  
  topItems.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.item}: ${item.used} ${item.unit}`);
  });
  
  // Recommendation
  if (report.recommendation && report.recommendation.length > 0) {
    const topRecommendation = report.recommendation[0];
    lines.push(`💡 Doporučení: ${topRecommendation.item} (${topRecommendation.buy} ks)`);
  }
  
  return lines.join('\n');
}

// Helper functions
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ');
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('cs-CZ', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function formatDateRange(from: string, to: string): string {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  if (from === to) {
    return formatDate(from);
  }
  
  return `${formatDate(from)} - ${formatDate(to)}`;
}

function getPhaseLabel(phase: string): string {
  switch (phase) {
    case 'before':
      return '🔵 Před úklidem';
    case 'after':
      return '🟢 Po úklidu';
    case 'other':
      return '⚪ Během úklidu';
    default:
      return '📷 Fotky';
  }
}

// Format error messages for chat
export function formatErrorForChat(error: string): string {
  return `❌ Chyba: ${error}`;
}

// Format ambiguous query response
export function formatAmbiguousQueryForChat(propertyHints: string[]): string {
  const lines: string[] = [];
  lines.push(`❓ Který byt máte na mysli?`);
  lines.push(`🏠 Dostupné byty:`);
  
  propertyHints.forEach((hint, index) => {
    lines.push(`${index + 1}. ${hint}`);
  });
  
  return lines.join('\n');
}

// Format "no data" response
export function formatNoDataForChat(dataType: string, propertyName: string, date?: string): string {
  const lines: string[] = [];
  lines.push(`❌ Žádné ${dataType} pro ${propertyName}`);
  
  if (date) {
    lines.push(`📅 Datum: ${formatDate(date)}`);
  }
  
  lines.push(`💡 Zkuste jiné datum nebo kontaktujte podporu`);
  
  return lines.join('\n');
}





