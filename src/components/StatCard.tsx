interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan' | 'indigo' | 'emerald' | 'pink';
  subtitle?: string;
  trend?: string;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'bg-blue-500/20 text-blue-400',
    title: 'text-blue-400',
    value: 'text-blue-100',
  },
  green: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: 'bg-emerald-500/20 text-emerald-400',
    title: 'text-emerald-400',
    value: 'text-emerald-100',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    icon: 'bg-purple-500/20 text-purple-400',
    title: 'text-purple-400',
    value: 'text-purple-100',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: 'bg-orange-500/20 text-orange-400',
    title: 'text-orange-400',
    value: 'text-orange-100',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: 'bg-red-500/20 text-red-400',
    title: 'text-red-400',
    value: 'text-red-100',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    icon: 'bg-cyan-500/20 text-cyan-400',
    title: 'text-cyan-400',
    value: 'text-cyan-100',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    icon: 'bg-indigo-500/20 text-indigo-400',
    title: 'text-indigo-400',
    value: 'text-indigo-100',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: 'bg-emerald-500/20 text-emerald-400',
    title: 'text-emerald-400',
    value: 'text-emerald-100',
  },
  pink: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    icon: 'bg-pink-500/20 text-pink-400',
    title: 'text-pink-400',
    value: 'text-pink-100',
  },
};

export default function StatCard({ title, value, icon, color, subtitle, trend }: StatCardProps) {
  const c = (colorMap as any)[color] || colorMap.blue;
  return (
    <div className={`rounded-2xl border ${c.bg} ${c.border} p-5 flex items-start gap-4 hover:scale-[1.02] transition-transform duration-200`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${c.icon} flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wider ${c.title} mb-1`}>{title}</p>
        <p className={`text-2xl font-bold ${c.value} truncate`}>{value}</p>
        {subtitle && <p className="text-white/40 text-xs mt-0.5">{subtitle}</p>}
        {trend && <p className="text-white/50 text-xs mt-1">{trend}</p>}
      </div>
    </div>
  );
}
