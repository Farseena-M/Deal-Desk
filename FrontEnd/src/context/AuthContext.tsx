import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, unwrap } from '../lib/api';
import type { User } from '../types';

interface AuthValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem('dealdesk_token')
  );

  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('dealdesk_user');

    try {
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const value = useMemo<AuthValue>(
    () => ({
      user,
      token,
      loading: false,

      // Login
      async login(email, password) {
        const response = await api.post('/auth/login', {
          email,
          password,
        });

        const result = unwrap<{
          accessToken: string;
          user: User;
        }>(response);

        if (!result?.accessToken || !result.user) {
          throw new Error(
            'Login response did not include an access token and user.'
          );
        }

        localStorage.setItem('dealdesk_token', result.accessToken);
        localStorage.setItem(
          'dealdesk_user',
          JSON.stringify(result.user)
        );

        setToken(result.accessToken);
        setUser(result.user);
      },

      // Logout
      logout() {
        localStorage.removeItem('dealdesk_token');
        localStorage.removeItem('dealdesk_user');

        setToken(null);
        setUser(null);
      },
    }),
    [user, token]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom authentication hook
export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
