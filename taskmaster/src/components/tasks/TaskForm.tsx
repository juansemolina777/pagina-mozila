import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, Plus } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import type { TaskCategory, TaskPriority, TaskStatus, AssignmentType } from '../../types';
import {
  CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, ASSIGNMENT_LABELS,
} from '../../utils/taskMeta';
import { toDateInputValue } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';

const schema = z.object({
  title:         z.string().min(1, 'El título es obligatorio').max(100),
  description:   z.string().max(500),
  status:        z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority:      z.enum(['low', 'medium', 'high', 'urgent']),
  category:      z.enum(['work', 'personal', 'shopping', 'health', 'education', 'finance', 'other']),
  dueDate:       z.string(),
  assigneeType:  z.enum(['self', 'team', 'other']),
  assigneeName:  z.string(),
  assigneeEmail: z.string(),
  tags:          z.string(),
});

type FormData = z.infer<typeof schema>;

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, error, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls = 'px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white transition-all';
const selectCls = cn(inputCls, 'cursor-pointer');

export default function TaskForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { tasks, addTask, updateTask } = useTaskStore();
  const { currentUser } = useAuthStore();
  const [tagInput, setTagInput] = useState('');

  const existing = id ? tasks.find((t) => t.id === id) : undefined;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:         existing?.title ?? '',
      description:   existing?.description ?? '',
      status:        existing?.status ?? 'pending',
      priority:      existing?.priority ?? 'medium',
      category:      existing?.category ?? 'work',
      dueDate:       toDateInputValue(existing?.dueDate ?? null),
      assigneeType:  existing?.assignee.type ?? 'self',
      assigneeName:  existing?.assignee.name ?? (currentUser?.name ?? ''),
      assigneeEmail: existing?.assignee.email ?? '',
      tags:          existing?.tags.join(', ') ?? '',
    },
  });

  const assigneeType = watch('assigneeType');
  const tagsValue    = watch('tags');

  const tagList = tagsValue
    ? tagsValue.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const onSubmit = (data: FormData) => {
    if (!currentUser) return;

    const payload = {
      title:       data.title,
      description: data.description,
      status:      data.status as TaskStatus,
      priority:    data.priority as TaskPriority,
      category:    data.category as TaskCategory,
      dueDate:     data.dueDate || null,
      assignee: {
        type:  data.assigneeType as AssignmentType,
        name:  data.assigneeType === 'self' ? currentUser.name : data.assigneeName,
        email: data.assigneeEmail || undefined,
      },
      tags:   tagList,
      userId: currentUser.id,
    };

    if (isEdit && id) {
      updateTask(id, payload);
    } else {
      addTask(payload);
    }
    navigate('/tasks');
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    const current = tagsValue ? tagsValue.split(',').map((t) => t.trim()).filter(Boolean) : [];
    if (!current.includes(tagInput.trim())) {
      setValue('tags', [...current, tagInput.trim()].join(', '));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    const current = tagList.filter((t) => t !== tag);
    setValue('tags', current.join(', '));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Editar tarea' : 'Nueva tarea'}
          </h2>
          <button onClick={() => navigate('/tasks')} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Title */}
          <Field label="Título" required error={errors.title?.message}>
            <input {...register('title')} placeholder="¿Qué necesitas hacer?" className={inputCls} />
          </Field>

          {/* Description */}
          <Field label="Descripción" error={errors.description?.message}>
            <textarea {...register('description')} rows={3} placeholder="Descripción opcional..."
              className={cn(inputCls, 'resize-none')} />
          </Field>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Estado" error={errors.status?.message}>
              <select {...register('status')} className={selectCls}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>

            <Field label="Prioridad" error={errors.priority?.message}>
              <select {...register('priority')} className={selectCls}>
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Category + Due date */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoría" error={errors.category?.message}>
              <select {...register('category')} className={selectCls}>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>

            <Field label="Fecha límite" error={errors.dueDate?.message}>
              <input type="date" {...register('dueDate')} className={inputCls} />
            </Field>
          </div>

          {/* Assignment */}
          <div className="space-y-3">
            <Field label="Asignar a" error={errors.assigneeType?.message}>
              <select {...register('assigneeType')} className={selectCls}>
                {Object.entries(ASSIGNMENT_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>

            {assigneeType !== 'self' && (
              <div className="grid grid-cols-2 gap-4 animate-fade-in">
                <Field label="Nombre" error={errors.assigneeName?.message}>
                  <input {...register('assigneeName')} placeholder="Nombre del asignado" className={inputCls} />
                </Field>
                <Field label="Email (opcional)" error={errors.assigneeEmail?.message}>
                  <input {...register('assigneeEmail')} type="email" placeholder="email@ejemplo.com" className={inputCls} />
                </Field>
              </div>
            )}
          </div>

          {/* Tags */}
          <Field label="Etiquetas" error={errors.tags?.message}>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Añadir etiqueta..."
                className={cn(inputCls, 'flex-1')}
              />
              <button type="button" onClick={addTag}
                className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                <Plus size={16} />
              </button>
            </div>
            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tagList.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input type="hidden" {...register('tags')} />
          </Field>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60">
              <Save size={16} />
              {isEdit ? 'Guardar cambios' : 'Crear tarea'}
            </button>
            <button type="button" onClick={() => navigate('/tasks')}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
