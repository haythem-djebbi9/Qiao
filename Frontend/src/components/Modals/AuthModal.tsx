import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, User, Building2, CheckCircle2, ShieldCheck, ArrowRight, Loader2, AlertCircle, KeyRound, Link2 } from 'lucide-react';
import { Logo } from '../Logo';
import { Session, useAuth } from '../../context/AuthContext';
import { useAppActions } from '../../context/AppActionsContext';
import { api, apiUrl } from '../../lib/api';

interface AuthModalProps {
  /** Région pré-sélectionnée à l'inscription (position détectée du visiteur). */
  defaultOrigin?: 'china' | 'north-africa' | null;
}

interface Provider {
  id: 'wechat' | 'facebook';
  name: string;
  enabled: boolean;
  mode: 'live' | 'simulation' | 'disabled';
}

interface PendingIdentity {
  provider: 'wechat' | 'facebook';
  providerName: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

/** Démarre la connexion WeChat / Facebook en revenant ensuite sur la page actuelle. */
export function startOAuth(provider: string, linkTicket?: string) {
  const returnTo = `${window.location.pathname}${window.location.search}`;
  const params = new URLSearchParams({ returnTo });
  if (linkTicket) params.set('link', linkTicket);
  window.location.href = `${apiUrl(`/auth/oauth/${provider}/start`)}?${params.toString()}`;
}

const WeChatIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M8.7 4C4.9 4 2 6.6 2 9.8c0 1.8 1 3.4 2.6 4.5l-.6 2 2.3-1.2c.8.2 1.6.4 2.4.4h.6a5.3 5.3 0 0 1-.2-1.5c0-3.2 3-5.8 6.7-5.8h.5C15.6 5.8 12.4 4 8.7 4Zm-2.3 3.2a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Zm4.7 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8ZM15.3 9.2c-3.2 0-5.7 2.2-5.7 4.9s2.5 4.9 5.7 4.9c.6 0 1.3-.1 1.9-.3l1.9 1-.5-1.7c1.4-.9 2.4-2.3 2.4-3.9 0-2.7-2.5-4.9-5.7-4.9Zm-1.9 2.6a.8.8 0 1 1 0 1.5.8.8 0 0 1 0-1.5Zm3.8 0a.8.8 0 1 1 0 1.5.8.8 0 0 1 0-1.5Z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H7.5v3.6h2.8V22H14v-9.9h2.8l.4-3.6H14Z" />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({ defaultOrigin }) => {
  const { authModal, login, register, acceptSession, closeAuth, finishAuth, openAuth } = useAuth();
  const { openLegal } = useAppActions();
  const { isOpen, mode: initialMode, reason, ticket } = authModal;
  const [mode, setMode] = useState(initialMode);
  const [accountType, setAccountType] = useState<'enterprise' | 'expert' | 'individual'>('enterprise');
  const [origin, setOrigin] = useState<'china' | 'north-africa'>(defaultOrigin ?? 'north-africa');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [welcomeName, setWelcomeName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [pending, setPending] = useState<PendingIdentity | null>(null);
  const [oauthChoice, setOauthChoice] = useState<'create' | 'link'>('create');

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', company: '' });

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setSuccess(false);
    setError(null);
    setNotice(null);
    setAcceptTerms(false);
    setForm((current) => ({ ...current, password: '', confirm: '' }));
    if (defaultOrigin) setOrigin(defaultOrigin);
    api.get<Provider[]>('/auth/providers').then(setProviders).catch(() => setProviders([]));
    if (initialMode === 'oauth' && ticket) {
      setPending(null);
      setOauthChoice('create');
      api
        .get<PendingIdentity>(`/auth/oauth/pending/${ticket}`)
        .then((identity) => {
          setPending(identity);
          setForm((current) => ({ ...current, name: identity.name, email: identity.email ?? '' }));
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Connexion expirée.'));
    }
  }, [isOpen, initialMode, defaultOrigin, ticket]);

  if (!isOpen) return null;

  const onClose = closeAuth;

  const welcome = (name: string) => {
    setWelcomeName(name.split(' ')[0]);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      finishAuth();
    }, 1400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'forgot') {
        await api.post('/auth/password/forgot', { email: form.email });
        setNotice("Si un compte existe pour cette adresse, un lien de réinitialisation valable 1 heure vient d'être envoyé.");
        return;
      }
      if (mode === 'reset') {
        if (form.password !== form.confirm) throw new Error('Les deux mots de passe ne correspondent pas.');
        await api.post('/auth/password/reset', { token: ticket, password: form.password });
        setMode('login');
        setForm((current) => ({ ...current, password: '', confirm: '' }));
        setNotice('Mot de passe modifié. Connectez-vous avec votre nouveau mot de passe.');
        return;
      }
      if (mode === 'oauth') {
        const session =
          oauthChoice === 'create'
            ? await api.post<Session>('/auth/oauth/complete', {
                ticket,
                fullName: form.name,
                email: form.email,
                company: form.company || undefined,
                accountType,
                origin,
                acceptTerms,
              })
            : await api.post<Session>('/auth/oauth/link-existing', { ticket, email: form.email, password: form.password });
        welcome(acceptSession(session).fullName);
        return;
      }
      const user =
        mode === 'login'
          ? await login(form.email, form.password)
          : await register({
              fullName: form.name,
              email: form.email,
              password: form.password,
              company: form.company || undefined,
              accountType,
              origin,
              acceptTerms,
            });
      welcome(user.fullName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const isAccountForm = mode === 'login' || mode === 'register';
  const showRegisterFields = mode === 'register' || (mode === 'oauth' && oauthChoice === 'create');
  const showPassword = mode === 'login' || mode === 'register' || mode === 'reset' || (mode === 'oauth' && oauthChoice === 'link');
  const submitLabel = {
    login: 'Se connecter',
    register: 'Créer mon compte',
    forgot: 'Recevoir le lien',
    reset: 'Enregistrer le mot de passe',
    oauth: oauthChoice === 'create' ? 'Créer mon compte QIAO' : `Lier ${pending?.providerName ?? ''} à mon compte`,
  }[mode];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <Logo size="sm" />
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        {isAccountForm ? (
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setMode(tab);
                  setError(null);
                  setNotice(null);
                }}
                className={`flex-1 py-3 text-xs font-bold text-center transition-colors cursor-pointer ${
                  mode === tab ? 'text-red-600 border-b-2 border-red-600 bg-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'login' ? 'Se connecter' : "Créer un compte (S'inscrire)"}
              </button>
            ))}
          </div>
        ) : (
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 text-xs font-bold text-slate-700">
            {mode === 'oauth' ? <Link2 className="w-4 h-4 text-red-600" /> : <KeyRound className="w-4 h-4 text-red-600" />}
            {mode === 'forgot' && 'Mot de passe oublié'}
            {mode === 'reset' && 'Choisir un nouveau mot de passe'}
            {mode === 'oauth' && `Finaliser la connexion ${pending?.providerName ?? ''}`}
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">
                {mode === 'register' || (mode === 'oauth' && oauthChoice === 'create') ? `Bienvenue sur QIAO, ${welcomeName} !` : `Connexion réussie, ${welcomeName} !`}
              </h4>
              <p className="text-xs text-slate-500">Redirection vers votre espace...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {reason && isAccountForm && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900 font-medium">{reason}</div>
              )}
              {notice && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{notice}</span>
                </div>
              )}

              {/* Connexion WeChat / Facebook */}
              {isAccountForm && providers.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {providers.map((provider) => (
                      <button
                        key={provider.id}
                        type="button"
                        disabled={!provider.enabled}
                        onClick={() => startOAuth(provider.id)}
                        title={provider.enabled ? `Continuer avec ${provider.name}` : `${provider.name} n'est pas encore configuré`}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-white ${
                          provider.id === 'wechat' ? 'bg-[#07c160] hover:bg-[#06ad56]' : 'bg-[#1877f2] hover:bg-[#166fe0]'
                        }`}
                      >
                        {provider.id === 'wechat' ? <WeChatIcon /> : <FacebookIcon />}
                        <span>{provider.name}</span>
                      </button>
                    ))}
                  </div>
                  {providers.some((p) => p.mode === 'simulation') && (
                    <p className="text-[10px] text-slate-400 text-center">Mode développement : fournisseurs simulés localement.</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex-1 h-px bg-slate-200" />
                    ou avec votre e-mail
                    <span className="flex-1 h-px bg-slate-200" />
                  </div>
                </div>
              )}

              {/* Identité externe à finaliser */}
              {mode === 'oauth' && (
                <>
                  {pending ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${pending.provider === 'wechat' ? 'bg-[#07c160]' : 'bg-[#1877f2]'}`}>
                        {pending.provider === 'wechat' ? <WeChatIcon /> : <FacebookIcon />}
                      </span>
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">{pending.name}</div>
                        <div className="text-slate-500">Identité {pending.providerName} vérifiée — aucun compte QIAO n'y est encore lié.</div>
                      </div>
                    </div>
                  ) : (
                    !error && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                      </div>
                    )
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {(['create', 'link'] as const).map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => {
                          setOauthChoice(choice);
                          setError(null);
                        }}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold border text-center cursor-pointer ${
                          oauthChoice === choice ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {choice === 'create' ? 'Créer un compte QIAO' : "J'ai déjà un compte QIAO"}
                      </button>
                    ))}
                  </div>
                  {oauthChoice === 'link' && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Par sécurité, confirmez le mot de passe de votre compte QIAO : {pending?.providerName} y sera lié et vous retrouverez vos
                      communautés, discussions et votre profil. Aucun compte n'est fusionné automatiquement.
                    </p>
                  )}
                </>
              )}

              {showRegisterFields && (
                <>
                  {/* Origin selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Votre région d'origine</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrigin('china')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          origin === 'china' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span>🇨🇳 Chine</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrigin('north-africa')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          origin === 'north-africa' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span>🇹🇳 🇩🇿 🇲🇦 Afrique du Nord</span>
                      </button>
                    </div>
                  </div>

                  {/* Profile type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Type de profil</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        ['enterprise', 'Entreprise'],
                        ['expert', 'Professionnel'],
                        ['individual', 'Particulier'],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setAccountType(value)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border text-center cursor-pointer ${
                            accountType === value ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Aucune inscription à une formation n'est nécessaire pour rejoindre QIAO Community.</p>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nom & Prénom</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Ex: Mohamed Ben Salem / Zhang Wei"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Entreprise / Organisation</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder="Nom de l'entité (optionnel)"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              {mode !== 'reset' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse e-mail{mode === 'oauth' && oauthChoice === 'link' ? ' de votre compte QIAO' : ''}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="nom@entreprise.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              {showPassword && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">{mode === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'}</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError(null);
                          setNotice(null);
                        }}
                        className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                      >
                        Mot de passe oublié ?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={mode === 'register' || mode === 'reset' ? 8 : undefined}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      autoComplete={mode === 'register' || mode === 'reset' ? 'new-password' : 'current-password'}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  {(mode === 'register' || mode === 'reset') && <p className="text-[11px] text-slate-400 mt-1">8 caractères minimum.</p>}
                </div>
              )}

              {mode === 'reset' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={form.confirm}
                      onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                      autoComplete="new-password"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}

              {/* Conditions & confidentialité */}
              {showRegisterFields && (
                <label className="flex items-start gap-2 text-[11px] text-slate-600 leading-relaxed cursor-pointer">
                  <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 accent-red-600" required />
                  <span>
                    J'accepte les{' '}
                    <button type="button" onClick={() => openLegal('terms')} className="font-semibold text-red-600 hover:underline cursor-pointer">
                      conditions d'utilisation
                    </button>{' '}
                    et la{' '}
                    <button type="button" onClick={() => openLegal('privacy')} className="font-semibold text-red-600 hover:underline cursor-pointer">
                      politique de confidentialité
                    </button>{' '}
                    de QIAO, y compris les règles de QIAO Community.
                  </span>
                </label>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting || (mode === 'oauth' && !pending)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-70"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{submitLabel}</span>
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </button>

              {isAccountForm ? (
                <p className="text-center text-xs text-slate-500">
                  {mode === 'login' ? 'Pas encore membre ?' : 'Déjà membre ?'}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'login' ? 'register' : 'login');
                      setError(null);
                      setNotice(null);
                    }}
                    className="font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
                  </button>
                </p>
              ) : (
                <p className="text-center text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => openAuth('login')}
                    className="font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    ← Retour à la connexion
                  </button>
                </p>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Un seul compte QIAO pour toutes vos méthodes de connexion</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
