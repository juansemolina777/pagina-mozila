import { Link } from 'react-router-dom';
import { Calendar, Tag, Pencil, Clock, CheckCircle2, PlayCircle, XCircle, Flag } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { useTaskStore } from '../../store/taskStore';
import { useToast } from '../ui/Toast';
import Modal from '../ui/Modal';
import {
  STATUS_COLORS, STATUS_LABELS,
  PRIORITY_LABELS, PRIORITY_COLORS,
  CATEGORY_BG, CATEGORY_LABELS,
  ASSIGNMENT_LABELS,
} from '../../utils/taskMeta';
import { formatDate, formatRelative, isOverdue } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  pending:     <Clock size={14} />,
  in_progress: <PlayCircle size={14} />,
  completed:   <CheckCircle2 size={14} />,
  cancelled:   <XCircle size={14} />,
};

const NEXT_STATUS: Partial<Record<TaskStatus, { status: TaskStatus; label: string }>> = {
  pending:     { status: 'in_progress', label: 'Iniciar' },
  in_progress: { status: 'completed',  label: 'Completar' },
};

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
}

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const { changeStatus } = useTaskStore();
  const toast = useToast();

  if (!task) return null;

  const overdue = isOverdue(task.dueDate) && task.status !== 'completed' && task.status !== 'cancelled';
  const next = NEXT_STATUS[task.status];

  const handleAdvance = () => {
    if (!next) return;
    changeStatus(task.id, next.status);
    toast.success(`Tarea marcada como "${STATUS_LABELS[next.status]}"`);
    onClose();
  };

  return (
    <Modal open={!!task} onClose={onClose} title="Detalle de tarea" size="md">
      <div className="space-y-4">
        {/* Title + priority stripe */}
        <div className={cn(
          'rounded-xl p-4 border',
          task.priority === 'urgent' && 'bg-red-50 border-red-200',
          task.priority === 'high'   && 'bg-orange-50 border-orange-200',
          task.priority === 'medium' && 'bg-blue-50 border-blue-200',
          task.priority === 'low'    && 'bg-slate-50 border-slate-200',
        )}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium', STATUS_COLORS[task.status])}>
              {STATUS_ICONS[task.status]} {STATUS_LABELS[task.status]}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', CATEGORY_BG[task.category])}>
              {CATEGORY_LABELS[task.category]}
            </span>
            <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium', PRIORITY_COLORS[task.priority])}>
              <Flag size={11} /> {PRIORITY_LABELS[task.priority]}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">{task.title}</h3>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1 font-medium">Fecha límite</p>
            <p className={cn('text-sm font-semibold', overdue ? 'text-red-600' : 'text-slate-800')}>
              {task.dueDate ? formatDate(task.dueDate) : '—'}
            </p>
            {overdue && <p className="text-xs text-red-400 mt-0.5">Vencida</p>}
          </div>

          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1 font-medium">Asignada a</p>
            <p className="text-sm font-semibold text-slate-800">
              {task.assignee.type === 'self' ? 'Yo mismo' : task.assignee.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{ASSIGNMENT_LABELS[task.assignee.type]}</p>
          </div>

          {task.assignee.email && (
            <div className="bg-slate-50 rounded-xl p-3 col-span-2">
              <p className="text-xs text-slate-400 mb-1 font-medium">Email del asignado</p>
              <p className="text-sm font-medium text-indigo-600">{task.assignee.email}</p>
            </div>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium">Etiquetas</p>
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex gap-4 text-xs text-slate-400 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1">
            <Calendar size={11} /> Creada {formatRelative(task.createdAt)}
          </span>
          {task.completedAt && (
            <span className="flex items-center gap-1 text-green-500">
              <CheckCircle2 size={11} /> Completada {formatRelative(task.completedAt)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {next && (
            <button onClick={handleAdvance}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
              {STATUS_ICONS[next.status]} {next.label}
            </button>
          )}
          <Link to={`/tasks/${task.id}/edit`} onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors">
            <Pencil size={14} /> Editar
          </Link>
        </div>
      </div>
    </Modal>
  );
}
