import React, { useState } from 'react';
import { Loader2, ScrollText } from 'lucide-react';
import { api } from '../../lib/api';
import { User } from '../../lib/models';
import { useAuth } from '../../context/AuthContext';
import { useAppActions } from '../../context/AppActionsContext';
import { useToast } from '../../context/ToastContext';

/**
 * Comptes créés avant l'acceptation explicite des conditions (ou par un ancien parcours) :
 * les conditions d'utilisation et la politique de confidentialité sont présentées à la connexion suivante.
 */
export const TermsGate: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { openLegal } = useAppActions();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);

  if (!user || user.termsAcceptedAt) return null;

  const accept = async () => {
    setBusy(true);
    try {
      await api.post<User>('/auth/me/accept-terms');
      await refreshUser();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Action impossible.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <ScrollText className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Conditions d'utilisation de QIAO</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Votre compte QIAO vous donne accès à QIAO Community. Pour continuer, merci de prendre connaissance et d'accepter nos{' '}
          <button onClick={() => openLegal('terms')} className="font-semibold text-red-600 hover:underline cursor-pointer">
            conditions d'utilisation
          </button>{' '}
          et notre{' '}
          <button onClick={() => openLegal('privacy')} className="font-semibold text-red-600 hover:underline cursor-pointer">
            politique de confidentialité
          </button>
          , y compris les règles de la communauté (respect, pas de spam, pas de divulgation d'informations privées).
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={logout} className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
            Se déconnecter
          </button>
          <button
            onClick={accept}
            disabled={busy}
            className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} J'accepte
          </button>
        </div>
      </div>
    </div>
  );
};
