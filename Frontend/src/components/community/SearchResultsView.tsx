import React, { useEffect, useState } from 'react';
import { BadgeCheck, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { COUNTRIES, CommunitySummary, ExpertCard, LANGUAGE_LABELS, MemberSummary, Paged, PostView, navigateCommunity } from '../../lib/community';
import { useAuth } from '../../context/AuthContext';
import { CommunityCard } from './CommunityDirectory';
import { PostCard } from './PostCard';
import { Avatar, Card, EmptyState, Loading, MemberName, Pills, errorMessage, useCategories } from './ui';

interface SearchResult {
  type: string;
  communities: Paged<CommunitySummary>;
  posts: Paged<PostView>;
  questions: Paged<PostView>;
  members: Paged<MemberSummary & { isFollowing?: boolean }>;
  experts: Paged<ExpertCard>;
}

const TYPES = [
  { id: 'all', label: 'Tout' },
  { id: 'communities', label: 'Communautés' },
  { id: 'questions', label: 'Questions' },
  { id: 'posts', label: 'Publications' },
  { id: 'members', label: 'Membres' },
  { id: 'experts', label: 'Experts' },
];

/** Recherche globale Community : chaque type de résultat respecte ses propres règles de visibilité côté serveur. */
export const SearchResultsView: React.FC<{ query: URLSearchParams }> = ({ query }) => {
  const { user } = useAuth();
  const { professionalCategories } = useCategories();
  const q = query.get('q') ?? '';
  const [type, setType] = useState(query.get('type') ?? 'all');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [from, setFrom] = useState('');
  const [questionStatus, setQuestionStatus] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState(q);

  useEffect(() => setDraft(q), [q]);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    api
      .get<SearchResult>('/community/search', {
        q: q || undefined,
        type,
        category: category || undefined,
        country: country || undefined,
        language: language || undefined,
        from: from || undefined,
        questionStatus: questionStatus || undefined,
        limit: 12,
      })
      .then((data) => !cancelled && setResult(data))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [q, type, category, country, language, from, questionStatus, user?.id]);

  const select = 'rounded-xl border border-slate-200 p-2 text-xs bg-white focus:outline-none focus:border-red-500';
  const updateList = <K extends 'posts' | 'questions'>(key: K, post: PostView) =>
    setResult((current) => (current ? { ...current, [key]: { ...current[key], items: current[key].items.map((p) => (p.id === post.id ? post : p)) } } : current));

  const section = (key: string, title: string, total: number, content: React.ReactNode) =>
    (type === 'all' || type === key) && (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            {title} <span className="text-slate-400 font-semibold">({total})</span>
          </h3>
          {type === 'all' && total > 4 && (
            <button onClick={() => setType(key)} className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer">
              Voir tout
            </button>
          )}
        </div>
        {total === 0 ? <p className="text-xs text-slate-400">Aucun résultat.</p> : content}
      </div>
    );

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigateCommunity(`search?q=${encodeURIComponent(draft.trim())}`, { replace: true });
        }}
        className="relative max-w-2xl"
      >
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Rechercher dans QIAO Community..."
          className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-200 bg-white text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
        />
      </form>

      <div className="flex flex-col gap-3">
        <Pills options={TYPES} value={type} onChange={setType} />
        <div className="flex flex-wrap gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={select} aria-label="Catégorie">
            <option value="">Catégorie professionnelle</option>
            {professionalCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={select} aria-label="Pays">
            <option value="">Pays</option>
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className={select} aria-label="Langue">
            <option value="">Langue</option>
            {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          <select value={questionStatus} onChange={(e) => setQuestionStatus(e.target.value)} className={select} aria-label="Statut des questions">
            <option value="">Statut des questions</option>
            <option value="open">Ouvertes</option>
            <option value="answered">Résolues</option>
            <option value="closed">Fermées</option>
          </select>
          <label className="text-xs text-slate-500 inline-flex items-center gap-1.5">
            Depuis le
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={select} />
          </label>
        </div>
      </div>

      {error ? (
        <EmptyState text={error} />
      ) : !result ? (
        <Loading label="Recherche..." />
      ) : (
        <div className="space-y-8">
          {section(
            'communities',
            'Communautés',
            result.communities.total,
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.communities.items.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  onChange={(updated) =>
                    setResult((current) =>
                      current ? { ...current, communities: { ...current.communities, items: current.communities.items.map((c) => (c.id === updated.id ? updated : c)) } } : current,
                    )
                  }
                />
              ))}
            </div>,
          )}
          {section(
            'questions',
            'Questions',
            result.questions.total,
            <Card className="!py-0 divide-y divide-slate-100">
              {result.questions.items.map((post) => (
                <PostCard key={post.id} post={post} onChange={(p) => updateList('questions', p)} />
              ))}
            </Card>,
          )}
          {section(
            'posts',
            'Publications',
            result.posts.total,
            <Card className="!py-0 divide-y divide-slate-100">
              {result.posts.items.map((post) => (
                <PostCard key={post.id} post={post} onChange={(p) => updateList('posts', p)} />
              ))}
            </Card>,
          )}
          {section(
            'experts',
            'Experts',
            result.experts.total,
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.experts.items.map((expert) => (
                <button
                  key={expert.id}
                  onClick={() => navigateCommunity(`member/${expert.handle}`)}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 text-left hover:shadow-md transition-all cursor-pointer"
                >
                  <Avatar src={expert.avatarUrl} name={expert.fullName} className="w-11 h-11 border border-slate-200" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-900">
                      {expert.fullName} {expert.verificationStatus === 'verified' && <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />}
                    </span>
                    <span className="block text-[11px] text-slate-500 line-clamp-2">{expert.headline}</span>
                    <span className="block text-[10px] text-amber-700 font-semibold">{expert.categories.map((c) => c.name).join(' · ')}</span>
                  </span>
                </button>
              ))}
            </div>,
          )}
          {section(
            'members',
            'Membres',
            result.members.total,
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.members.items.map((member) => (
                <div key={member.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                  <Avatar src={member.avatarUrl} name={member.fullName} className="w-11 h-11 border border-slate-200" />
                  <div className="min-w-0">
                    <MemberName member={member} className="text-xs font-bold text-slate-900" />
                    <p className="text-[11px] text-slate-500 truncate">{member.headline}</p>
                    <p className="text-[10px] text-slate-400 truncate">{member.location}</p>
                  </div>
                </div>
              ))}
            </div>,
          )}
          {!q && type === 'all' && <p className="text-xs text-slate-400">Saisissez un mot-clé pour rechercher aussi parmi les membres.</p>}
        </div>
      )}
    </div>
  );
};
