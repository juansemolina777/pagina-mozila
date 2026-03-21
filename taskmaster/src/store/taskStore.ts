import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Task, TaskFilters, TaskSort, TaskStatus, TaskPriority,
  CategoryStat, StatusStat, PriorityStat, TimelineStat,
} from '../types';
import { generateId } from '../utils/auth';
import { format, subDays } from 'date-fns';

type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>;

const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  category: 'all',
  assignmentType: 'all',
  dueDateFrom: '',
  dueDateTo: '',
};

const DEFAULT_SORT: TaskSort = { field: 'dueDate', direction: 'asc' };

interface TaskStore {
  tasks: Task[];
  filters: TaskFilters;
  sort: TaskSort;

  // CRUD
  addTask: (input: TaskInput) => Task;
  updateTask: (id: string, updates: Partial<TaskInput>) => void;
  deleteTask: (id: string) => void;
  changeStatus: (id: string, status: TaskStatus) => void;

  // Filters & sort
  setFilters: (filters: Partial<TaskFilters>) => void;
  resetFilters: () => void;
  setSort: (sort: TaskSort) => void;

  // Derived queries
  getTasksByUser: (userId: string) => Task[];
  getFilteredTasks: (userId: string) => Task[];

  // Dashboard stats
  getCategoryStats: (userId: string) => CategoryStat[];
  getStatusStats: (userId: string) => StatusStat[];
  getPriorityStats: (userId: string) => PriorityStat[];
  getTimelineStats: (userId: string, days?: number) => TimelineStat[];
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 4, high: 3, medium: 2, low: 1,
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      filters: DEFAULT_FILTERS,
      sort: DEFAULT_SORT,

      // ── CRUD ────────────────────────────────────────────────────────────

      addTask(input) {
        const now = new Date().toISOString();
        const task: Task = {
          ...input,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          completedAt: null,
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },

      updateTask(id, updates) {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id !== id
              ? t
              : { ...t, ...updates, updatedAt: new Date().toISOString() }
          ),
        }));
      },

      deleteTask(id) {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      },

      changeStatus(id, status) {
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            return {
              ...t,
              status,
              updatedAt: new Date().toISOString(),
              completedAt: status === 'completed' ? new Date().toISOString() : null,
            };
          }),
        }));
      },

      // ── Filters ─────────────────────────────────────────────────────────

      setFilters(partial) {
        set((s) => ({ filters: { ...s.filters, ...partial } }));
      },

      resetFilters() {
        set({ filters: DEFAULT_FILTERS });
      },

      setSort(sort) {
        set({ sort });
      },

      // ── Derived queries ──────────────────────────────────────────────────

      getTasksByUser(userId) {
        return get().tasks.filter((t) => t.userId === userId);
      },

      getFilteredTasks(userId) {
        const { filters, sort } = get();
        let list = get().getTasksByUser(userId);

        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q) ||
              t.tags.some((tag) => tag.toLowerCase().includes(q))
          );
        }
        if (filters.status !== 'all') list = list.filter((t) => t.status === filters.status);
        if (filters.priority !== 'all') list = list.filter((t) => t.priority === filters.priority);
        if (filters.category !== 'all') list = list.filter((t) => t.category === filters.category);
        if (filters.assignmentType !== 'all')
          list = list.filter((t) => t.assignee.type === filters.assignmentType);
        if (filters.dueDateFrom)
          list = list.filter((t) => t.dueDate && t.dueDate >= filters.dueDateFrom);
        if (filters.dueDateTo)
          list = list.filter((t) => t.dueDate && t.dueDate <= filters.dueDateTo);

        list = [...list].sort((a, b) => {
          let cmp = 0;
          switch (sort.field) {
            case 'dueDate':
              cmp = (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
              break;
            case 'priority':
              cmp = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
              break;
            case 'createdAt':
              cmp = a.createdAt.localeCompare(b.createdAt);
              break;
            case 'title':
              cmp = a.title.localeCompare(b.title);
              break;
            case 'status':
              cmp = a.status.localeCompare(b.status);
              break;
          }
          return sort.direction === 'asc' ? cmp : -cmp;
        });

        return list;
      },

      // ── Stats ────────────────────────────────────────────────────────────

      getCategoryStats(userId) {
        const tasks = get().getTasksByUser(userId);
        const categories = ['work','personal','shopping','health','education','finance','other'] as const;
        return categories.map((cat) => {
          const ct = tasks.filter((t) => t.category === cat);
          return {
            category: cat,
            total: ct.length,
            completed: ct.filter((t) => t.status === 'completed').length,
            pending: ct.filter((t) => t.status === 'pending').length,
            in_progress: ct.filter((t) => t.status === 'in_progress').length,
          };
        }).filter((s) => s.total > 0);
      },

      getStatusStats(userId) {
        const tasks = get().getTasksByUser(userId);
        const statuses: TaskStatus[] = ['pending','in_progress','completed','cancelled'];
        return statuses.map((s) => ({ status: s, count: tasks.filter((t) => t.status === s).length }));
      },

      getPriorityStats(userId) {
        const tasks = get().getTasksByUser(userId);
        const priorities: TaskPriority[] = ['low','medium','high','urgent'];
        return priorities.map((p) => ({ priority: p, count: tasks.filter((t) => t.priority === p).length }));
      },

      getTimelineStats(userId, days = 14) {
        const tasks = get().getTasksByUser(userId);
        return Array.from({ length: days }, (_, i) => {
          const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
          return {
            date,
            created: tasks.filter((t) => t.createdAt.startsWith(date)).length,
            completed: tasks.filter((t) => t.completedAt?.startsWith(date)).length,
          };
        });
      },
    }),
    { name: 'taskmaster-tasks' }
  )
);
