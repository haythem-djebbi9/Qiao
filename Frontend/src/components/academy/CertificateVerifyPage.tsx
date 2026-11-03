import React, { useEffect, useState } from 'react';
import { ArrowRight, Award, BadgeCheck, Loader2, Lock, Search, ShieldX } from 'lucide-react';
import { ApiError, api } from '../../lib/api';
import { CertificateVerification } from '../../lib/academy';
import { formatDate } from '../../lib/text';
import { ContactFooterSection } from '../ContactFooterSection';

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; result: CertificateVerification }
  | { kind: 'error'; message: string; notFound: boolean };

const numberFromUrl = () => {
  try {
    return new URLSearchParams(window.location.search).get('numero') ?? '';
  } catch {
    return '';
  }
};

const Detail: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
    <div className="text-sm font-semibold text-slate-900 mt-0.5 break-words">{value}</div>
  </div>
);

/** Page publique : vérification d'un certificat QIAO Academy par son numéro (lien imprimé sur le PDF). */
export const CertificateVerifyPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [number, setNumber] = useState(numberFromUrl);
  const [state, setState] = useState<State>({ kind: 'idle' });

  const verify = async (value: string) => {
    const input = value.trim();
    if (!input) return;
    setState({ kind: 'loading' });
    // Numéro gardé dans l'adresse : la page peut être partagée ou rechargée.
    const url = new URL(window.location.href);
    url.searchParams.set('numero', input.toUpperCase());
    window.history.replaceState(null, '', url.toString());
    try {
      const result = await api.get<CertificateVerification>(`/academy/certificates/verify/${encodeURIComponent(input)}`);
      setState({ kind: 'found', result });
      setNumber(result.number);
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Vérification impossible.',
        notFound: err instanceof ApiError && err.status === 404,
      });
    }
  };

  useEffect(() => {
    if (number) verify(number);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result = state.kind === 'found' ? state.result : null;
  const valid = result?.status === 'valid';

  return (
    <div className="w-full bg-white text-slate-900 font-sans">
      <section className="relative bg-[#07152b] text-white py-12 sm:py-16 overflow-hidden">
        <div className="w-12 h-1 bg-red-600 absolute top-0 left-1/2 -translate-x-1/2 rounded-b" />
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[11px] font-bold uppercase tracking-widest text-red-300">
            <Award className="w-3.5 h-3.5" /> QIAO Academy
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold leading-tight">Vérifier un certificat de réussite</h1>
          <p className="mt-2 text-sm text-slate-300 max-w-xl mx-auto">
            Saisissez le numéro imprimé en bas du certificat (format QA-AAAA-XXXX-XXXX) pour confirmer qu'il a bien été délivré par QIAO Academy.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verify(number);
            }}
            className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto"
          >
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="QA-2026-XXXX-XXXX"
              aria-label="Numéro du certificat"
              maxLength={40}
              className="flex-1 rounded-xl border border-white/20 bg-white text-slate-900 px-4 py-3 text-sm font-mono uppercase placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
            <button
              type="submit"
              disabled={state.kind === 'loading' || !number.trim()}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {state.kind === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Vérifier
            </button>
          </form>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {result && (
          <div className={`rounded-2xl border p-5 sm:p-6 ${valid ? 'bg-emerald-50/60 border-emerald-200' : 'bg-red-50/60 border-red-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${valid ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
                {valid ? <BadgeCheck className="w-6 h-6" /> : <ShieldX className="w-6 h-6" />}
              </div>
              <div>
                <h2 className={`text-lg font-bold ${valid ? 'text-emerald-800' : 'text-red-800'}`}>{valid ? 'Certificat authentique' : 'Certificat révoqué'}</h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  {valid
                    ? 'Ce certificat a bien été délivré par QIAO Academy et il est valide.'
                    : `Ce certificat a été délivré par QIAO Academy puis révoqué${result.revokedAt ? ` le ${formatDate(result.revokedAt)}` : ''}. Il n'est plus valide.`}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-xl border border-slate-200 p-4">
              <Detail label="Titulaire" value={result.holderName} />
              <Detail label="Formation" value={result.courseTitle} />
              <Detail label="Délivré le" value={formatDate(result.issuedAt)} />
              <Detail label="Numéro" value={<span className="font-mono">{result.number}</span>} />
            </div>
          </div>
        )}

        {state.kind === 'error' && (
          <div className={`rounded-2xl border p-5 text-sm ${state.notFound ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <div className="font-bold">{state.notFound ? 'Certificat introuvable' : 'Vérification impossible'}</div>
            <p className="mt-1">
              {state.notFound ? "Aucun certificat QIAO Academy ne correspond à ce numéro. Vérifiez la saisie : il figure en bas du certificat." : state.message}
            </p>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            Confidentialité : seuls le nom du titulaire, l'intitulé de la formation et les dates du certificat sont affichés. Les résultats et les
            coordonnées du membre ne sont jamais publiés.
          </p>
        </div>

        <div className="text-center">
          <button onClick={() => onNavigate('academy')} className="text-sm font-bold text-red-600 hover:text-red-700 cursor-pointer inline-flex items-center gap-1.5">
            Découvrir les formations QIAO Academy <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <ContactFooterSection showOnlyFooter={true} onScrollToSection={onNavigate} />
    </div>
  );
};
