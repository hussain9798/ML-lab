import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data.user);
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.data.requires_otp) return res.data;
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    if (res.data.requires_otp) return res.data;
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const verifyOtp = async (challenge, otp) => {
    const res = await authAPI.verifyOtp({
      email: challenge.email,
      temp_token: challenge.temp_token,
      purpose: challenge.purpose,
      otp,
    });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const resendOtp = (challenge) => authAPI.resendOtp({
    email: challenge.email,
    temp_token: challenge.temp_token,
    purpose: challenge.purpose,
  });

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (name) => {
    const res = await authAPI.updateProfile({ name });
    setUser(res.data.user);
    return res.data.user;
  };

  const requestEmailChange = (email) => authAPI.requestEmailChange(email);

  const confirmEmailChange = async (challenge, otp) => {
    const res = await authAPI.confirmEmailChange({
      email: challenge.email,
      temp_token: challenge.temp_token,
      otp,
    });
    setUser(res.data.user);
    return res.data.user;
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        updateProfile,
        requestEmailChange,
        confirmEmailChange,
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
