import React, { useEffect, useState } from 'react';
import { Compass, Languages, MapPin, MessageSquare, Search, Users } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { CommunitySummary, LANGUAGE_LABELS, LANGUAGE_SHORT, POLICY_LABELS, Paged, navigateCommunity } from '../../lib/community';
import { useAuth } from '../../context/AuthContext';
import { CommunityIcon, EmptyState, Loading, MembershipButton, Pills, VisibilityBadge, useCategories } from './ui';

/** Carte de communauté (répertoire, recherche, recommandations). */
export const CommunityCard: React.FC<{ community: CommunitySummary; onChange: (community: CommunitySummary) => void }> = ({ community, onChange }) => (
  <div
    onClick={() => navigateCommunity(`c/${community.slug}`)}
    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col cursor-pointer group"
  >
    <div className="h-28 relative bg-gradient-to-r from-[#071329] to-[#0c2a5c] overflow-hidden">
      {community.coverImage && (
        <img
          src={community.coverImage}
          alt=""
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute top-3 left-3">
        <VisibilityBadge visibility={community.visibility} />
      </div>
      <div className="absolute -bottom-5 left-4 w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-800">
        <CommunityIcon name={community.icon} className="w-5 h-5" />
      </div>
    </div>
    <div className="p-4 pt-7 flex-1 flex flex-col">
      <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-red-600 transition-colors">{community.name}</h3>
      {community.category && <p className="text-[11px] text-red-600 font-semibold mt-0.5">{community.category.name}</p>}
      <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3 flex-1">{community.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Users className="w-3 h-3" /> {community.membersCount} membre{community.membersCount > 1 ? 's' : ''}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="w-3 h-3" /> {community.postsCount} discussion{community.postsCount > 1 ? 's' : ''}
        </span>
        <span className="inline-flex items-center gap-1">
          <Languages className="w-3 h-3" /> {community.languages.map((l) => LANGUAGE_SHORT[l] ?? l).join(' · ')}
        </span>
      </div>
      {community.scope && (
        <p className="mt-1 text-[11px] text-slate-400 inline-flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {community.scope}
        </p>
      )}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
        <span className="text-[10px] text-slate-400">{POLICY_LABELS[community.membershipPolicy]}</span>
        <MembershipButton community={community} onChange={onChange} />
      </div>
    </div>
  </div>
);

/** Répertoire des communautés : recherche, catégorie, langue ; les communautés privées n'apparaissent qu'à leurs membres et invités. */
export const CommunityDirectory: React.FC = () => {
  const { user } = useAuth();
  const { communityCategories } = useCategories();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('');
  const [scope, setScope] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const { data, setData, loading } = useApi<Paged<CommunitySummary>>('/community/communities', {
    q: query || undefined,
    category: category || undefined,
    language: language || undefined,
    scope,
    limit: 48,
    viewer: user?.id,
  });
  const items = data?.items ?? [];

  const update = (updated: CommunitySummary) =>
    setData((current) => (current ? { ...current, items: current.items.map((c) => (c.id === updated.id ? updated : c)) } : current));

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Répertoire des communautés</h2>
            <div className="h-0.5 w-10 bg-red-600 rounded-full" />
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Rejoignez les communautés de votre secteur, de votre métier ou de votre pays. L'accès ne dépend d'aucune inscription à QIAO Academy.
          </p>
        </div>
        <Pills
          options={[
            { id: 'all', label: 'Toutes' },
            { id: 'joined', label: 'Mes communautés' },
            { id: 'featured', label: 'À la une' },
          ]}
          value={scope}
          onChange={setScope}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-2">
        <div className="relative sm:col-span-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une communauté (agriculture, juridique, logistique...)"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="sm:col-span-3 rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:outline-none focus:border-red-500"
          aria-label="Catégorie"
        >
          <option value="">Toutes les catégories</option>
          {communityCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="sm:col-span-3 rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:outline-none focus:border-red-500"
          aria-label="Langue"
        >
          <option value="">Toutes les langues</option>
          {Object.entries(LANGUAGE_LABELS)
            .filter(([code]) => code !== 'other')
            .map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
        </select>
      </div>

      {loading && items.length === 0 ? (
        <Loading label="Chargement des communautés..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-10 h-10" />}
          text={scope === 'joined' ? "Vous n'avez rejoint aucune communauté." : 'Aucune communauté ne correspond à votre recherche.'}
          action={scope !== 'all' ? { label: 'Voir toutes les communautés', onClick: () => setScope('all') } : undefined}
        />
      ) : (
        <>
          <p className="text-xs text-slate-500">
            {data?.total} communauté{(data?.total ?? 0) > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((community) => (
              <CommunityCard key={community.id} community={community} onChange={update} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
