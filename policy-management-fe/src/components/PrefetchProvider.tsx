import { useEffect } from 'react';
import { usePrefetchReferenceData } from '../hooks/usePrefetch';
import { useAuth } from '../Context/AuthContext';

// Preloads critical reference data as soon as the user is authenticated
// This makes navigation feel instant because data is already in cache
export function PrefetchProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const prefetchAll = usePrefetchReferenceData();

  useEffect(() => {
    if (isAuthenticated) {
      // Small delay to not block initial render
      const timer = setTimeout(() => {
        prefetchAll();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, prefetchAll]);

  return <>{children}</>;
}
