import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { ListChecks, CheckCircle2, AlertTriangle, Flame, TrendingUp, Clock, CalendarDays, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import StatsCard from './StatsCard';
import {
  STATUS_CHART_COLORS, PRIORITY_CHART_COLORS, CATEGORY_COLORS,
  STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS,
} from '../../utils/taskMeta';
import { isOverdue, isDueSoon, formatDate } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import AdBanner from '../ui/AdBanner';

// ── Tooltip ───────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xl text-xs">
      {label && <p className="font-semibold text-slate-700 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-700 font-medium">{label}</span>
        <span className="text-slate-400">{value}/{total} · {pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyChart({ height = 220 }: { height?: number }) {
  return (
    <div className={`flex items-center justify-center text-slate-300 text-sm`} style={{ height }}>
      Sin datos aún
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { currentUser } = useAuthStore();
  const { getTasksByUser, getCategoryStats, getStatusStats, getPriorityStats, getTimelineStats } = useTaskStore();

  if (!currentUser) return null;

  const tasks      = getTasksByUser(currentUser.id);
  const total      = tasks.length;
  const completed  = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'completed' && t.status !== 'cancelled');
  const dueSoonTasks = tasks.filter((t) => isDueSoon(t.dueDate) && !isOverdue(t.dueDate) && t.status !== 'completed');

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // ── Tasks due this week ───────────────────────────────────────────────────────
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(now,   { weekStartsOn: 1 });
  const dueThisWeek = tasks.filter((t) =>
    t.dueDate &&
    t.status !== 'completed' &&
    t.status !== 'cancelled' &&
    isWithinInterval(new Date(t.dueDate + 'T00:00:00'), { start: weekStart, end: weekEnd })
  ).sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));

  // ── Chart data ───────────────────────────────────────────────────────────────

  const statusData = getStatusStats(currentUser.id).filter((s) => s.count > 0).map((s) => ({
    name: STATUS_LABELS[s.status], value: s.count, fill: STATUS_CHART_COLORS[s.status],
  }));

  const categoryStats = getCategoryStats(currentUser.id);
  const categoryData  = categoryStats.map((s) => ({
    name: CATEGORY_LABELS[s.category],
    Completadas: s.completed,
    Pendientes:  s.pending,
    'En progreso': s.in_progress,
  }));

  const priorityData = getPriorityStats(currentUser.id).map((p) => ({
    name: PRIORITY_LABELS[p.priority], value: p.count, fill: PRIORITY_CHART_COLORS[p.priority],
  }));

  const timelineData = getTimelineStats(currentUser.id, 14).map((d) => ({
    ...d,
    date: format(new Date(d.date + 'T00:00:00'), 'd MMM', { locale: es }),
  }));

  // ── 7-day completion rate chart ───────────────────────────────────────────────
  const last7Days = getTimelineStats(currentUser.id, 7);
  const completionRateData = last7Days.map((d) => {
    const total7 = d.created > 0 || d.completed > 0 ? d.created + d.completed : 0;
    return {
      date: format(new Date(d.date + 'T00:00:00'), 'EEE', { locale: es }),
      Completadas: d.completed,
      Creadas: d.created,
      Tasa: total7 > 0 ? Math.round((d.completed / (d.created + d.completed)) * 100) : 0,
    };
  });

  // Upcoming: not done, has due date, sorted by due date
  const upcoming = tasks
    .filter((t) => t.dueDate && t.status !== 'completed' && t.status !== 'cancelled')
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 6);

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Hola, {currentUser.name.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {inProgress > 0
              ? `Tienes ${inProgress} tarea${inProgress !== 1 ? 's' : ''} en progreso`
              : 'Estás al día con tus tareas'}
            {overdueTasks.length > 0 && ` · ${overdueTasks.length} vencida${overdueTasks.length !== 1 ? 's' : ''}`}.
          </p>
        </div>
        <Link to="/tasks/new"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm">
          + Nueva tarea
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total tareas"    value={total}               icon={<ListChecks size={22} />}    color="indigo" />
        <StatsCard label="Completadas"     value={completed}           icon={<CheckCircle2 size={22} />}  color="green" />
        <StatsCard label="Vencidas"        value={overdueTasks.length} icon={<AlertTriangle size={22} />} color="red" />
        <StatsCard label="% Completación"  value={`${completionRate}%`} icon={<Flame size={22} />}       color="purple" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="Esta semana"     value={dueThisWeek.length}  icon={<CalendarDays size={22} />}  color="blue" />
        <StatsCard label="En progreso"     value={inProgress}          icon={<Clock size={22} />}         color="amber" />
        <StatsCard label="Tasa 7 días"     value={(() => {
          const last7 = last7Days.reduce((a, d) => ({ c: a.c + d.completed, t: a.t + d.created + d.completed }), { c: 0, t: 0 });
          return last7.t > 0 ? `${Math.round((last7.c / last7.t) * 100)}%` : '—';
        })()} icon={<Target size={22} />} color="green" />
      </div>

      {/* Ad banner — horizontal between KPIs and alerts */}
      <AdBanner slot="7703659062" format="horizontal" className="rounded-xl overflow-hidden" />

      {/* Overdue alert */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-500" />
            <h3 className="text-sm font-semibold text-red-700">Tareas vencidas ({overdueTasks.length})</h3>
          </div>
          <div className="space-y-2">
            {overdueTasks.slice(0, 4).map((t) => (
              <Link key={t.id} to={`/tasks/${t.id}/edit`}
                className="flex items-center gap-3 py-1.5 hover:text-red-700 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700 font-medium truncate flex-1">{t.title}</span>
                <span className="text-xs text-red-400 flex-shrink-0">{formatDate(t.dueDate)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Due soon alert */}
      {dueSoonTasks.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-amber-700">Próximas a vencer ({dueSoonTasks.length})</h3>
          </div>
          <div className="space-y-1">
            {dueSoonTasks.slice(0, 3).map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-sm text-amber-700 truncate flex-1">{t.title}</span>
                <span className="text-xs text-amber-500 flex-shrink-0">{formatDate(t.dueDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks due this week */}
      {dueThisWeek.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={16} className="text-blue-500" />
            <h3 className="text-sm font-semibold text-blue-700">Vencen esta semana ({dueThisWeek.length})</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {dueThisWeek.slice(0, 6).map((t) => {
              const over = isOverdue(t.dueDate);
              return (
                <Link key={t.id} to={`/tasks/${t.id}/edit`}
                  className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-blue-100 transition-colors group">
                  <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0',
                    t.priority === 'urgent' ? 'bg-red-500' :
                    t.priority === 'high'   ? 'bg-orange-400' :
                    t.priority === 'medium' ? 'bg-blue-400' : 'bg-slate-300'
                  )} />
                  <span className="text-sm text-blue-700 font-medium truncate flex-1 group-hover:text-blue-900">{t.title}</span>
                  <span className={cn('text-xs flex-shrink-0 font-semibold',
                    over ? 'text-red-500' : 'text-blue-500'
                  )}>
                    {t.dueDate ? format(new Date(t.dueDate + 'T00:00:00'), 'EEE d', { locale: es }) : ''}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 7-day completion rate chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Target size={16} className="text-green-500" />
          <h3 className="text-sm font-semibold text-slate-900">Tasa de completación — últimos 7 días</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">Tareas completadas vs. creadas por día</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={completionRateData}>
            <defs>
              <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area type="monotone" dataKey="Creadas"    stroke="#6366f1" strokeWidth={2} fill="url(#gradCreated)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="Completadas" stroke="#22c55e" strokeWidth={2} fill="url(#gradCompleted)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status pie */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Estado de tareas</h3>
          <p className="text-xs text-slate-400 mb-4">Distribución actual por estado</p>
          {statusData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  paddingAngle={3} dataKey="value" nameKey="name">
                  {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Priority bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Prioridades</h3>
          <p className="text-xs text-slate-400 mb-4">Tareas por nivel de prioridad</p>
          {priorityData.every((d) => d.value === 0) ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" name="Tareas" radius={[8, 8, 0, 0]}>
                  {priorityData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={16} className="text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-900">Actividad últimos 14 días</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">Tareas creadas vs. completadas por día</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="created"   name="Creadas"    stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="completed" name="Completadas" stroke="#22c55e" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category stacked bar */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Tareas por categoría</h3>
          <p className="text-xs text-slate-400 mb-4">Desglose por estado dentro de cada categoría</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Completadas"  stackId="a" fill="#22c55e" />
              <Bar dataKey="En progreso"  stackId="a" fill="#3b82f6" />
              <Bar dataKey="Pendientes"   stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category progress */}
      {categoryStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Progreso por categoría</h3>
          <div className="space-y-4">
            {categoryStats.map((s) => (
              <ProgressBar
                key={s.category}
                label={CATEGORY_LABELS[s.category]}
                value={s.completed}
                total={s.total}
                color={CATEGORY_COLORS[s.category]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Próximas tareas</h3>
          <div className="space-y-1">
            {upcoming.map((t) => {
              const over = isOverdue(t.dueDate);
              const soon = isDueSoon(t.dueDate);
              return (
                <Link key={t.id} to={`/tasks/${t.id}/edit`}
                  className="flex items-center gap-3 py-2 rounded-lg hover:bg-slate-50 px-2 transition-colors group">
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0',
                    t.priority === 'urgent' ? 'bg-red-500' :
                    t.priority === 'high'   ? 'bg-orange-400' :
                    t.priority === 'medium' ? 'bg-blue-400' : 'bg-slate-300'
                  )} />
                  <p className="flex-1 text-sm text-slate-700 group-hover:text-indigo-600 truncate transition-colors">
                    {t.title}
                  </p>
                  {t.dueDate && (
                    <span className={cn('text-xs flex-shrink-0 font-medium',
                      over ? 'text-red-500' : soon ? 'text-amber-500' : 'text-slate-400'
                    )}>
                      {format(new Date(t.dueDate), 'dd MMM', { locale: es })}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Ad banner — bottom of dashboard */}
      <AdBanner slot="6089659646" format="auto" className="rounded-xl overflow-hidden" />
    </div>
  );
}
