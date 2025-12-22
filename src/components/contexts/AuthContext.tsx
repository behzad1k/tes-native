import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { services } from '@/src/configs/services';
import { AuthEventType } from '@/src/features/auth/services/AuthService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuthStatus: () => Promise<boolean>;
  login: (credentials: any) => Promise<boolean>;
  logout: () => Promise<boolean>;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const authenticated = await services.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      return authenticated;
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  const login = async (credentials: any): Promise<boolean> => {
    try {
      const success = await services.auth.login(credentials);
      if (success) {
        // Auth state will be updated via event listener after OTP verification
      }
      return success;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async (): Promise<boolean> => {
    try {
      const success = await services.auth.logout();
      // Auth state will be updated via event listener
      return success;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  const refreshAuth = async (): Promise<boolean> => {
    return await services.auth.checkAndUpdateAuthState();
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await checkAuthStatus();
      setIsLoading(false);
    };

    // Set up auth event listener
    const unsubscribe = services.auth.onAuthStateChange((eventType: AuthEventType, data?: any) => {
      switch (eventType) {
        case 'login':
          setIsAuthenticated(true);
          break;
        case 'logout':
        case 'tokenExpired':
          setIsAuthenticated(false);
          break;
        case 'authStateChanged':
          if (data?.isAuthenticated !== undefined) {
            setIsAuthenticated(data.isAuthenticated);
          }
          break;
      }
    });

    initAuth();

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        checkAuthStatus,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
