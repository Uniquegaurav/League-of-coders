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
  const [emailOpen, setEmailOpen] = useState(false);
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
    navigate(me.leetcode ? from : '/u/me', { replace: true, state: me.leetcode ? undefined : { from } });
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
    <div className="mx-auto flex max-w-md flex-col items-center py-10">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500">
        <Swords className="h-7 w-7 text-white" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-bold text-white">Sign in</h1>
      <p className="mt-1 text-center text-ink-400">Google is the fastest way in. Email is there if you already have a password.</p>

      <div className="card mt-8 w-full space-y-5 p-6">
        <div className="flex justify-center">
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

        <button type="button" className="btn-secondary w-full" onClick={() => setEmailOpen((open) => !open)}>
          {emailOpen ? 'Hide email sign in' : 'Use email instead'}
        </button>

        {emailOpen && (
          <form onSubmit={submit} className="space-y-4 border-t border-ink-800 pt-5">
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
            <button type="submit" className="btn-secondary w-full py-3" disabled={busy}>
              {busy && <Spinner className="h-4 w-4" />} {mode === 'login' ? 'Sign in with email' : 'Create account'}
            </button>
            <p className="text-center text-sm text-ink-400">
              {mode === 'login' ? 'No account yet?' : 'Already have a password?'}{' '}
              <button
                type="button"
                className="font-semibold text-brand-400 hover:underline"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
