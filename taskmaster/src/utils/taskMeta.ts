import type { TaskStatus, TaskPriority, TaskCategory, AssignmentType } from '../types';

// ── Status ────────────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending:     'Pendiente',
  in_progress: 'En progreso',
  completed:   'Completada',
  cancelled:   'Cancelada',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  pending:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  completed:   'bg-green-100 text-green-700 border-green-200',
  cancelled:   'bg-slate-100 text-slate-500 border-slate-200',
};

export const STATUS_DOT: Record<TaskStatus, string> = {
  pending:     'bg-yellow-400',
  in_progress: 'bg-blue-500',
  completed:   'bg-green-500',
  cancelled:   'bg-slate-400',
};

// ── Priority ──────────────────────────────────────────────────────────────────

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low:    'Baja',
  medium: 'Media',
  high:   'Alta',
  urgent: 'Urgente',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low:    'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-100 text-blue-600 border-blue-200',
  high:   'bg-orange-100 text-orange-600 border-orange-200',
  urgent: 'bg-red-100 text-red-600 border-red-200',
};

// ── Category ──────────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  work:       'Trabajo',
  personal:   'Personal',
  shopping:   'Compras',
  health:     'Salud',
  education:  'Educación',
  finance:    'Finanzas',
  other:      'Otro',
};

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  work:       '#6366f1',
  personal:   '#ec4899',
  shopping:   '#f59e0b',
  health:     '#22c55e',
  education:  '#3b82f6',
  finance:    '#14b8a6',
  other:      '#94a3b8',
};

export const CATEGORY_BG: Record<TaskCategory, string> = {
  work:       'bg-indigo-50 text-indigo-700',
  personal:   'bg-pink-50 text-pink-700',
  shopping:   'bg-amber-50 text-amber-700',
  health:     'bg-green-50 text-green-700',
  education:  'bg-blue-50 text-blue-700',
  finance:    'bg-teal-50 text-teal-700',
  other:      'bg-slate-100 text-slate-600',
};

// ── Assignment ────────────────────────────────────────────────────────────────

export const ASSIGNMENT_LABELS: Record<AssignmentType, string> = {
  self:  'Para mí',
  team:  'Equipo',
  other: 'Otro',
};

export const ASSIGNMENT_COLORS: Record<AssignmentType, string> = {
  self:  'bg-purple-50 text-purple-700',
  team:  'bg-cyan-50 text-cyan-700',
  other: 'bg-rose-50 text-rose-700',
};

// ── Chart palette ────────────────────────────────────────────────────────────

export const STATUS_CHART_COLORS: Record<TaskStatus, string> = {
  pending:     '#f59e0b',
  in_progress: '#3b82f6',
  completed:   '#22c55e',
  cancelled:   '#94a3b8',
};

export const PRIORITY_CHART_COLORS: Record<TaskPriority, string> = {
  low:    '#94a3b8',
  medium: '#3b82f6',
  high:   '#f97316',
  urgent: '#ef4444',
};
