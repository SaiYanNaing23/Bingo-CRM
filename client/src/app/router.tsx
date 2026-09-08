import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Loading, ErrorState } from '@/components/shared/states'
const AuthPage = lazy(() => import('@/features/auth/auth-page'))
const Workspace = lazy(() =>
  import('./layouts/workspace').then((module) => ({ default: module.Workspace })),
)
const CompanyPages = lazy(() => import('@/features/companies/pages'))
const ContactPages = lazy(() => import('@/features/contacts/pages'))
const ApplicationPages = lazy(() => import('@/features/applications/pages'))
const TaskPages = lazy(() => import('@/features/tasks/pages'))
const TodayPage = lazy(() => import('@/features/tasks/today-page'))
const AppearancePage = lazy(() => import('@/features/settings/appearance-page'))
const DesignPreview = import.meta.env.DEV ? lazy(() => import('@/app/design-preview')) : () => null
function Root() {
  const auth = useAuth()
  if (auth.status === 'loading')
    return (
      <div className="mx-auto max-w-xl p-10">
        <Loading />
      </div>
    )
  if (auth.status === 'error')
    return (
      <div className="mx-auto max-w-xl space-y-4 p-10">
        <ErrorState error={new Error(auth.message)} retry={auth.verify} />
        <Button onClick={auth.logout} variant="outline">
          Return to sign in
        </Button>
      </div>
    )
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <Loading />
        </div>
      }
    >
      <Outlet />
    </Suspense>
  )
}
function Protected() {
  const auth = useAuth()
  const location = useLocation()
  return auth.user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  )
}
const routePages = [
  { path: 'companies', Component: CompanyPages },
  { path: 'contacts', Component: ContactPages },
  { path: 'applications', Component: ApplicationPages },
  { path: 'tasks', Component: TaskPages },
]
export const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: (
      <div className="p-8">
        <ErrorState
          error={new Error('Something went wrong while displaying this page. Reload to try again.')}
          retry={() => window.location.reload()}
        />
      </div>
    ),
    children: [
      { path: '/login', element: <AuthPage key="login" /> },
      { path: '/register', element: <AuthPage register key="register" /> },
      ...(import.meta.env.DEV ? [{ path: '/design-preview', element: <DesignPreview /> }] : []),
      {
        element: <Protected />,
        children: [
          {
            element: <Workspace />,
            children: [
              { index: true, element: <Navigate to="/companies" replace /> },
              { path: 'tasks/today', element: <TodayPage /> },
              { path: 'settings', element: <Navigate to="/settings/appearance" replace /> },
              { path: 'settings/appearance', element: <AppearancePage /> },
              ...routePages.flatMap(({ path, Component }) => [
                { path, element: <Component view="list" /> },
                { path: `${path}/new`, element: <Component view="edit" /> },
                { path: `${path}/:id`, element: <Component view="detail" /> },
                { path: `${path}/:id/edit`, element: <Component view="edit" /> },
              ]),
              {
                path: '*',
                element: (
                  <ErrorState
                    error={new Error('This page does not exist. Choose a module from the sidebar.')}
                  />
                ),
              },
            ],
          },
        ],
      },
    ],
  },
])
