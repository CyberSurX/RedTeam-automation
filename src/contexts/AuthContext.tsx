/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch user profile
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      setError(null);
      // MOCK PROFILE FOR TESTING
      const token = localStorage.getItem('token');
      if (token === 'mock-jwt-token-12345') {
        setUser({
          id: '1',
          email: 'admin@cybersurhub.com',
          name: 'RedTeam Admin',
          role: 'admin',
          createdAt: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }

      const response = await axios.get<User>('/api/auth/profile');
      setUser(response.data);
    } catch {
      // Token might be invalid
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      
      // MOCK LOGIN FOR TESTING
      const mockUser = {
        id: '1',
        email,
        name: 'RedTeam Admin',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      const mockToken = 'mock-jwt-token-12345';
      
      localStorage.setItem('token', mockToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
      setUser(mockUser);
      
      /* REAL API CALL
      const response = await axios.post<{ token: string; user: User }>('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      */
    } catch (error: unknown) {
      const errorMessage = ((error as { response?: { data?: { message?: string } } })?.response?.data?.message) || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setError(null);

      // MOCK REGISTER FOR TESTING
      const mockUser = {
        id: '1',
        email,
        name,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      const mockToken = 'mock-jwt-token-12345';
      
      localStorage.setItem('token', mockToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
      setUser(mockUser);
      
      /* REAL API CALL
      const response = await axios.post<{ token: string; user: User }>('/api/auth/register', { email, password, name });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      */
    } catch (error: unknown) {
      const errorMessage = ((error as { response?: { data?: { message?: string } } })?.response?.data?.message) || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};