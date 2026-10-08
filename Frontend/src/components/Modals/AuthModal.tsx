import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, User, Building2, CheckCircle2, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Logo } from '../Logo';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  /** Région pré-sélectionnée à l'inscription (choix « Je viens de... » de l'accueil). */
  defaultOrigin?: 'china' | 'north-africa' | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ defaultOrigin }) => {
  const { authModal, login, register, closeAuth, finishAuth } = useAuth();
  const { isOpen, mode: initialMode, reason } = authModal;
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [accountType, setAccountType] = useState<'enterprise' | 'expert' | 'individual'>('enterprise');
  const [origin, setOrigin] = useState<'china' | 'north-africa'>(defaultOrigin ?? 'north-africa');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcomeName, setWelcomeName] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
  });

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSuccess(false);
      setError(null);
      setForm((current) => ({ ...current, password: '' }));
      if (defaultOrigin) setOrigin(defaultOrigin);
    }
  }, [isOpen, initialMode, defaultOrigin]);

  if (!isOpen) return null;

  const onClose = closeAuth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
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
            });
      setWelcomeName(user.fullName.split(' ')[0]);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        finishAuth();
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 text-xs font-bold text-center transition-colors cursor-pointer ${
              mode === 'login'
                ? 'text-red-600 border-b-2 border-red-600 bg-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Se connecter
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-3 text-xs font-bold text-center transition-colors cursor-pointer ${
              mode === 'register'
                ? 'text-red-600 border-b-2 border-red-600 bg-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Créer un compte (S'inscrire)
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">
                {mode === 'login' ? `Connexion réussie, ${welcomeName} !` : `Bienvenue sur QIAO, ${welcomeName} !`}
              </h4>
              <p className="text-xs text-slate-500">Redirection vers votre espace d'affaires...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {reason && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900 font-medium">
                  {reason}
                </div>
              )}
              {mode === 'register' && (
                <>
                  {/* Origin selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Votre région d'origine
                    </label>
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Type de profil
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountType('enterprise')}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border text-center cursor-pointer ${
                          accountType === 'enterprise' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        Entreprise
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType('expert')}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border text-center cursor-pointer ${
                          accountType === 'expert' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        Expert vérifié
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType('individual')}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border text-center cursor-pointer ${
                          accountType === 'individual' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        Apprenant
                      </button>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nom & Prénom
                    </label>
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Entreprise / Organisation
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder="Nom de l'entité"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="nom@entreprise.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={mode === 'register' ? 8 : undefined}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                {mode === 'register' && (
                  <p className="text-[11px] text-slate-400 mt-1">8 caractères minimum.</p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-70"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</span>
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </button>

              <p className="text-center text-xs text-slate-500">
                {mode === 'login' ? 'Pas encore membre ?' : 'Déjà membre ?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError(null);
                  }}
                  className="font-semibold text-red-600 hover:underline cursor-pointer"
                >
                  {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
                </button>
              </p>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protection des données certifiée KYC & RGPD</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
