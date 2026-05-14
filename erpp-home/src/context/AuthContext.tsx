import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  username: string;
  role: 'super_admin' | 'head_hr' | 'branch_hr' | 'department_hr' | 'employee';
  employeeId?: string;
  branch?: string | null;
  departments?: string[];
}

export type LoginResult = { ok: true } | { ok: false; error: string };

interface AuthContextType {
  user: User | null;
  activeRole: 'super_admin' | 'head_hr' | 'branch_hr' | 'department_hr' | 'employee';
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  switchRole: (role: 'super_admin' | 'head_hr' | 'branch_hr' | 'department_hr' | 'employee') => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_DEBUG = import.meta.env.DEV;

function authLog(...args: unknown[]) {
  if (AUTH_DEBUG) console.log('[EMS Auth]', ...args);
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const msg = body?.error?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
    const code = body?.error?.code;
    if (typeof code === 'string' && code.trim()) return code;
  } catch {
    /* ignore */
  }
  return res.statusText || 'Request failed';
}

// Using backend-auth only; no demo credentials in the client.

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('ems_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [activeRole, setActiveRole] = useState<'super_admin' | 'head_hr' | 'branch_hr' | 'department_hr' | 'employee'>(() => {
    const stored = localStorage.getItem('ems_user');
    return stored ? JSON.parse(stored).role : 'employee';
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      authLog('POST /api/auth/login', { email: email.trim() });

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errText = await readErrorMessage(res);
        authLog('login failed', res.status, errText);
        return { ok: false, error: errText };
      }

      const loginJson = await res.json();
      const token = loginJson?.data?.token as string | undefined;
      if (token) {
        localStorage.setItem('ems_token', token);
        authLog('login OK; JWT stored for Bearer fallback');
      } else {
        authLog('login OK; no token in body (cookie-only session)');
      }

      const sessionHeaders: HeadersInit = {};
      if (token) sessionHeaders.Authorization = `Bearer ${token}`;

      let sess = await fetch('/api/auth/session', {
        credentials: 'include',
        headers: Object.keys(sessionHeaders).length ? sessionHeaders : undefined,
      });

      if (!sess.ok && token) {
        authLog('session with cookie failed, retrying with Bearer only', sess.status);
        sess = await fetch('/api/auth/session', {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (!sess.ok) {
        const errText = await readErrorMessage(sess);
        authLog('session failed', sess.status, errText);
        if (sess.status === 403) {
          return {
            ok: false,
            error: errText || 'Complete session step failed (e.g. password change required).',
          };
        }
        return { ok: false, error: errText || 'Could not load session after login.' };
      }

      const body = await sess.json();
      const udata = body?.data || {};
      authLog('session OK', { role: udata.role, employee_id: udata.employee_id });

      let mappedRole: User['role'] = 'employee';
      const backendRole = String(udata.role || '').toLowerCase();
      if (backendRole === 'super_admin') mappedRole = 'super_admin';
      else if (backendRole.includes('hr')) mappedRole = 'head_hr';
      else mappedRole = 'employee';

      const u: User = {
        username: udata.email || email.trim(),
        role: mappedRole,
        employeeId: udata.employee_id || undefined,
      };

      setUser(u);
      setActiveRole(u.role);
      localStorage.setItem('ems_user', JSON.stringify(u));
      authLog('user persisted', { role: u.role, employeeId: u.employeeId });
      return { ok: true };
    } catch (e) {
      authLog('login exception', e);
      return { ok: false, error: 'Network error — is the API running (Vite proxy → backend)?' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ems_user');
    localStorage.removeItem('ems_token');
  };

  const switchRole = (role: 'super_admin' | 'head_hr' | 'branch_hr' | 'department_hr' | 'employee') => {
    setActiveRole(role);
  };

  return (
    <AuthContext.Provider value={{ user, activeRole, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}