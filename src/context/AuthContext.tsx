import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.ts';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  loginApi: (email: string, password: string) => Promise<void>;
  registerApi: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('finmate_token');
      const storedUser = localStorage.getItem('finmate_user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token against server if not mock
          if (storedToken !== 'mock_preview_jwt_token' && storedToken !== 'mock_jwt_token_alex') {
            try {
              const res = await api.get('/auth/me');
              if (res.data && res.data.user) {
                setUser(res.data.user);
                localStorage.setItem('finmate_user', JSON.stringify(res.data.user));
              }
            } catch (err) {
              // Token expired or invalid
              localStorage.removeItem('finmate_token');
              localStorage.removeItem('finmate_user');
              setToken(null);
              setUser(null);
            }
          }
        } catch (e) {
          localStorage.removeItem('finmate_token');
          localStorage.removeItem('finmate_user');
        }
      } else {
        // Default to Alex Chen preview account for instant AI Studio sandbox usability
        const defaultUser: User = {
          id: 'usr_mock_01',
          name: 'Alex Chen',
          email: 'alex.chen@example.com',
          role: 'Senior Engineer'
        };
        setUser(defaultUser);
        setToken('mock_jwt_token_alex');
        localStorage.setItem('finmate_token', 'mock_jwt_token_alex');
        localStorage.setItem('finmate_user', JSON.stringify(defaultUser));
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('finmate_token', newToken);
    localStorage.setItem('finmate_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const loginApi = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      login(newToken, userData);
    } catch (error: any) {
      // If backend API is not running or returns network error, check mock shortcut
      if (email.toLowerCase().trim() === 'alex.chen@example.com' && password === 'password123') {
        const mockUser: User = {
          id: 'usr_mock_01',
          name: 'Alex Chen',
          email: 'alex.chen@example.com',
          role: 'Senior Engineer'
        };
        login('mock_jwt_token_alex', mockUser);
        return;
      }
      const errMsg = error.response?.data?.message || error.message || 'Login failed. Please verify credentials.';
      throw new Error(errMsg);
    }
  };

  const registerApi = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { token: newToken, user: userData } = response.data;
      login(newToken, userData);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || 'Registration failed.';
      throw new Error(errMsg);
    }
  };

  const logout = async () => {
    try {
      if (token && token !== 'mock_jwt_token_alex') {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      localStorage.removeItem('finmate_token');
      localStorage.removeItem('finmate_user');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        loginApi,
        registerApi,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
