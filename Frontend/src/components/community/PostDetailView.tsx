import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Lock, Mail, MessageSquare } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Paged, PostView, navigateCommunity } from '../../lib/community';
import { useAuth } from '../../context/AuthContext';
import { PostCard } from './PostCard';
import { Avatar, Card, EmptyState, Loading, MemberName, SectionTitle, VerifiedBadge } from './ui';

/** Page d'une discussion (accessible par URL directe, avec contrôle d'accès côté serveur). */
export const PostDetailView: React.FC<{ postId: string }> = ({ postId }) => {
  const { user, requireAuth } = useAuth();
  const [post, setPost] = useState<PostView | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [related, setRelated] = useState<PostView[]>([]);

  const load = useCallback(() => {
    setError(null);
    api
      .get<PostView>(`/community/posts/${postId}`)
      .then((loaded) => {
        setPost(loaded);
        if (loaded.type === 'question') {
          api
            .get<Paged<PostView>>('/community/posts', { type: 'question', category: loaded.professionalCategory?.id, limit: 5 })
            .then((page) => setRelated(page.items.filter((p) => p.id !== loaded.id).slice(0, 4)))
            .catch(() => setRelated([]));
        }
      })
      .catch((err) => setError({ status: err instanceof ApiError ? err.status : 0, message: err instanceof Error ? err.message : 'Discussion introuvable.' }));
  }, [postId]);

  useEffect(() => {
    load();
  }, [load, user?.id]);

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <EmptyState
          icon={<Lock className="w-10 h-10" />}
          text={error.message}
          action={
            error.status === 403 && !user
              ? { label: 'Se connecter', onClick: () => requireAuth(load, 'Connectez-vous pour accéder à cette discussion.') }
              : { label: "Retour au fil d'actualité", onClick: () => navigateCommunity('home') }
          }
        />
      </Card>
    );
  }
  if (!post) return <Loading label="Chargement de la discussion..." />;

  return (
    <div className="space-y-5">
      <button
        onClick={() => (window.history.length > 1 ? window.history.back() : navigateCommunity('home'))}
        className="text-xs font-semibold text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Retour
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl px-5 sm:px-6 shadow-xs">
          <PostCard post={post} onChange={setPost} onRemoved={() => navigateCommunity('home')} detailed />
        </div>
        <div className="lg:col-span-4 space-y-6">
          {post.author && (
            <Card>
              <SectionTitle title={post.type === 'question' ? 'Posée par' : 'Publiée par'} />
              <div className="flex items-center gap-3">
                <Avatar src={post.author.avatarUrl} name={post.author.fullName} className="w-12 h-12 border border-slate-200" />
                <div className="min-w-0">
                  <MemberName member={post.author} className="text-sm font-bold text-slate-900" />
                  <p className="text-[11px] text-slate-500">{post.author.headline}</p>
                  <p className="text-[11px] text-slate-400">{post.author.location}</p>
                </div>
              </div>
              {post.permissions.canMessageAuthor && (
                <button
                  onClick={() => navigateCommunity(`messages/new?to=${post.author!.handle}&post=${post.id}`)}
                  className="mt-4 w-full px-4 py-2 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" /> Écrire en privé
                </button>
              )}
            </Card>
          )}
          {post.community && (
            <Card>
              <SectionTitle title="Communauté" />
              <button onClick={() => navigateCommunity(`c/${post.community!.slug}`)} className="text-sm font-bold text-slate-900 hover:text-red-600 cursor-pointer text-left">
                {post.community.name}
              </button>
              <p className="text-[11px] text-slate-500 mt-1">Voir toutes les discussions de cette communauté.</p>
            </Card>
          )}
          {post.type === 'question' && (
            <Card>
              <SectionTitle title="Besoin d'un professionnel ?" />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Les réponses de la communauté sont des avis de membres. Pour contacter un professionnel, consultez l'annuaire des experts
                {post.professionalCategory ? ` « ${post.professionalCategory.name} »` : ''} et écrivez-lui directement.
              </p>
              <button
                onClick={() => navigateCommunity(`experts${post.professionalCategory ? `?category=${post.professionalCategory.id}` : ''}`)}
                className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <VerifiedBadge /> Trouver un expert
              </button>
            </Card>
          )}
          {related.length > 0 && (
            <Card>
              <SectionTitle title="Questions similaires" />
              <div className="space-y-3">
                {related.map((item) => (
                  <button key={item.id} onClick={() => navigateCommunity(`post/${item.id}`)} className="w-full text-left group cursor-pointer">
                    <span className="block text-xs font-bold text-slate-900 leading-snug group-hover:text-red-600">{item.title ?? item.content.slice(0, 80)}</span>
                    <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {item.commentsCount} réponse{item.commentsCount > 1 ? 's' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
