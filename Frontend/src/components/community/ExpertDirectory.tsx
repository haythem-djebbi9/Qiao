import React, { useEffect, useState } from 'react';
import { JoinedList } from '../common/JoinedList';
import { BadgeCheck, Briefcase, Languages, Mail, MapPin, Search, ShieldCheck, UserCheck, UserPlus } from 'lucide-react';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { COUNTRIES, CommunitySummary, ExpertCard, LANGUAGE_LABELS, LANGUAGE_SHORT, Paged, navigateCommunity, useCommunityRoute } from '../../lib/community';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Avatar, EmptyState, Loading, MemberName, errorMessage, useCategories } from './ui';
import { ServiceRequestModal } from '../payments/ServiceRequestModal';

const PAGE_SIZE = 12;

/** Annuaire des professionnels : outil de découverte, sans recommandation ni garantie de QIAO. */
export const ExpertDirectory: React.FC = () => {
  const { user, requireAuth } = useAuth();
  const { notify } = useToast();
  const [route] = useCommunityRoute();
  const { professionalCategories } = useCategories();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(route.query.get('category') ?? '');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [company, setCompany] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [community, setCommunity] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ExpertCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requestTo, setRequestTo] = useState<{ handle: string; fullName: string } | null>(null);

  const { data: communities } = useApi<Paged<CommunitySummary>>('/community/communities', { limit: 50, viewer: user?.id });

  useEffect(() => {
    const timer = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => setPage(1), [query, category, country, language, company, verifiedOnly, community]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<Paged<ExpertCard>>('/community/experts', {
        q: query || undefined,
        category: category || undefined,
        country: country || undefined,
        language: language || undefined,
        company: company || undefined,
        verification: verifiedOnly ? 'verified' : undefined,
        community: community || undefined,
        page,
        limit: PAGE_SIZE,
      })
      .then((result) => {
        if (cancelled) return;
        setItems((current) => (page === 1 ? result.items : [...current, ...result.items]));
        setTotal(result.total);
      })
      .catch((err) => !cancelled && notify(errorMessage(err), 'error'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, category, country, language, company, verifiedOnly, community, page, user?.id, notify]);

  const follow = (expert: ExpertCard) =>
    requireAuth(async () => {
      try {
        const result = await api.post<{ following: boolean }>(`/community/members/${expert.handle}/follow`);
        setItems((current) => current.map((e) => (e.id === expert.id ? { ...e, isFollowing: result.following } : e)));
      } catch (err) {
        notify(errorMessage(err), 'error');
      }
    }, 'Connectez-vous pour suivre ce professionnel.');

  const selectClass = 'rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:outline-none focus:border-red-500';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Trouver un expert</h2>
          <div className="h-0.5 w-10 bg-red-600 rounded-full" />
        </div>
        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
          Avocats, transitaires, traducteurs, agronomes, consultants... Le badge <BadgeCheck className="w-3.5 h-3.5 inline text-blue-600" /> indique une
          vérification effectuée par QIAO. L'annuaire est un outil de découverte : il ne constitue ni une recommandation ni une offre de service.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs grid grid-cols-2 lg:grid-cols-12 gap-2">
        <div className="relative col-span-2 lg:col-span-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, spécialité, mot-clé..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${selectClass} lg:col-span-2`} aria-label="Catégorie professionnelle">
          <option value="">Toutes spécialités</option>
          {professionalCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className={`${selectClass} lg:col-span-2`} aria-label="Pays">
          <option value="">Tous les pays</option>
          {COUNTRIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className={`${selectClass} lg:col-span-2`} aria-label="Langue">
          <option value="">Toutes langues</option>
          {Object.entries(LANGUAGE_LABELS)
            .filter(([code]) => code !== 'other')
            .map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
        </select>
        <select value={community} onChange={(e) => setCommunity(e.target.value)} className={`${selectClass} lg:col-span-2`} aria-label="Communauté">
          <option value="">Toutes communautés</option>
          {(communities?.items ?? [])
            .filter((c) => c.canViewContent)
            .map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
        </select>
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Entreprise / cabinet" className={`${selectClass} lg:col-span-4`} />
        <label className="col-span-2 lg:col-span-8 flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer px-1">
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="accent-red-600" />
          Uniquement les profils vérifiés par QIAO
        </label>
      </div>

      {loading && items.length === 0 ? (
        <Loading label="Recherche des professionnels..." />
      ) : items.length === 0 ? (
        <EmptyState icon={<Briefcase className="w-10 h-10" />} text="Aucun professionnel ne correspond à ces critères." />
      ) : (
        <>
          <p className="text-xs text-slate-500">
            {total} professionnel{total > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((expert) => (
              <div key={expert.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col">
                <div className="flex items-start gap-3">
                  <Avatar src={expert.avatarUrl} name={expert.fullName} className="w-14 h-14 border border-slate-200" />
                  <div className="min-w-0">
                    <MemberName member={expert} className="text-sm font-bold text-slate-900" />
                    <p className="text-[11px] text-slate-600 leading-snug mt-0.5 line-clamp-2">{expert.headline}</p>
                    {expert.verificationStatus === 'verified' ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-blue-700">
                        <BadgeCheck className="w-3 h-3" /> Vérifié par QIAO
                      </span>
                    ) : (
                      <span className="mt-1 inline-block text-[10px] text-slate-400">Profil déclaratif</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {expert.categories.map((c) => (
                    <span key={c.id} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      {c.name}
                    </span>
                  ))}
                </div>
                <div className="mt-3 space-y-1 text-[11px] text-slate-500 flex-1">
                  {(expert.country || expert.countriesServed.length > 0) && (
                    <p className="flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>
                        {expert.country}
                        {expert.countriesServed.filter((c) => c !== expert.country).length > 0 && (
                          <>
                            {expert.country ? ' · ' : ''}
                            <span>intervient :</span> <JoinedList items={expert.countriesServed} />
                          </>
                        )}
                      </span>
                    </p>
                  )}
                  {expert.languages.length > 0 && (
                    <p className="flex items-center gap-1">
                      <Languages className="w-3 h-3 shrink-0" /> {expert.languages.map((l) => LANGUAGE_SHORT[l] ?? l).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => navigateCommunity(`member/${expert.handle}`)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Voir le profil
                  </button>
                  {user?.id !== expert.id && (
                    <>
                      <button
                        onClick={() => follow(expert)}
                        aria-label={expert.isFollowing ? 'Ne plus suivre' : 'Suivre'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          expert.isFollowing ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {expert.isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => requireAuth(() => setRequestTo({ handle: expert.handle, fullName: expert.fullName }), 'Connectez-vous pour demander une prestation.')}
                        aria-label="Demander une prestation sécurisée"
                        title="Demander une prestation (paiement sécurisé QIAO)"
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => requireAuth(() => navigateCommunity(`messages/new?to=${expert.handle}&context=profile`), 'Connectez-vous pour contacter ce professionnel.')}
                        aria-label="Envoyer un message"
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {items.length < total && (
            <div className="text-center">
              <button onClick={() => setPage(page + 1)} disabled={loading} className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                Voir plus de professionnels ({total - items.length}) ⌵
              </button>
            </div>
          )}
        </>
      )}
      {requestTo && <ServiceRequestModal provider={requestTo} onClose={() => setRequestTo(null)} />}
    </div>
  );
};
