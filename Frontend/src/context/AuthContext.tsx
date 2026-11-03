import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, getToken, setToken } from '../lib/api';
import { User } from '../lib/models';

/**
 * login / register : formulaires classiques ; forgot : demande de lien ; reset : nouveau mot de passe ;
 * oauth : finalisation d'une connexion WeChat/Facebook dont l'identité n'est liée à aucun compte.
 */
export type AuthMode = 'login' | 'register' | 'forgot' | 'reset' | 'oauth';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  company?: string;
  accountType: User['accountType'];
  origin: User['origin'];
  acceptTerms: boolean;
}

export interface Session {
  token: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  /** Vrai tant que la session enregistrée n'a pas été vérifiée auprès de l'API. */
  initializing: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  /** Ouvre une session renvoyée par l'API (connexion WeChat/Facebook, liaison de compte). */
  acceptSession: (session: Session) => User;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  updateProfile: (patch: Partial<Pick<User, 'fullName' | 'company' | 'title' | 'location' | 'language' | 'avatarUrl'>>) => Promise<User>;
  authModal: { isOpen: boolean; mode: AuthMode; reason?: string; ticket?: string };
  openAuth: (mode?: AuthMode, reason?: string, ticket?: string) => void;
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

  // Session enregistrée : renouvelée au chargement (expiration glissante), abandonnée si révoquée.
  useEffect(() => {
    if (!getToken()) {
      setInitializing(false);
      return;
    }
    api
      .post<Session>('/auth/refresh')
      .then((session) => {
        setToken(session.token);
        setUser(session.user);
      })
      .catch(() => setToken(null))
      .finally(() => setInitializing(false));
  }, []);

  const acceptSession = useCallback((session: Session) => {
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
    async (email: string, password: string) => acceptSession(await api.post<Session>('/auth/login', { email, password })),
    [acceptSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => acceptSession(await api.post<Session>('/auth/register', payload)),
    [acceptSession],
  );

  const logout = useCallback(() => {
    // Révoque la session côté serveur (le jeton ne sera plus accepté), puis l'oublie localement.
    if (getToken()) api.post('/auth/logout').catch(() => undefined);
    setToken(null);
    setUser(null);
    pendingAction.current = null;
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getToken()) return null;
    try {
      const me = await api.get<User>('/auth/me');
      setUser(me);
      return me;
    } catch {
      return null;
    }
  }, []);

  const updateProfile = useCallback<AuthContextValue['updateProfile']>(async (patch) => {
    const updated = await api.patch<User>('/auth/me', patch);
    setUser(updated);
    return updated;
  }, []);

  const openAuth = useCallback((mode: AuthMode = 'login', reason?: string, ticket?: string) => {
    setAuthModal({ isOpen: true, mode, reason, ticket });
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
      value={{
        user,
        initializing,
        login,
        register,
        acceptSession,
        logout,
        refreshUser,
        updateProfile,
        authModal,
        openAuth,
        closeAuth,
        finishAuth,
        requireAuth,
      }}
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
