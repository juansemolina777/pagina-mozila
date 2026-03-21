import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line, ResponsiveContainer,
} from 'recharts';
import {
  ListChecks, CheckCircle2, AlertTriangle, Flame,
} from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import StatsCard from './StatsCard';
import {
  STATUS_CHART_COLORS, PRIORITY_CHART_COLORS, CATEGORY_COLORS,
  STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS,
} from '../../utils/taskMeta';
import { isOverdue } from '../../utils/dateUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Custom tooltip
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-medium text-slate-700 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser } = useAuthStore();
  const { getTasksByUser, getCategoryStats, getStatusStats, getPriorityStats, getTimelineStats } = useTaskStore();

  if (!currentUser) return null;

  const tasks      = getTasksByUser(currentUser.id);
  const total      = tasks.length;
  const completed  = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const overdue    = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'completed' && t.status !== 'cancelled').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Chart data
  const statusData = getStatusStats(currentUser.id).filter((s) => s.count > 0).map((s) => ({
    name: STATUS_LABELS[s.status],
    value: s.count,
    fill: STATUS_CHART_COLORS[s.status],
  }));

  const categoryData = getCategoryStats(currentUser.id).map((s) => ({
    name: CATEGORY_LABELS[s.category],
    Completadas: s.completed,
    Pendientes:  s.pending,
    'En progreso': s.in_progress,
    fill: CATEGORY_COLORS[s.category],
  }));

  const priorityData = getPriorityStats(currentUser.id).map((p) => ({
    name:  PRIORITY_LABELS[p.priority],
    value: p.count,
    fill:  PRIORITY_CHART_COLORS[p.priority],
  }));

  const timelineData = getTimelineStats(currentUser.id, 14).map((d) => ({
    ...d,
    date: format(new Date(d.date + 'T00:00:00'), 'd MMM', { locale: es }),
  }));

  // Upcoming tasks
  const upcoming = tasks
    .filter((t) => t.dueDate && t.status !== 'completed' && t.status !== 'cancelled')
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Hola, {currentUser.name.split(' ')[0]} 👋
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Tienes {inProgress} tarea{inProgress !== 1 ? 's' : ''} en progreso
          {overdue > 0 ? ` y ${overdue} vencida${overdue !== 1 ? 's' : ''}` : ''}.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total tareas"    value={total}           icon={<ListChecks size={22} />} color="indigo" />
        <StatsCard label="Completadas"     value={completed}       icon={<CheckCircle2 size={22} />} color="green" />
        <StatsCard label="Vencidas"        value={overdue}         icon={<AlertTriangle size={22} />} color="red" />
        <StatsCard label="% Completación"  value={`${completionRate}%`} icon={<Flame size={22} />} color="purple" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status pie */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Estado de tareas</h3>
          {statusData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value" nameKey="name">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Priority bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Tareas por prioridad</h3>
          {priorityData.every((d) => d.value === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" name="Tareas" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Actividad últimos 14 días</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="created"   name="Creadas"    stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="completed" name="Completadas" stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category stacked bar */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Tareas por categoría</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Completadas"  stackId="a" fill="#22c55e"  radius={[0, 0, 0, 0]} />
              <Bar dataKey="En progreso"  stackId="a" fill="#3b82f6"  radius={[0, 0, 0, 0]} />
              <Bar dataKey="Pendientes"   stackId="a" fill="#f59e0b"  radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Upcoming tasks */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Próximas tareas</h3>
          <div className="space-y-2">
            {upcoming.map((task) => (
              <div key={task.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  task.priority === 'urgent' ? 'bg-red-500' :
                  task.priority === 'high'   ? 'bg-orange-400' :
                  task.priority === 'medium' ? 'bg-blue-400' : 'bg-slate-300'
                }`} />
                <p className="flex-1 text-sm text-slate-700 truncate">{task.title}</p>
                {task.dueDate && (
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {format(new Date(task.dueDate), 'dd MMM', { locale: es })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[220px] flex items-center justify-center text-slate-300 text-sm">
      Sin datos aún
    </div>
  );
}
