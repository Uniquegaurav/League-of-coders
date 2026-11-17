import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { Swords } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import crystalCave from '../assets/bg/crystal-cave.jpg';

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
    <div className="mx-auto grid max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="relative min-h-[180px] md:min-h-[600px]">
        <img src={crystalCave} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/40 to-ink-950/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500">
            <Swords className="h-6 w-6 text-white" />
          </span>
          <p className="mt-4 font-display text-2xl font-bold text-white">League of Coders</p>
          <p className="mt-1 text-sm text-ink-300">Battle friends on real LeetCode problems.</p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
        <h1 className="font-display text-3xl font-bold text-white">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mt-1 text-ink-400">{mode === 'login' ? 'Sign in to continue.' : 'Join in a few seconds.'}</p>

        <div className="mt-8 flex justify-center">
          <GoogleLogin
            theme="filled_blue"
            size="large"
            shape="pill"
            width="320"
            text="continue_with"
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
