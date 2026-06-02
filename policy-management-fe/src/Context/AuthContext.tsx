/* eslint-disable react-refresh/only-export-components */
// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User, Role, AuthContextType } from '../types';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Add loading state
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const navigate = useNavigate();
  const refreshIntervalRef = useRef<number | null>(null);
  const isRefreshingRef = useRef<boolean>(false);
  const idleTimerRef = useRef<number | null>(null);
  const isIdleRef = useRef<boolean>(false);
  const absoluteLogoutTimerRef = useRef<number | null>(null);
  const logoutRef = useRef<() => void>(() => {});
  const CLOSED_GRACE_MS = 15 * 60 * 1000; // 15 minutes buffer for closed tab
  const recordActivity = useCallback(() => {
    try {
      localStorage.setItem('lastActivityAt', String(Date.now()));
    } catch {
      // ignore storage failures (e.g., private mode)
      void 0;
    }
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    setSessionExpiresAt(null);
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (absoluteLogoutTimerRef.current) {
      window.clearTimeout(absoluteLogoutTimerRef.current);
      absoluteLogoutTimerRef.current = null;
    }
    navigate('/');
  }, [navigate]);
  useEffect(() => { logoutRef.current = logout; }, [logout]);
  
  const scheduleAbsoluteLogout = useCallback((expiresAtMs: number) => {
    if (absoluteLogoutTimerRef.current) {
      window.clearTimeout(absoluteLogoutTimerRef.current);
      absoluteLogoutTimerRef.current = null;
    }
    const delay = Math.max(0, expiresAtMs - Date.now());
    if (delay === 0) return logout();
    absoluteLogoutTimerRef.current = window.setTimeout(() => {
      logout();
    }, delay);
  }, [logout]);

  const decodeJwtExp = (token: string): number | null => {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      if (decoded && typeof decoded.exp === 'number') {
        return decoded.exp * 1000;
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      setIsLoading(true); // Start loading
      try {
        // If the tab was closed longer than CLOSED_GRACE_MS, force logout
        const last = Number(localStorage.getItem('lastActivityAt') || '0');
        const offlineMs = last ? Date.now() - last : 0;
        if (offlineMs > CLOSED_GRACE_MS) {
          const tokenExists = !!localStorage.getItem('authToken');
          if (tokenExists) {
            logout();
            return;
          }
        }

        const token = localStorage.getItem('authToken');
        if (token) {
          // Validate token with backend
          const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/user/validate`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setRole(data.role);
            setIsAuthenticated(true);
            const expMs = decodeJwtExp(token);
            if (expMs) {
              setSessionExpiresAt(expMs);
              scheduleAbsoluteLogout(expMs);
            }
          } else {
            // Clear invalid token
            localStorage.removeItem('authToken');
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false); // End loading regardless of outcome
      }
    };

    checkAuth();
  }, [scheduleAbsoluteLogout, logout, CLOSED_GRACE_MS]);

  const login = async (phone: string, password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const { token, user, role, expiresAt } = await response.json();
      
      localStorage.setItem('authToken', token);
      setUser(user);
      setRole(role);
      setIsAuthenticated(true);
      // Set absolute session timer
      const expFromServer = expiresAt ? new Date(expiresAt).getTime() : null;
      const expFromJwt = decodeJwtExp(token);
      const finalExp = expFromServer || expFromJwt;
      if (finalExp) {
        setSessionExpiresAt(finalExp);
        scheduleAbsoluteLogout(finalExp);
      }
      
      // Fix: Use setTimeout instead of setInterval and navigate immediately
      setTimeout(() => {
        navigate('/admin/users');
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string | null, password: string, phoneNumber: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/auth/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Register failed');
      }

      const { token, user, role, expiresAt } = await response.json();
      
      localStorage.setItem('authToken', token);
      setUser(user);
      setRole(role);
      // setIsAuthenticated(true);
      const expFromServer = expiresAt ? new Date(expiresAt).getTime() : null;
      const expFromJwt = token ? decodeJwtExp(token) : null;
      const finalExp = expFromServer || expFromJwt;
      if (finalExp) {
        setSessionExpiresAt(finalExp);
        scheduleAbsoluteLogout(finalExp);
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };



  // Periodic permission validation (every 5 minutes, only when visible)
  useEffect(() => {
    const startPeriodicValidation = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      refreshIntervalRef.current = window.setInterval(async () => {
        if (isRefreshingRef.current) return;
        isRefreshingRef.current = true;
        try {
          if (document.hidden) return; // skip when tab hidden
          const token = localStorage.getItem('authToken');
          if (!token) return;

          const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/user/validate`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setRole(data.role);
            setIsAuthenticated(true);
            // keep absolute timer in sync from JWT exp if needed
            const expMs = decodeJwtExp(token);
            if (expMs && expMs !== sessionExpiresAt) {
              setSessionExpiresAt(expMs);
              scheduleAbsoluteLogout(expMs);
            }
          } else if (response.status === 401 || response.status === 403) {
            // Token invalid or permissions revoked – enforce logout
            logout();
          }
        } catch (error) {
          console.error('Periodic permission validation failed:', error);
        } finally {
          isRefreshingRef.current = false;
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    if (isAuthenticated) {
      startPeriodicValidation();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, logout, scheduleAbsoluteLogout, sessionExpiresAt]);

  // Auto-logout on inactivity (60 minutes)
  useEffect(() => {
    const IDLE_TIMEOUT = 60 * 60 * 1000; // 1 hour
    const activityEvents: Array<keyof DocumentEventMap> = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];

    const handleLogoutDueToIdle = () => {
      if (!isAuthenticated) return;
      isIdleRef.current = true;
      logout();
    };

    const resetIdleTimer = () => {
      if (!isAuthenticated) return;
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(handleLogoutDueToIdle, IDLE_TIMEOUT);
      isIdleRef.current = false;
      recordActivity();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        recordActivity();
        if (idleTimerRef.current) {
          window.clearTimeout(idleTimerRef.current);
        }
      } else {
        const last = Number(localStorage.getItem('lastActivityAt') || '0');
        if (last && Date.now() - last > CLOSED_GRACE_MS) {
          logout();
          return;
        }
        if (!isIdleRef.current) {
          resetIdleTimer();
        }
      }
    };

    if (isAuthenticated) {
      activityEvents.forEach((evt) => document.addEventListener(evt, resetIdleTimer, { passive: true }));
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('beforeunload', recordActivity);
      resetIdleTimer();
    }

    return () => {
      activityEvents.forEach((evt) => document.removeEventListener(evt, resetIdleTimer));
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', recordActivity);
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      isIdleRef.current = false;
    };
  }, [isAuthenticated, logout, recordActivity, CLOSED_GRACE_MS]);

  // Add new function to send OTP
  const sendOTP = async (phone: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Extract the actual error message from the response
        const errorMessage = errorData.message || errorData.error || 'Failed to send OTP';
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  };

  // Add new function to verify OTP
  const verifyOTP = async (phone: string, otp: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Extract the actual error message from the response
        const errorMessage = errorData.message || errorData.error || 'OTP verification failed';
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // If verification includes user data and token, update auth state
      if (data.token && data.user) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        setRole(data.role || null);
        setIsAuthenticated(true);
        const expFromServer = data.expiresAt ? new Date(data.expiresAt).getTime() : null;
        const expFromJwt = decodeJwtExp(data.token);
        const finalExp = expFromServer || expFromJwt;
        if (finalExp) {
          setSessionExpiresAt(finalExp);
          scheduleAbsoluteLogout(finalExp);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  };

  const hasPermission = (permission: string): boolean => {
    // Check if user has ADMIN role (case-insensitive)
    if (role?.role_name?.toUpperCase() === 'ADMIN') {
      return true;
    }
    // Otherwise check specific permission
    if (!role || !role.permissions) return false;
    return Boolean(role.permissions[permission]);
  };

  // Add new function to set user sites
  const setUserSites = async (sites: string[]) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/sites/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ sites }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set user sites');
      }

      const data = await response.json();
      
      // Update user with new sites
      if (user) {
        setUser({
          ...user,
          sites: data.sites,
        } as User);
      }

      // Navigate to dashboard after successful site selection
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Set user sites error:', error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    role,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    hasPermission,
    sendOTP,
    verifyOTP,
    setUserSites,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

