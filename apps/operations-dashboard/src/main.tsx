import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider.tsx'
import { DetailProvider } from './components/Detail/DetailContext.tsx'
import { ThemeProvider } from './theme/ThemeProvider.tsx'
import { VentureFilterProvider } from './context/VentureFilterContext.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reasonable defaults for a dashboard — long stale time, refetch on focus.
      staleTime: 15_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <VentureFilterProvider>
            <DetailProvider>
              <App />
            </DetailProvider>
          </VentureFilterProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
