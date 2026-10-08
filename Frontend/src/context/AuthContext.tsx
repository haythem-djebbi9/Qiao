import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, getToken, setToken } from '../lib/api';
import { User } from '../lib/models';

export type AuthMode = 'login' | 'register';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  company?: string;
  accountType: User['accountType'];
  origin: User['origin'];
}

interface AuthContextValue {
  user: User | null;
  /** Vrai tant que la session enregistrée n'a pas été vérifiée auprès de l'API. */
  initializing: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<User, 'fullName' | 'company' | 'title' | 'location' | 'language'>>) => Promise<User>;
  authModal: { isOpen: boolean; mode: AuthMode; reason?: string };
  openAuth: (mode?: AuthMode, reason?: string) => void;
  /** Ferme la fenêtre sans exécuter l'action en attente (annulation). */
  closeAuth: () => void;
  /** Ferme la fenêtre après une connexion réussie et exécute l'action en attente. */
  finishAuth: () => void;
  /** Exécute l'action si l'utilisateur est connecté, sinon ouvre la connexion puis l'exécute après. */
  requireAuth: (action: () => void, reason?: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [authModal, setAuthModal] = useState<AuthContextValue['authModal']>({ isOpen: false, mode: 'login' });
  const pendingAction = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!getToken()) {
      setInitializing(false);
      return;
    }
    api
      .get<User>('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setInitializing(false));
  }, []);

  const completeSession = useCallback((session: { token: string; user: User }) => {
    setToken(session.token);
    setUser(session.user);
    return session.user;
  }, []);

  const finishAuth = useCallback(() => {
    setAuthModal((current) => ({ ...current, isOpen: false }));
    const action = pendingAction.current;
    pendingAction.current = null;
    if (action) setTimeout(action, 0);
  }, []);

  const login = useCallback(
    async (email: string, password: string) =>
      completeSession(await api.post<{ token: string; user: User }>('/auth/login', { email, password })),
    [completeSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) =>
      completeSession(await api.post<{ token: string; user: User }>('/auth/register', payload)),
    [completeSession],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    pendingAction.current = null;
  }, []);

  const updateProfile = useCallback<AuthContextValue['updateProfile']>(async (patch) => {
    const updated = await api.patch<User>('/auth/me', patch);
    setUser(updated);
    return updated;
  }, []);

  const openAuth = useCallback((mode: AuthMode = 'login', reason?: string) => {
    setAuthModal({ isOpen: true, mode, reason });
  }, []);

  const closeAuth = useCallback(() => {
    pendingAction.current = null;
    setAuthModal((current) => ({ ...current, isOpen: false }));
  }, []);

  const requireAuth = useCallback(
    (action: () => void, reason?: string) => {
      if (user) {
        action();
        return;
      }
      pendingAction.current = action;
      setAuthModal({ isOpen: true, mode: 'login', reason: reason ?? 'Connectez-vous pour continuer.' });
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{ user, initializing, login, register, logout, updateProfile, authModal, openAuth, closeAuth, finishAuth, requireAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans <AuthProvider>.');
  return context;
}
