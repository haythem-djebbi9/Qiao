import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Compass, HelpCircle, Loader2, MessageSquare, Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { Paged, PostView, navigateCommunity } from '../../lib/community';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PostCard } from './PostCard';
import { PostComposerModal } from './PostComposerModal';
import { EmptyState, Pills, errorMessage } from './ui';

const PAGE_SIZE = 8;

const FILTERS = [
  { id: 'recent', label: 'Récentes' },
  { id: 'popular', label: 'Populaires' },
  { id: 'unanswered', label: 'Sans réponse' },
  { id: 'questions', label: 'Questions' },
  { id: 'my-communities', label: 'Mes communautés' },
  { id: 'following', label: 'Suivis' },
];

interface FeedSectionProps {
  title?: string;
  /** slug de communauté (page de communauté) */
  community?: { id: string; slug: string; canPublish: boolean } | null;
  /** @identifiant (activité d'un profil) */
  author?: string;
  /** Recherche appliquée au fil */
  query?: string;
  showDiscover?: boolean;
  compactFilters?: boolean;
  emptyText?: string;
}

/**
 * Fil de publications et questions. Tri et filtres appliqués côté serveur (règles documentées dans l'API),
 * pagination incrémentale « Voir plus ».
 */
export const FeedSection: React.FC<FeedSectionProps> = ({ title = 'Discussions & publications', community, author, query, showDiscover, compactFilters, emptyText }) => {
  const { user, requireAuth } = useAuth();
  const { notify } = useToast();
  const [filter, setFilter] = useState('recent');
  const [items, setItems] = useState<PostView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composer, setComposer] = useState<'post' | 'question' | null>(null);
  const requestId = useRef(0);

  const filters = FILTERS.filter((f) => !(community || author) || !['my-communities', 'following'].includes(f.id));

  const load = useCallback(
    async (nextPage: number) => {
      const id = ++requestId.current;
      if (nextPage === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const result = await api.get<Paged<PostView>>('/community/posts', {
          filter,
          community: community?.slug,
          author,
          q: query || undefined,
          page: nextPage,
          limit: PAGE_SIZE,
        });
        if (id !== requestId.current) return;
        setItems((current) => (nextPage === 1 ? result.items : [...current, ...result.items.filter((p) => !current.some((c) => c.id === p.id))]));
        setTotal(result.total);
        setPage(nextPage);
        setError(null);
      } catch (err) {
        if (id === requestId.current) setError(errorMessage(err, 'Chargement impossible.'));
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [filter, community?.slug, author, query],
  );

  useEffect(() => {
    load(1);
  }, [load, user?.id]);

  const openComposer = (type: 'post' | 'question') =>
    requireAuth(() => {
      if (community && !community.canPublish) {
        notify('Rejoignez cette communauté pour y publier.', 'info');
        return;
      }
      setComposer(type);
    }, 'Connectez-vous pour publier dans la communauté.');

  // « Créer une publication » depuis l'en-tête de Community.
  useEffect(() => {
    const onCompose = (event: Event) => openComposer(((event as CustomEvent).detail as 'post' | 'question') ?? 'post');
    window.addEventListener('qiao:compose', onCompose);
    return () => window.removeEventListener('qiao:compose', onCompose);
  });

  const needsLogin = !user && (filter === 'my-communities' || filter === 'following');

  return (
    <div id="community-feed" className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs scroll-mt-28">
      {/* Header row */}
      <div className="flex flex-col gap-3 pb-4 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900">{title}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {showDiscover && (
              <button
                onClick={() => navigateCommunity('communities')}
                className="px-3.5 py-2 rounded-full border border-slate-200 text-slate-700 hover:border-red-500 hover:text-red-600 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" /> Découvrir les communautés
              </button>
            )}
            <button
              onClick={() => openComposer('question')}
              className="px-3.5 py-2 rounded-full border border-red-600 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Poser une question
            </button>
            <button
              onClick={() => openComposer('post')}
              className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer une publication</span>
            </button>
          </div>
        </div>
        {!compactFilters && <Pills options={filters} value={filter} onChange={setFilter} />}
      </div>

      {query && (
        <div className="mt-4 flex items-center justify-between bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs">
          <span className="text-slate-600">
            Recherche : <strong className="text-slate-900">{query}</strong>
            <span className="text-slate-400"> — {total} publication{total > 1 ? 's' : ''}</span>
          </span>
        </div>
      )}

      {/* Feed List */}
      <div className="divide-y divide-slate-100 mt-2">
        {loading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-red-600" /> Chargement des publications...
          </div>
        ) : error ? (
          <EmptyState text={error} />
        ) : needsLogin ? (
          <EmptyState
            text="Connectez-vous pour voir les publications de vos communautés et des membres que vous suivez."
            action={{ label: 'Se connecter', onClick: () => requireAuth(() => load(1)) }}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-10 h-10" />}
            text={
              emptyText ??
              (filter === 'my-communities'
                ? "Vous n'avez rejoint aucune communauté pour le moment."
                : filter === 'following'
                  ? 'Suivez des membres ou des discussions pour les retrouver ici.'
                  : 'Aucune publication trouvée.')
            }
            action={filter === 'my-communities' ? { label: 'Découvrir les communautés', onClick: () => navigateCommunity('communities') } : undefined}
          />
        ) : (
          items.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onChange={(updated) => setItems((current) => current.map((p) => (p.id === updated.id ? updated : p)))}
              onRemoved={(id) => {
                setItems((current) => current.filter((p) => p.id !== id));
                setTotal((t) => Math.max(0, t - 1));
              }}
            />
          ))
        )}
      </div>

      {!loading && items.length < total && (
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            onClick={() => load(page + 1)}
            disabled={loadingMore}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Voir plus de publications ({total - items.length}) ⌵</span>
          </button>
        </div>
      )}

      {composer && (
        <PostComposerModal
          initialType={composer}
          initialCommunityId={community?.id ?? null}
          onClose={() => setComposer(null)}
          onSaved={(post) => {
            if (post.status === 'published') {
              setFilter('recent');
              load(1);
            }
          }}
        />
      )}
    </div>
  );
};
