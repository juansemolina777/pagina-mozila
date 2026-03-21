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
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                {currentUser ? getInitials(currentUser.name) : '?'}
              </div>
            )}
            <div>
              <p className="font-medium text-slate-900">{currentUser?.name}</p>
              <p className="text-sm text-slate-500">{currentUser?.email}</p>
              {currentUser?.provider === 'google' && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                  <svg viewBox="0 0 24 24" width="11" height="11">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Cuenta de Google
                </span>
              )}
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
