import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, User, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { getInitials } from '../../utils/auth';
import { cn } from '../../utils/cn';

const profileSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto'),
});
type ProfileData = z.infer<typeof profileSchema>;

const inputCls = 'px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white transition-all w-full';

export default function SettingsPage() {
  const { currentUser, updateProfile, logout } = useAuthStore();
  const { tasks } = useTaskStore();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: currentUser?.name ?? '' },
  });

  const onSave = (data: ProfileData) => {
    updateProfile({ name: data.name.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const userTasks = tasks.filter((t) => t.userId === currentUser?.id);
  const completed = userTasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-6">
      {/* Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <User size={18} className="text-slate-500" />
          <h2 className="text-base font-semibold text-slate-900">Perfil</h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold">
              {currentUser ? getInitials(currentUser.name) : '?'}
            </div>
            <div>
              <p className="font-medium text-slate-900">{currentUser?.name}</p>
              <p className="text-sm text-slate-500">{currentUser?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Nombre</label>
              <input {...register('name')} className={inputCls} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Correo electrónico</label>
              <input value={currentUser?.email ?? ''} disabled className={cn(inputCls, 'bg-slate-50 text-slate-400 cursor-not-allowed')} />
              <p className="text-xs text-slate-400">El correo no se puede cambiar.</p>
            </div>

            <button type="submit"
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              )}>
              <Save size={15} />
              {saved ? '¡Guardado!' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>

      {/* Stats summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Resumen de actividad</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Total tareas', value: userTasks.length },
            { label: 'Completadas',  value: completed },
            { label: '% Completación', value: userTasks.length > 0 ? `${Math.round((completed / userTasks.length) * 100)}%` : '—' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-indigo-600">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm">
        <div className="px-6 py-4 border-b border-red-100 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500" />
          <h2 className="text-base font-semibold text-red-600">Zona de peligro</h2>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600">
            Al cerrar sesión perderás acceso hasta que vuelvas a iniciar.
          </p>
          <button onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium border border-red-200 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
