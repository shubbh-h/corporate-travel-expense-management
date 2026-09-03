import { createContext, useCallback, useEffect, useState } from 'react';
import * as authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // isLoading covers the initial "do we already have a valid session?" check,
  // so ProtectedRoute never redirects to /login before that check finishes.
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted) setUser(currentUser);
      } catch {
        // No valid session (or an expired one the refresh interceptor
        // couldn't recover) - the user simply isn't logged in yet.
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    bootstrapSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthError(null);
    const loggedInUser = await authService.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Clear local state even if the network call fails - the user's intent
      // to log out should never be blocked by a flaky request.
      setUser(null);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    authError,
    setAuthError,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
