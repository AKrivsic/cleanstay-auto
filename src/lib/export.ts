// Export utilities for CleanStay

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: 'short' | 'long' | 'iso';
}

export interface ExportData {
  [key: string]: any;
}

// CSV Export
export function exportToCSV(
  data: ExportData[],
  options: ExportOptions = {}
): void {
  const {
    filename = 'export.csv',
    includeHeaders = true,
  } = options;

  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get all unique keys from the data
  const allKeys = Array.from(
    new Set(data.flatMap(item => Object.keys(item)))
  );

  // Create CSV content
  let csvContent = '';

  // Add headers
  if (includeHeaders) {
    csvContent += allKeys.join(',') + '\n';
  }

  // Add data rows
  data.forEach(item => {
    const row = allKeys.map(key => {
      const value = item[key];
      if (value === null || value === undefined) {
        return '';
      }
      
      // Handle different data types
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
    
    csvContent += row.join(',') + '\n';
  });

  // Create and download file
  downloadFile(csvContent, filename, 'text/csv');
}

// JSON Export
export function exportToJSON(
  data: ExportData[],
  options: ExportOptions = {}
): void {
  const {
    filename = 'export.json',
  } = options;

  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

// Excel Export (using CSV format with .xlsx extension)
export function exportToExcel(
  data: ExportData[],
  options: ExportOptions = {}
): void {
  const {
    filename = 'export.xlsx',
  } = options;

  // For now, we'll export as CSV with .xlsx extension
  // In a real implementation, you'd use a library like xlsx
  exportToCSV(data, { ...options, filename });
}

// PDF Export (basic implementation)
export function exportToPDF(
  data: ExportData[],
  options: ExportOptions = {}
): void {
  const {
    filename = 'export.pdf',
  } = options;

  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create a simple HTML table
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Export</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <h1>Export Data</h1>
      <table>
        <thead>
          <tr>
            ${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(item => 
            `<tr>${Object.values(item).map(value => `<td>${value}</td>`).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // For now, we'll create an HTML file
  // In a real implementation, you'd use a library like jsPDF or Puppeteer
  downloadFile(htmlContent, filename.replace('.pdf', '.html'), 'text/html');
}

// Utility function to download file
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// Format data for export
export function formatDataForExport(
  data: any[],
  fields: { [key: string]: string },
  dateFormat: 'short' | 'long' | 'iso' = 'short'
): ExportData[] {
  return data.map(item => {
    const formatted: ExportData = {};
    
    Object.entries(fields).forEach(([key, label]) => {
      let value = item[key];
      
      // Format dates
      if (value && (key.includes('date') || key.includes('created') || key.includes('updated'))) {
        value = formatDate(value, dateFormat);
      }
      
      // Format booleans
      if (typeof value === 'boolean') {
        value = value ? 'Ano' : 'Ne';
      }
      
      // Format arrays
      if (Array.isArray(value)) {
        value = value.join(', ');
      }
      
      // Format objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        value = JSON.stringify(value);
      }
      
      formatted[label] = value;
    });
    
    return formatted;
  });
}

// Format date for export
function formatDate(date: string | Date, format: 'short' | 'long' | 'iso'): string {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return String(date);
  }
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('cs-CZ');
    case 'long':
      return d.toLocaleDateString('cs-CZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'iso':
      return d.toISOString();
    default:
      return d.toLocaleDateString('cs-CZ');
  }
}

// Export specific data types
export const exportMappings = {
  users: {
    name: 'Jméno',
    email: 'Email',
    role: 'Role',
    phone: 'Telefon',
    created_at: 'Vytvořeno',
    updated_at: 'Aktualizováno',
  },
  properties: {
    name: 'Název',
    address: 'Adresa',
    type: 'Typ',
    size_sqm: 'Rozloha (m²)',
    bathrooms: 'Počet koupelen',
    created_at: 'Vytvořeno',
    updated_at: 'Aktualizováno',
  },
  cleanings: {
    property_name: 'Nemovitost',
    cleaner_name: 'Uklízečka',
    client_name: 'Klient',
    scheduled_date: 'Naplánováno',
    status: 'Stav',
    priority: 'Priorita',
    created_at: 'Vytvořeno',
  },
};
