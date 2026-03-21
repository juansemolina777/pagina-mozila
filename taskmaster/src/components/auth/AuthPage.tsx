import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckSquare, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/cn';

// ── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

// ── Shared Input ─────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        className={cn(
          'px-3 py-2.5 rounded-lg border text-sm transition-all outline-none',
          'border-slate-200 bg-white placeholder-slate-400',
          'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
          error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Login Form ────────────────────────────────────────────────────────────────

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [showPwd, setShowPwd] = useState(false);
  const [serverError, setServerError] = useState('');
  const login = useAuthStore((s) => s.login);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginData) => {
    setServerError('');
    const result = login(data.email, data.password);
    if (!result.ok) setServerError(result.error ?? 'Error desconocido');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Correo electrónico" type="email" placeholder="tu@correo.com"
        error={errors.email?.message} {...register('email')} />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Contraseña</label>
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder="••••••••"
            className={cn(
              'w-full px-3 py-2.5 pr-10 rounded-lg border text-sm transition-all outline-none',
              'border-slate-200 bg-white placeholder-slate-400',
              'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
              errors.password && 'border-red-400 focus:border-red-400 focus:ring-red-100'
            )}
            {...register('password')}
          />
          <button type="button" onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      {serverError && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <button type="submit" disabled={isSubmitting}
        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-60">
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        Iniciar sesión
      </button>

      <p className="text-center text-sm text-slate-500">
        ¿No tienes cuenta?{' '}
        <button type="button" onClick={onSwitch} className="text-indigo-600 hover:underline font-medium">
          Regístrate
        </button>
      </p>
    </form>
  );
}

// ── Register Form ─────────────────────────────────────────────────────────────

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [showPwd, setShowPwd] = useState(false);
  const [serverError, setServerError] = useState('');
  const register_ = useAuthStore((s) => s.register);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterData) => {
    setServerError('');
    const result = register_(data.name, data.email, data.password);
    if (!result.ok) setServerError(result.error ?? 'Error desconocido');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Nombre completo" type="text" placeholder="Juan García"
        error={errors.name?.message} {...register('name')} />
      <Input label="Correo electrónico" type="email" placeholder="tu@correo.com"
        error={errors.email?.message} {...register('email')} />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Contraseña</label>
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder="••••••••"
            className={cn(
              'w-full px-3 py-2.5 pr-10 rounded-lg border text-sm transition-all outline-none',
              'border-slate-200 bg-white placeholder-slate-400',
              'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
              errors.password && 'border-red-400'
            )}
            {...register('password')}
          />
          <button type="button" onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <Input label="Confirmar contraseña" type="password" placeholder="••••••••"
        error={errors.confirmPassword?.message} {...register('confirmPassword')} />

      {serverError && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <button type="submit" disabled={isSubmitting}
        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-60">
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        Crear cuenta
      </button>

      <p className="text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <button type="button" onClick={onSwitch} className="text-indigo-600 hover:underline font-medium">
          Inicia sesión
        </button>
      </p>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg mb-4">
            <CheckSquare size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">TaskMaster</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona tus tareas de forma inteligente</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 animate-fade-in">
          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className={cn(
                  'flex-1 py-2 text-sm font-medium rounded-md transition-all',
                  mode === tab
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          {mode === 'login'
            ? <LoginForm onSwitch={() => setMode('register')} />
            : <RegisterForm onSwitch={() => setMode('login')} />}
        </div>
      </div>
    </div>
  );
}
