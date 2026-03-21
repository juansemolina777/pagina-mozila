import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useTaskStore } from '../../store/taskStore';
import type { TaskStatus, TaskPriority, TaskCategory, AssignmentType, SortField, SortDirection } from '../../types';
import { STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS, ASSIGNMENT_LABELS } from '../../utils/taskMeta';
import { cn } from '../../utils/cn';

// Reusable select
function Select({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[130px]">
      <label className="text-xs text-slate-500 font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function TaskFilters() {
  const { filters, sort, setFilters, resetFilters, setSort } = useTaskStore();
  const [expanded, setExpanded] = useState(false);

  const hasActiveFilters =
    filters.search ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.category !== 'all' ||
    filters.assignmentType !== 'all' ||
    filters.dueDateFrom ||
    filters.dueDateTo;

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ];
  const priorityOptions = [
    { value: 'all', label: 'Todas las prioridades' },
    ...Object.entries(PRIORITY_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ];
  const categoryOptions = [
    { value: 'all', label: 'Todas las categorías' },
    ...Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ];
  const assignmentOptions = [
    { value: 'all', label: 'Cualquier asignación' },
    ...Object.entries(ASSIGNMENT_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ];
  const sortFieldOptions: { value: SortField; label: string }[] = [
    { value: 'dueDate',   label: 'Fecha límite' },
    { value: 'priority',  label: 'Prioridad' },
    { value: 'createdAt', label: 'Fecha creación' },
    { value: 'title',     label: 'Título' },
    { value: 'status',    label: 'Estado' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      {/* Search + toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
          />
          {filters.search && (
            <button onClick={() => setFilters({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        <button onClick={() => setExpanded((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors',
            expanded || hasActiveFilters
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          )}>
          <SlidersHorizontal size={15} />
          Filtros
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 ml-0.5" />
          )}
        </button>

        {hasActiveFilters && (
          <button onClick={resetFilters}
            className="text-sm text-slate-500 hover:text-red-500 px-2 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {expanded && (
        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100 animate-fade-in">
          <Select label="Estado" value={filters.status}
            onChange={(v) => setFilters({ status: v as TaskStatus | 'all' })}
            options={statusOptions} />
          <Select label="Prioridad" value={filters.priority}
            onChange={(v) => setFilters({ priority: v as TaskPriority | 'all' })}
            options={priorityOptions} />
          <Select label="Categoría" value={filters.category}
            onChange={(v) => setFilters({ category: v as TaskCategory | 'all' })}
            options={categoryOptions} />
          <Select label="Asignación" value={filters.assignmentType}
            onChange={(v) => setFilters({ assignmentType: v as AssignmentType | 'all' })}
            options={assignmentOptions} />

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-medium">Desde</label>
            <input type="date" value={filters.dueDateFrom}
              onChange={(e) => setFilters({ dueDateFrom: e.target.value })}
              className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-400" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-medium">Hasta</label>
            <input type="date" value={filters.dueDateTo}
              onChange={(e) => setFilters({ dueDateTo: e.target.value })}
              className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-400" />
          </div>

          {/* Sort */}
          <Select label="Ordenar por" value={sort.field}
            onChange={(v) => setSort({ ...sort, field: v as SortField })}
            options={sortFieldOptions} />

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-medium">Dirección</label>
            <select value={sort.direction}
              onChange={(e) => setSort({ ...sort, direction: e.target.value as SortDirection })}
              className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:border-indigo-400">
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
