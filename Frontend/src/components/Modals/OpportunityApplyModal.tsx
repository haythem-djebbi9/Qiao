import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Send, Loader2, MapPin, DollarSign } from 'lucide-react';
import { api } from '../../lib/api';
import { Opportunity } from '../../lib/models';
import { useAuth } from '../../context/AuthContext';
import { FlagIcon } from '../common/FlagIcon';

interface OpportunityApplyModalProps {
  opportunity: Opportunity | null;
  onClose: () => void;
  onApplied?: (opportunity: Opportunity) => void;
}

/** Manifestation d'intérêt / candidature à une opportunité (enregistrée en base). */
export const OpportunityApplyModal: React.FC<OpportunityApplyModalProps> = ({ opportunity, onClose, onApplied }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', company: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!opportunity) return;
    setDone(false);
    setError(null);
    setForm({
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      company: user?.company ?? '',
      phone: '',
      message: '',
    });
  }, [opportunity, user]);

  if (!opportunity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/opportunities/${opportunity.id}/apply`, form);
      setDone(true);
      onApplied?.(opportunity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        <span className="bg-[#0c4a9e] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
          {opportunity.type}
        </span>
        <h3 className="text-lg font-black text-slate-900 mt-2 mb-1 leading-snug pr-8">{opportunity.title}</h3>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-4">
          <span className="flex items-center gap-1.5">
            <FlagIcon country={opportunity.fromCountry} size="sm" />
            {opportunity.fromCountry} → <FlagIcon country={opportunity.toCountry} size="sm" />
            {opportunity.toCountry}
          </span>
          <span className="flex items-center gap-1 font-bold text-slate-800">
            <DollarSign className="w-3.5 h-3.5 text-red-600" />
            {opportunity.amountLabel}
          </span>
          {opportunity.deadline && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Date limite : {opportunity.deadline}
            </span>
          )}
        </div>

        {done ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-extrabold text-slate-900">Candidature transmise !</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Un expert QIAO vérifie votre dossier et vous met en relation avec le porteur du projet sous 48h.
              {user && ' Vous pouvez suivre son statut dans votre espace membre.'}
            </p>
            <button onClick={onClose} className="mt-2 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer">
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet *</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail professionnel *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Entreprise</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone / WhatsApp</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Présentez votre offre ou votre intérêt</label>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Capacités, références, volumes, certifications..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            {error && <div className="text-xs text-red-600 font-semibold bg-red-50 border border-red-100 p-2.5 rounded-xl">{error}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#e50028] hover:bg-[#c90022] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Envoyer ma candidature</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
