import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Skeleton } from '@/components/common/Skeleton';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useAuthStore } from '@/store/authStore';
import AuthPage from '@/pages/AuthPage';

// Eagerly loaded pages
import DashboardPage from '@/pages/DashboardPage';
import BoardPage from '@/pages/BoardPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Lazy-loaded code-split pages
const AnalyticsPage = React.lazy(() => import('@/pages/AnalyticsPage'));
const ActivityPage  = React.lazy(() => import('@/pages/ActivityPage'));

// ── Pre-React theme flash prevention ─────────────────────────────────────────
(function applyInitialTheme() {
  try {
    const raw = localStorage.getItem('taskflow:theme');
    const parsed = raw ? (JSON.parse(raw) as { state?: { mode?: string } }) : null;
    const mode = parsed?.state?.mode ?? 'system';
    const dark =
      mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch {
    // localStorage unavailable — leave as-is
  }
})();

// ── Suspense fallback ─────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="p-8 space-y-4">
      <Skeleton height={28} className="w-48" />
      <Skeleton height={16} className="w-72" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3"
          >
            <Skeleton height={14} className="w-24" />
            <Skeleton height={28} className="w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

// ── WorkspaceRedirect ─────────────────────────────────────────────────────────
function WorkspaceRedirect() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const activeBoardIds = usePreferencesStore((s) => s.activeBoardIds);

  useEffect(() => {
    if (!workspaceId) { navigate('/'); return; }
    setActiveWorkspace(workspaceId);
    const boardId = activeBoardIds[workspaceId];
    navigate(boardId ? `/board/${boardId}` : '/', { replace: true });
  }, [workspaceId, setActiveWorkspace, activeBoardIds, navigate]);

  return null;
}

// ── Main App Root ─────────────────────────────────────────────────────────────
export default function App() {
  const { isAuthenticated, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/workspace/:workspaceId" element={<WorkspaceRedirect />} />
          <Route path="/board/:boardId" element={<BoardPage />} />
          <Route
            path="/analytics"
            element={<LazyPage><AnalyticsPage /></LazyPage>}
          />
          <Route
            path="/activity"
            element={<LazyPage><ActivityPage /></LazyPage>}
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
