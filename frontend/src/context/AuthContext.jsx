import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthMe, loginUser, registerUser, logoutUser, saveUserTrip } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingSaveTrip, setPendingSaveTrip] = useState(null);

  // Check current session on mount
  const refreshUser = useCallback(async () => {
    try {
      const data = await getAuthMe();
      if (data && data.authenticated && data.user) {
        setUser(data.user);
        return data.user;
      } else {
        setUser(null);
        return null;
      }
    } catch (_) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Login method
  const login = async (credentials) => {
    const res = await loginUser(credentials);
    if (res.user) {
      setUser(res.user);
      // If there was a pending journey to save, commit it automatically
      if (pendingSaveTrip) {
        try {
          await saveUserTrip(pendingSaveTrip.tripId, pendingSaveTrip.tripData);
          setPendingSaveTrip(null);
        } catch (e) {
          console.warn("Failed auto-saving pending journey:", e);
        }
      }
    }
    return res;
  };

  // Register method
  const register = async (userData) => {
    const res = await registerUser(userData);
    if (res.user) {
      setUser(res.user);
      // Auto-save pending trip if one was queued
      if (pendingSaveTrip) {
        try {
          await saveUserTrip(pendingSaveTrip.tripId, pendingSaveTrip.tripData);
          setPendingSaveTrip(null);
        } catch (e) {
          console.warn("Failed auto-saving pending journey:", e);
        }
      }
    }
    return res;
  };

  // Logout method
  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    pendingSaveTrip,
    setPendingSaveTrip,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
