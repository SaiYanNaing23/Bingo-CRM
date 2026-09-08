import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/features/auth/auth-context'
import { ThemeProvider, useTheme } from '@/features/settings/theme-context'
import { queryClient } from '@/lib/query-client'
import { router } from '@/app/router'
import '@/styles/globals.css'
function ThemeToaster() {
  const { resolvedMode } = useTheme()
  return <Toaster theme={resolvedMode} richColors position="bottom-right" closeButton />
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <ThemeToaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
