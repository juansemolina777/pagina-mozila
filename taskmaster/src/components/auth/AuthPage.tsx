import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckSquare, ArrowRight, Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../../store/authStore';
import type { GoogleProfile } from '../../store/authStore';
import { useToast } from '../ui/Toast';
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

type LoginData    = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

// ── Google logo SVG ──────────────────────────────────────────────────────────

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ── Google button — only rendered inside <GoogleOAuthProvider> ────────────────

function GoogleSignInButtonActive({ label }: { label: string }) {
  const { loginWithGoogle } = useAuthStore();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(false);
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile: GoogleProfile = await res.json();
        const result = loginWithGoogle(profile);
        if (!result.ok) toast.error('Error', result.error);
        else toast.success('¡Bienvenido!', profile.name);
      } catch {
        toast.error('Error', 'No se pudo obtener el perfil de Google.');
      }
    },
    onError: () => {
      setLoading(false);
      toast.error('Error de Google', 'No se pudo completar el inicio de sesión.');
    },
    flow: 'implicit',
  });

  return (
    <button type="button" disabled={loading}
      onClick={() => { setLoading(true); googleLogin(); }}
      className={cn(
        'w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all',
        'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm hover:shadow-md',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      )}
    >
      {loading ? <Loader2 size={18} className="animate-spin text-slate-400" /> : <GoogleLogo />}
      {label}
    </button>
  );
}

// ── Google button — smart wrapper (shows placeholder if no clientId) ──────────

function GoogleSignInButton({ label }: { label: string }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <button type="button" disabled
        title="Configura VITE_GOOGLE_CLIENT_ID en .env para activar"
        className={cn(
          'w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border text-sm font-medium',
          'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed',
        )}
      >
        <GoogleLogo />
        {label} (requiere configuración)
      </button>
    );
  }

  return <GoogleSignInButtonActive label={label} />;
}

// ── Divider ───────────────────────────────────────────────────────────────────

function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs text-slate-400 font-medium">o continúa con</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

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
    <div className="flex flex-col gap-4">
      <GoogleSignInButton label="Iniciar sesión con Google" />
      <OrDivider />

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
    </div>
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
    <div className="flex flex-col gap-4">
      <GoogleSignInButton label="Registrarse con Google" />
      <OrDivider />

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
    </div>
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

        {/* Google setup hint */}
        {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <p className="text-center text-xs text-slate-400 mt-4">
            Para activar Google, agrega tu <code className="bg-slate-100 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> en el archivo <code className="bg-slate-100 px-1 rounded">.env</code>
          </p>
        )}
      </div>
    </div>
  );
}
