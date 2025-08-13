import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../services/api';

interface User {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing authentication on app start
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        console.log('AuthContext: Checking for saved authentication...');
        
        // Check AsyncStorage for saved authentication
        const savedToken = await AsyncStorage.getItem('authToken');
        const savedUserData = await AsyncStorage.getItem('user');
        
        if (savedToken && savedUserData) {
          const userData = JSON.parse(savedUserData);
          console.log('AuthContext: Found saved auth for:', userData.email);
          
          // Set the token in API service
          setAuthToken(savedToken);
          
          // Restore user state
          setToken(savedToken);
          setUser(userData);
          
          console.log('AuthContext: Authentication restored successfully');
        } else {
          console.log('AuthContext: No saved authentication found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setLoading(false);
      }
    };

    checkAuthState();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    console.log('AuthContext: Logging in user:', newUser.email);
    
    try {
      // Set the token in API service FIRST, before updating state
      setAuthToken(newToken);
      
      setToken(newToken);
      setUser(newUser);
      
      // Save to AsyncStorage for persistence
      await AsyncStorage.setItem('authToken', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      
      console.log('AuthContext: User authentication saved to storage');
    } catch (error) {
      console.error('AuthContext: Error saving authentication:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('AuthContext: Logging out user');
    
    try {
      // Clear the token in API service FIRST
      setAuthToken(null);
      
      setToken(null);
      setUser(null);
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      
      // Also sign out from Firebase
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('../firebase.config');
      await signOut(auth);
      
      console.log('AuthContext: User logged out successfully');
    } catch (error) {
      console.error('AuthContext: Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;