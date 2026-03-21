import { format, formatDistanceToNow, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Sin fecha';
  return format(new Date(dateStr), 'dd MMM yyyy', { locale: es });
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), "dd MMM yyyy 'a las' HH:mm", { locale: es });
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
}

export function isDueSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const days = differenceInDays(new Date(dateStr), new Date());
  return days >= 0 && days <= 3;
}

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return isPast(new Date(dateStr)) && !isToday(new Date(dateStr));
}

export function getDueDateLabel(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return 'Hoy';
  if (isTomorrow(d)) return 'Mañana';
  if (isOverdue(dateStr)) return `Vencida hace ${formatRelative(dateStr)}`;
  return formatDate(dateStr);
}

export function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'yyyy-MM-dd');
}
