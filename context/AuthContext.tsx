'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

interface AuthResult {
  ok: boolean;
  requiresVerification?: boolean;
  email?: string;
  message?: string;
  error?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  verifyEmail: (email: string, code: string) => Promise<AuthResult>;
  resendVerificationCode: (email: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Đăng nhập thất bại.' };
      }
      setUser(data.user);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Lỗi kết nối máy chủ. Vui lòng thử lại.' };
    }
  };

  const register = async (input: RegisterInput): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Đăng ký thất bại.' };
      }
      if (data.requiresVerification) {
        return {
          ok: true,
          requiresVerification: true,
          email: data.email,
          message: data.message,
        };
      }
      if (data.user) {
        setUser(data.user);
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Lỗi kết nối máy chủ. Vui lòng thử lại.' };
    }
  };

  const verifyEmail = async (email: string, code: string): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Xác thực thất bại.' };
      }
      setUser(data.user);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Lỗi kết nối máy chủ. Vui lòng thử lại.' };
    }
  };

  const resendVerificationCode = async (email: string): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Không thể gửi lại mã.' };
      }
      return { ok: true, message: data.message };
    } catch {
      return { ok: false, error: 'Lỗi kết nối máy chủ. Vui lòng thử lại.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyEmail,
        resendVerificationCode,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const fallbackAuthContext: AuthContextType = {
  user: null,
  loading: false,
  login: async () => ({ ok: false, error: 'AuthProvider chưa được khởi tạo.' }),
  register: async () => ({ ok: false, error: 'AuthProvider chưa được khởi tạo.' }),
  verifyEmail: async () => ({ ok: false, error: 'AuthProvider chưa được khởi tạo.' }),
  resendVerificationCode: async () => ({ ok: false, error: 'AuthProvider chưa được khởi tạo.' }),
  logout: async () => {},
  refreshUser: async () => {},
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context || fallbackAuthContext;
}
