'use client';

interface ExportButtonProps {
  data: any[];
  filename: string;
  columns: { key: string; label: string }[];
  label?: string;
  icon?: string;
  className?: string;
}

export default function ExportButton({ data, filename, columns, label = "Export CSV", icon = "📥", className }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    const header = columns.map(c => c.label).join(',');
    const rows = data.map(item => 
      columns.map(c => {
        const val = item[c.key] !== undefined ? item[c.key] : '';
        // Escape commas and wrap in quotes
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csvContent = `\uFEFF${header}\n${rows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleExport}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${className || 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'}`}
    >
      <span>{icon}</span> {label}
    </button>
  );
}
