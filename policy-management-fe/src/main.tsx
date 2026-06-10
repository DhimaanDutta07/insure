// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './Context/AuthContext.tsx'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from './components/ui/sonner.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000, // 5min - data stays fresh much longer
      gcTime: 30 * 60_000, // 30min garbage collection (was cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 401 authentication errors
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true, // Refetch on reconnect to get fresh data
      networkMode: 'online', // Only fetch when online, show cached data when offline
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry on 401 authentication errors
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 2;
      },
      networkMode: 'online',
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>,
)
