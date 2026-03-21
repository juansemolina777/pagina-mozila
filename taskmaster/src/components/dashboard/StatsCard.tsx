import { cn } from '../../utils/cn';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'indigo' | 'green' | 'amber' | 'red' | 'blue' | 'purple';
}

const COLOR_MAP = {
  indigo: { bg: 'bg-indigo-50',  text: 'text-indigo-600',  icon: 'bg-indigo-100' },
  green:  { bg: 'bg-green-50',   text: 'text-green-600',   icon: 'bg-green-100' },
  amber:  { bg: 'bg-amber-50',   text: 'text-amber-600',   icon: 'bg-amber-100' },
  red:    { bg: 'bg-red-50',     text: 'text-red-600',     icon: 'bg-red-100' },
  blue:   { bg: 'bg-blue-50',    text: 'text-blue-600',    icon: 'bg-blue-100' },
  purple: { bg: 'bg-purple-50',  text: 'text-purple-600',  icon: 'bg-purple-100' },
};

export default function StatsCard({ label, value, icon, trend, trendUp, color = 'indigo' }: StatsCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className={cn('text-3xl font-bold mt-1', c.text)}>{value}</p>
          {trend && (
            <p className={cn('text-xs mt-1 font-medium', trendUp ? 'text-green-600' : 'text-red-500')}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', c.icon, c.text)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
