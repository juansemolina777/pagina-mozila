// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  /** Hashed with btoa (demo only). Empty string = Google-only account. */
  passwordHash: string;
  avatar?: string;
  /** 'google' if signed up via Google OAuth, undefined otherwise */
  provider?: 'google' | 'email';
  createdAt: string;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory =
  | 'work'
  | 'personal'
  | 'shopping'
  | 'health'
  | 'education'
  | 'finance'
  | 'other';

export type AssignmentType = 'self' | 'team' | 'other';

export interface TaskAssignee {
  name: string;
  email?: string;
  type: AssignmentType;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  assignee: TaskAssignee;
  /** ISO date string */
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** ID of the user who owns the task */
  userId: string;
  completedAt: string | null;
}

export interface TaskFilters {
  search: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  category: TaskCategory | 'all';
  assignmentType: AssignmentType | 'all';
  dueDateFrom: string;
  dueDateTo: string;
}

export type SortField = 'dueDate' | 'priority' | 'createdAt' | 'title' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface TaskSort {
  field: SortField;
  direction: SortDirection;
}

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export interface CategoryStat {
  category: TaskCategory;
  total: number;
  completed: number;
  pending: number;
  in_progress: number;
}

export interface StatusStat {
  status: TaskStatus;
  count: number;
}

export interface PriorityStat {
  priority: TaskPriority;
  count: number;
}

export interface TimelineStat {
  date: string;
  created: number;
  completed: number;
}
