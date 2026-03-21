import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, User, Tag, MoreVertical, Pencil, Trash2,
  CheckCircle2, Clock, XCircle, PlayCircle,
} from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { useTaskStore } from '../../store/taskStore';
import { getDueDateLabel, isOverdue, isDueSoon } from '../../utils/dateUtils';
import {
  STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS,
  CATEGORY_BG, CATEGORY_LABELS,
} from '../../utils/taskMeta';
import { cn } from '../../utils/cn';

interface TaskCardProps {
  task: Task;
}

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  pending:     <Clock size={14} />,
  in_progress: <PlayCircle size={14} />,
  completed:   <CheckCircle2 size={14} />,
  cancelled:   <XCircle size={14} />,
};

export default function TaskCard({ task }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { deleteTask, changeStatus } = useTaskStore();

  const overdue   = isOverdue(task.dueDate) && task.status !== 'completed' && task.status !== 'cancelled';
  const dueSoon   = isDueSoon(task.dueDate) && !overdue && task.status !== 'completed';

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    pending:     'in_progress',
    in_progress: 'completed',
    completed:   'completed',
    cancelled:   'cancelled',
  };

  return (
    <div className={cn(
      'bg-white rounded-xl border shadow-sm hover:shadow-md transition-all animate-fade-in',
      overdue && 'border-red-200',
      dueSoon  && !overdue && 'border-amber-200',
      !overdue && !dueSoon && 'border-slate-200',
      task.status === 'completed' && 'opacity-75'
    )}>
      {/* Priority stripe */}
      <div className={cn(
        'h-1 rounded-t-xl',
        task.priority === 'urgent' && 'bg-red-500',
        task.priority === 'high'   && 'bg-orange-400',
        task.priority === 'medium' && 'bg-blue-400',
        task.priority === 'low'    && 'bg-slate-300',
      )} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-1.5">
            <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium', STATUS_COLORS[task.status])}>
              {STATUS_ICONS[task.status]} {STATUS_LABELS[task.status]}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full', CATEGORY_BG[task.category])}>
              {CATEGORY_LABELS[task.category]}
            </span>
          </div>

          <div className="relative flex-shrink-0">
            <button onClick={() => setMenuOpen((v) => !v)}
              className="text-slate-400 hover:text-slate-700 transition-colors">
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-6 z-20 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 text-sm"
                onBlur={() => setMenuOpen(false)}>
                <Link to={`/tasks/${task.id}/edit`} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700">
                  <Pencil size={14} /> Editar
                </Link>
                {task.status !== 'completed' && task.status !== 'cancelled' && (
                  <button onClick={() => { changeStatus(task.id, nextStatus[task.status]); setMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700 w-full text-left">
                    <PlayCircle size={14} /> Avanzar estado
                  </button>
                )}
                <button onClick={() => { deleteTask(task.id); setMenuOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-500 w-full text-left">
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <Link to={`/tasks/${task.id}/edit`}>
          <h3 className={cn(
            'font-semibold text-slate-900 text-sm leading-snug mb-1 hover:text-indigo-600 transition-colors',
            task.status === 'completed' && 'line-through text-slate-400'
          )}>
            {task.title}
          </h3>
        </Link>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
          {/* Due date */}
          {task.dueDate && (
            <span className={cn(
              'flex items-center gap-1',
              overdue && 'text-red-500 font-medium',
              dueSoon && !overdue && 'text-amber-500 font-medium'
            )}>
              <Calendar size={12} />
              {getDueDateLabel(task.dueDate)}
            </span>
          )}

          {/* Assignee */}
          <span className="flex items-center gap-1">
            <User size={12} />
            {task.assignee.type === 'self' ? 'Yo' : task.assignee.name}
          </span>

          {/* Priority */}
          <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', PRIORITY_COLORS[task.priority])}>
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-0.5 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                <Tag size={10} /> {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-xs text-slate-400">+{task.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
