import React, { Suspense, lazy, useMemo } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';
import AdminLayout from '@/app/admin/layout';
import RootLandingPage from '@/app/page';
import { RouteLoadingFallback } from '@/components/common/RouteLoadingFallback';

type PageModule = {
  default: React.ComponentType<any>;
};

// Auto-discovers all page.tsx routes ported from /src/app
const PAGE_MODULES = import.meta.glob<PageModule>('./**/page.tsx');

// Creates a React 19 compatible pre-fulfilled Thenable Promise so pages calling
// React.use(params) resolve synchronously on the client without suspending.
function createFulfilledPromise<T>(value: T): Promise<T> {
  const p = Promise.resolve(value) as Promise<T> & {
    status?: string;
    value?: T;
  };
  p.status = 'fulfilled';
  p.value = value;
  return p;
}

// Converts a Next.js App Router relative path (./journey/checkpoint/[unitId]/page.tsx)
// into a React Router v7 path (/journey/checkpoint/:unitId).
function toRouterPath(globKey: string): string {
  const stripped = globKey
    .replace(/^\.\//, '')
    .replace(/(^|\/)page\.tsx$/, '');
  if (!stripped) return '/';
  const segments = stripped.split('/').map((seg) => {
    const match = seg.match(/^\[([^\]]+)\]$/);
    return match ? `:${match[1]}` : seg;
  });
  return `/${segments.join('/')}`;
}

interface DiscoveredRoute {
  path: string;
  isAdmin: boolean;
  Component: React.ComponentType<any>;
}

const DISCOVERED_ROUTES: DiscoveredRoute[] = Object.entries(PAGE_MODULES).map(
  ([globKey, loader]) => {
    const path = toRouterPath(globKey);
    return {
      path,
      isAdmin: path === '/admin' || path.startsWith('/admin/'),
      Component: path === '/' ? RootLandingPage : lazy(loader),
    };
  },
);

if (!DISCOVERED_ROUTES.some((r) => r.path === '/')) {
  DISCOVERED_ROUTES.unshift({
    path: '/',
    isAdmin: false,
    Component: RootLandingPage,
  });
}

const ADMIN_ROUTES = DISCOVERED_ROUTES.filter((r) => r.isAdmin);
const STANDARD_ROUTES = DISCOVERED_ROUTES.filter((r) => !r.isAdmin);

const PageEntryWrapper: React.FC<{
  Component: React.ComponentType<any>;
}> = ({ Component }) => {
  const rawParams = useParams();
  const { search } = useLocation();

  const paramsPromise = useMemo(() => {
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawParams)) {
      if (v !== undefined) clean[k] = v;
    }
    return createFulfilledPromise(clean);
  }, [rawParams]);

  const searchParamsPromise = useMemo(() => {
    const sp = new URLSearchParams(search);
    const obj: Record<string, string> = {};
    sp.forEach((v, k) => {
      obj[k] = v;
    });
    return createFulfilledPromise(obj);
  }, [search]);

  return <Component params={paramsPromise} searchParams={searchParamsPromise} />;
};

const AdminLayoutOutlet: React.FC = () => (
  <AdminLayout>
    <Outlet />
  </AdminLayout>
);

export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Legacy route redirects from /src/app */}
        <Route
          path="/grammar/foundation"
          element={<Navigate to="/grammar?level=A0" replace />}
        />
        <Route
          path="/grammar/foundation/a1"
          element={<Navigate to="/grammar?level=A1" replace />}
        />
        <Route path="/grammar/learn" element={<Navigate to="/grammar" replace />} />
        <Route
          path="/practice"
          element={<Navigate to="/student/speaking/foundation" replace />}
        />
        <Route
          path="/practice/reading"
          element={<Navigate to="/practice/reading-library" replace />}
        />
        <Route path="/profile" element={<Navigate to="/student/profile" replace />} />
        <Route path="/referral" element={<Navigate to="/student/referral" replace />} />
        <Route
          path="/student/stats"
          element={<Navigate to="/student/profile#stats" replace />}
        />

        {/* Admin Portal Routes wrapped in /src/app/admin/layout.tsx */}
        <Route element={<AdminLayoutOutlet />}>
          {ADMIN_ROUTES.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<PageEntryWrapper Component={route.Component} />}
            />
          ))}
        </Route>

        {/* All Student, Teacher, Exam, Practice, Dictionary, Auth & Public Routes */}
        {STANDARD_ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<PageEntryWrapper Component={route.Component} />}
          />
        ))}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
