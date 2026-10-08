import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2, Briefcase, Target, FileText, Calendar, GraduationCap, Building2, BookOpen, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

export interface SearchHit {
  type: 'service' | 'opportunity' | 'document' | 'event' | 'course' | 'company' | 'article';
  id: string;
  title: string;
  subtitle: string;
}

const TYPE_META: Record<SearchHit['type'], { label: string; icon: React.ElementType; color: string }> = {
  service: { label: 'Services', icon: Briefcase, color: 'text-blue-600 bg-blue-50' },
  opportunity: { label: 'Opportunités', icon: Target, color: 'text-red-600 bg-red-50' },
  company: { label: 'Entreprises', icon: Building2, color: 'text-indigo-600 bg-indigo-50' },
  document: { label: 'Rapports & ressources', icon: FileText, color: 'text-amber-600 bg-amber-50' },
  event: { label: 'Événements', icon: Calendar, color: 'text-emerald-600 bg-emerald-50' },
  course: { label: 'Formations', icon: GraduationCap, color: 'text-purple-600 bg-purple-50' },
  article: { label: 'Analyses', icon: BookOpen, color: 'text-sky-600 bg-sky-50' },
};

const SUGGESTIONS = ['Huile d’olive', 'Panneaux solaires', 'Douane Algérie', 'Canton Fair', 'Négociation', 'E-commerce'];

interface SearchModalProps {
  isOpen: boolean;
  initialQuery?: string;
  onClose: () => void;
  onSelect: (hit: SearchHit) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, initialQuery = '', onClose, onSelect }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get<{ results: SearchHit[] }>('/search', { q })
        .then((data) => {
          setResults(data.results);
          setError(null);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const groups = (Object.keys(TYPE_META) as SearchHit['type'][])
    .map((type) => ({ type, hits: results.filter((r) => r.type === type) }))
    .filter((group) => group.hits.length > 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[10vh] bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un service, une opportunité, une entreprise, un rapport..."
            className="flex-1 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-red-600" />}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer" aria-label="Fermer la recherche">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {query.trim().length < 2 ? (
            <div className="p-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recherches suggérées</div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-red-600">{error}</div>
          ) : !loading && groups.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Aucun résultat pour « {query} ». Essayez un autre mot-clé (pays, secteur, produit...).
            </div>
          ) : (
            groups.map(({ type, hits }) => {
              const meta = TYPE_META[type];
              const Icon = meta.icon;
              return (
                <div key={type} className="mb-3">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{meta.label}</div>
                  {hits.map((hit) => (
                    <button
                      key={`${hit.type}-${hit.id}`}
                      onClick={() => {
                        onClose();
                        onSelect(hit);
                      }}
                      className="w-full text-left flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 group cursor-pointer"
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900 truncate group-hover:text-red-600">{hit.title}</span>
                        <span className="block text-xs text-slate-500 truncate">{hit.subtitle}</span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-red-600 shrink-0" />
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
