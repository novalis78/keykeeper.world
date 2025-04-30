'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Create context for authentication
const AuthContext = createContext();

/**
 * Authentication provider component
 * 
 * Manages the authentication state and provides auth methods to child components
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Verify token with the server
        const response = await fetch('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        
        if (response.ok && data.authenticated) {
          setUser(data.user);
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  /**
   * Log out the current user
   */
  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        // Call logout API
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Remove token from localStorage
        localStorage.removeItem('auth_token');
      }
      
      // Clear user state
      setUser(null);
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  /**
   * Get authentication token
   * @returns {string|null} The authentication token or null if not logged in
   */
  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  };
  
  // Provide auth context to child components
  return (
    <AuthContext.Provider value={{ user, loading, logout, getToken, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use authentication context
 * @returns {Object} Auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Custom hook to protect routes that require authentication
 * @param {string} redirectTo - Page to redirect to if not authenticated
 */
export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);
  
  return { user, loading };
}

export default { AuthProvider, useAuth, useRequireAuth };