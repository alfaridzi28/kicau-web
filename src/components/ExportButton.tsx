'use client';

import * as XLSX from 'xlsx';

interface ExportButtonProps {
  data?: any[];
  filename: string;
  columns: { key: string; label: string }[];
  label?: string;
  icon?: string;
  className?: string;
  sheets?: { name: string; data: any[] }[]; // Support for multiple sheets
}

export default function ExportButton({ data, filename, columns, label = "Export Excel", icon = "📊", className, sheets }: ExportButtonProps) {
  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new();

      if (sheets && sheets.length > 0) {
        // Multi-sheet mode
        sheets.forEach(sheet => {
          const wsData = sheet.data.map(item => {
            const row: any = {};
            columns.forEach(col => {
              row[col.label] = item[col.key] !== undefined ? item[col.key] : '';
            });
            return row;
          });
          const ws = XLSX.utils.json_to_sheet(wsData);
          XLSX.utils.book_append_sheet(wb, ws, sheet.name);
        });
      } else if (data && data.length > 0) {
        // Single sheet mode
        const wsData = data.map(item => {
          const row: any = {};
          columns.forEach(col => {
            row[col.label] = item[col.key] !== undefined ? item[col.key] : '';
          });
          return row;
        });
        const ws = XLSX.utils.json_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Data");
      } else {
        alert("Tidak ada data untuk diekspor");
        return;
      }

      // Generate file and trigger download
      XLSX.writeFile(wb, `${filename}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
    } catch (err) {
      console.error("Export error:", err);
      alert("Gagal melakukan export data");
    }
  };

  return (
    <button 
      onClick={handleExport}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg ${className || 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20 border border-white/10'}`}
    >
      <span className="text-sm">{icon}</span> {label}
    </button>
  );
}
