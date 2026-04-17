import * as XLSX from 'xlsx';
import type { Task } from '../types';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
  ASSIGNMENT_LABELS,
} from './taskMeta';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return format(new Date(iso), 'dd/MM/yyyy HH:mm', { locale: es });
}

export function exportCompletedTasksToExcel(tasks: Task[]): void {
  const completed = tasks.filter((t) => t.status === 'completed');

  if (completed.length === 0) {
    alert('No hay tareas completadas para exportar.');
    return;
  }

  const rows = completed.map((t) => ({
    Título: t.title,
    Descripción: t.description || '',
    Prioridad: PRIORITY_LABELS[t.priority],
    Categoría: CATEGORY_LABELS[t.category],
    Estado: STATUS_LABELS[t.status],
    'Asignado a': t.assignee.name,
    'Tipo de asignación': ASSIGNMENT_LABELS[t.assignee.type],
    'Correo del asignado': t.assignee.email || '',
    'Fecha de vencimiento': formatDate(t.dueDate),
    'Horas estimadas': t.estimatedHours ?? '',
    Etiquetas: t.tags.join(', '),
    'Creada el': formatDate(t.createdAt),
    'Completada el': formatDate(t.completedAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  const colWidths = [
    { wch: 30 }, // Título
    { wch: 40 }, // Descripción
    { wch: 12 }, // Prioridad
    { wch: 14 }, // Categoría
    { wch: 14 }, // Estado
    { wch: 20 }, // Asignado a
    { wch: 18 }, // Tipo de asignación
    { wch: 25 }, // Correo
    { wch: 20 }, // Fecha vencimiento
    { wch: 16 }, // Horas estimadas
    { wch: 25 }, // Etiquetas
    { wch: 20 }, // Creada el
    { wch: 20 }, // Completada el
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tareas completadas');

  const fileName = `tareas-completadas-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
