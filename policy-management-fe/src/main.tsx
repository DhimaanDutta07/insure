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
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
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
  </BrowserRouter>
)
