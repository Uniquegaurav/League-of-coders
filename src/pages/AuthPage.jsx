import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { Swords } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

export default function AuthPage() {
  const { user, login, register, googleLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const signedInHere = useRef(false);
  const from = location.state?.from || '/';

  useEffect(() => {
    document.title = 'Sign in · League of Coders';
  }, []);

  if (user && !signedInHere.current) return <Navigate to={from} replace />;

  const done = (me) => {
    signedInHere.current = true;
    toast.success(`Welcome${mode === 'register' ? '' : ' back'}, ${me.name.split(' ')[0]}!`);
    // New players need a LeetCode link before they can battle.
    navigate(me.leetcode?.verified ? from : '/u/me', { replace: true, state: me.leetcode?.verified ? undefined : { from } });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      done(mode === 'login' ? await login(form) : await register(form));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 items-center gap-10 py-6 lg:grid-cols-[minmax(0,1fr)_440px]">
      <div className="hidden lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neon-400">League of Coders</p>
        <p className="mt-4 max-w-lg font-display text-6xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-lg">
          Enter the
          <br />
          <span className="bg-gradient-to-r from-neon-400 via-brand-400 to-fuchsia-400 bg-clip-text text-transparent">arena.</span>
        </p>
        <p className="mt-5 max-w-md text-lg text-ink-200">Battle friends on real LeetCode problems and climb the ranks.</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-ink-950/70 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 lg:hidden">
          <Swords className="h-6 w-6 text-white" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-white lg:mt-0">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mt-1 text-ink-400">{mode === 'login' ? 'Sign in to continue.' : 'Join in a few seconds.'}</p>

        <div className="mt-8 flex justify-start">
          <GoogleLogin
            theme="filled_blue"
            size="large"
            shape="pill"
            width="320"
            text="continue_with"
            logo_alignment="left"
            onSuccess={async ({ credential }) => {
              try {
                done(await googleLogin(credential));
              } catch (err) {
                toast.error(err.message);
              }
            }}
            onError={() => toast.error('Google sign-in was cancelled')}
          />
        </div>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-ink-500">
          <span className="h-px flex-1 bg-ink-700" />
          or with email
          <span className="h-px flex-1 bg-ink-700" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="label" htmlFor="name">
                Name
              </label>
              <input id="name" className="input" required maxLength={60} value={form.name} onChange={set('name')} autoComplete="name" />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" className="input" required value={form.email} onChange={set('email')} autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              required
              minLength={6}
              value={form.password}
              onChange={set('password')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
          <p className="text-center text-sm text-ink-400">
            {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
            <button type="button" className="font-semibold text-brand-400 hover:underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
