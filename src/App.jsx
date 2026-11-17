import { lazy, Suspense, useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import { PageLoader } from './components/ui';
import { useAuth } from './context/AuthContext';
import CompeteHome from './pages/CompeteHome';

const NewMatch = lazy(() => import('./pages/NewMatch'));
const MatchRoom = lazy(() => import('./pages/MatchRoom'));
const Practice = lazy(() => import('./pages/Practice'));
const ProblemPage = lazy(() => import('./pages/ProblemPage'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Community = lazy(() => import('./pages/Community'));
const Profile = lazy(() => import('./pages/Profile'));
const AuthPage = lazy(() => import('./pages/AuthPage'));

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function LegacyJoinRedirect() {
  const { code } = useParams();
  return <Navigate to={`/m/${code}`} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="font-display text-6xl font-bold text-white">404</p>
      <p className="mt-2 text-ink-400">That page does not exist.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to Compete
      </Link>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const fullBleed = pathname.startsWith('/m/');

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className={fullBleed ? 'flex-1' : 'mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6'}>
        <ErrorBoundary key={pathname}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<CompeteHome />} />
            <Route
              path="/new"
              element={
                <RequireAuth>
                  <NewMatch />
                </RequireAuth>
              }
            />
            <Route path="/m/:code" element={<MatchRoom />} />
            <Route path="/join/:code" element={<LegacyJoinRedirect />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/problems/:slug" element={<ProblemPage />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/community" element={<Community />} />
            <Route path="/u/:id" element={<Profile />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/compete" element={<Navigate to="/" replace />} />
            <Route path="/problems" element={<Navigate to="/practice" replace />} />
            <Route path="/updates" element={<Navigate to="/community" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>
      {!fullBleed && (
        <footer className="border-t border-ink-800/80 py-8 text-center text-xs text-ink-500">
          League of Coders · Problems and submissions are powered by LeetCode · Built for friendly competition
        </footer>
      )}
    </div>
  );
}
