import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';

export type UserRole = 'user' | 'reviewer';

interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  fetchProfile: (role?: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export useAuthContext as alias for compatibility
export const useAuthContext = useAuth;

interface AuthProviderProps {
  children: ReactNode;
}

const API_BACKEND_URL = import.meta.env.VITE_API_BACKEND_URL;

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (role?: UserRole) => {
    try {

      let endpoint = ``;      
      if (role === 'reviewer') {
        endpoint = `${API_BACKEND_URL}/api/auth/reviewer/status`;
      } else if (role === 'user') {
        endpoint = `${API_BACKEND_URL}/api/auth/user/profile`;
      }

      const response = await axios.get(endpoint, {
        withCredentials: true
      });

      if (response.data.user) {
        const userData: User = {
          id: response.data.user.id || response.data.user.uniqueId,
          email: response.data.user.email,
          name: response.data.user.name,
          role: response.data.user.role || role || 'user'
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await fetchProfile();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await axios.post(`${API_BACKEND_URL}/api/auth/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    fetchProfile,
    logout,
    isAuthenticated: !!user,
    isLoading,
    role: user?.role || null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};