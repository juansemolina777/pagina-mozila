import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Tag, Calendar, User } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import { getDueDateLabel, isOverdue, isDueSoon } from '../../utils/dateUtils';
import {
  STATUS_LABELS, STATUS_DOT,
  PRIORITY_COLORS, PRIORITY_LABELS, CATEGORY_BG, CATEGORY_LABELS,
} from '../../utils/taskMeta';
import { cn } from '../../utils/cn';

const COLUMNS: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

// ── Drag state (simple ref-based, no library needed) ─────────────────────────
let draggedId: string | null = null;

function KanbanCard({ task }: { task: Task }) {
  const { deleteTask } = useTaskStore();
  const toast = useToast();
  const overdue = isOverdue(task.dueDate) && task.status !== 'completed' && task.status !== 'cancelled';
  const soon    = isDueSoon(task.dueDate) && !overdue && task.status !== 'completed';

  const handleDelete = () => {
    deleteTask(task.id);
    toast.success('Tarea eliminada');
  };

  return (
    <div
      draggable
      onDragStart={() => { draggedId = task.id; }}
      onDragEnd={() => { draggedId = null; }}
      className={cn(
        'bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing',
        'select-none animate-fade-in',
        overdue && 'border-red-200',
        soon && !overdue && 'border-amber-200',
        !overdue && !soon && 'border-slate-200',
        task.status === 'completed' && 'opacity-70',
      )}
    >
      {/* Priority stripe */}
      <div className={cn(
        'h-1 rounded-t-xl',
        task.priority === 'urgent' && 'bg-red-500',
        task.priority === 'high'   && 'bg-orange-400',
        task.priority === 'medium' && 'bg-blue-400',
        task.priority === 'low'    && 'bg-slate-200',
      )} />

      <div className="p-3 space-y-2">
        {/* Category + actions */}
        <div className="flex items-start justify-between gap-1">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', CATEGORY_BG[task.category])}>
            {CATEGORY_LABELS[task.category]}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link to={`/tasks/${task.id}/edit`}
              className="text-slate-300 hover:text-indigo-500 transition-colors">
              <Pencil size={13} />
            </Link>
            <button onClick={handleDelete} className="text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Title */}
        <Link to={`/tasks/${task.id}/edit`}>
          <p className={cn(
            'text-sm font-semibold text-slate-800 leading-snug hover:text-indigo-600 transition-colors',
            task.status === 'completed' && 'line-through text-slate-400',
          )}>
            {task.title}
          </p>
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {task.dueDate && (
            <span className={cn(
              'flex items-center gap-0.5',
              overdue && 'text-red-500 font-medium',
              soon && !overdue && 'text-amber-500 font-medium',
            )}>
              <Calendar size={11} /> {getDueDateLabel(task.dueDate)}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <User size={11} />
            {task.assignee.type === 'self' ? 'Yo' : task.assignee.name}
          </span>
        </div>

        {/* Priority + tags */}
        <div className="flex flex-wrap gap-1">
          <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium border', PRIORITY_COLORS[task.priority])}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="inline-flex items-center gap-0.5 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
              <Tag size={9} /> {tag}
            </span>
          ))}
          {task.tags.length > 2 && <span className="text-xs text-slate-400">+{task.tags.length - 2}</span>}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const { changeStatus } = useTaskStore(); // eslint-disable-line
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    ref.current?.classList.add('ring-2', 'ring-indigo-300', 'ring-inset');
  };

  const handleDragLeave = () => {
    ref.current?.classList.remove('ring-2', 'ring-indigo-300', 'ring-inset');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    ref.current?.classList.remove('ring-2', 'ring-indigo-300', 'ring-inset');
    if (draggedId) {
      changeStatus(draggedId, status);
      toast.info(`Tarea movida a "${STATUS_LABELS[status]}"`);
      draggedId = null;
    }
  };

  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px] flex-1">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', STATUS_DOT[status])} />
        <span className="text-sm font-semibold text-slate-700">{STATUS_LABELS[status]}</span>
        <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={ref}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex-1 rounded-2xl p-2 space-y-2 min-h-[200px] transition-all',
          'bg-slate-50 border-2 border-transparent',
        )}
      >
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-slate-300 text-xs select-none">
            Arrastra aquí
          </div>
        )}
        {tasks.map((t) => <KanbanCard key={t.id} task={t} />)}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const { currentUser } = useAuthStore();
  const { getFilteredTasks } = useTaskStore();

  if (!currentUser) return null;
  const tasks = getFilteredTasks(currentUser.id);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {COLUMNS.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasks.filter((t) => t.status === status)}
        />
      ))}
    </div>
  );
}
