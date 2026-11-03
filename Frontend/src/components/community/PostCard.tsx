import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellOff,
  Bookmark,
  CheckCircle2,
  CornerDownRight,
  EyeOff,
  Flag,
  HelpCircle,
  Link2,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Send,
  Share2,
  ShieldAlert,
  ThumbsUp,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { CommentView, PostView, QUESTION_STATUS_LABELS, navigateCommunity } from '../../lib/community';
import { timeAgo } from '../../lib/text';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PostComposerModal } from './PostComposerModal';
import { AttachmentList, Avatar, LanguageBadge, MemberName, Modal, ModalActions, ReportModal, RichText, VisibilityBadge, errorMessage } from './ui';

const INTERFACE_LANGUAGE: Record<string, string> = { FR: 'fr', AR: 'ar', EN: 'en', ZH: 'zh' };

// --- Menu contextuel --------------------------------------------------------------------------

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  danger?: boolean;
}

export const ActionMenu: React.FC<{ items: (MenuItem | false | null | undefined)[]; label?: string }> = ({ items, label = 'Plus d’actions' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const visible = items.filter(Boolean) as MenuItem[];
  if (visible.length === 0) return null;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        aria-label={label}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30">
          {visible.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 cursor-pointer ${
                item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Modération directe -----------------------------------------------------------------------

const MODERATION_LABELS: Record<string, string> = {
  hide: 'Masquer (en attente d’examen)',
  remove: 'Retirer définitivement de la communauté',
  restore: 'Rétablir le contenu',
  lock: 'Verrouiller la discussion',
  unlock: 'Rouvrir la discussion',
};

export const ModerateModal: React.FC<{
  target: { type: 'post' | 'comment'; id: string };
  action: 'hide' | 'remove' | 'restore' | 'lock' | 'unlock';
  onClose: () => void;
  onDone: () => void;
}> = ({ target, action, onClose, onDone }) => {
  const { notify } = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={MODERATION_LABELS[action]} icon={<ShieldAlert className="w-4 h-4" />} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api.post('/community/moderation/content', { targetType: target.type, targetId: target.id, action, reason: reason.trim() || undefined });
            notify('Décision de modération enregistrée et notifiée à l’auteur.');
            onDone();
            onClose();
          } catch (err) {
            notify(errorMessage(err), 'error');
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-3"
      >
        <label className="block text-xs font-semibold text-slate-700">Motif communiqué à l'auteur</label>
        <textarea
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex. : publicité non autorisée (règle n°2 de la communauté)"
          className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:border-red-500"
        />
        <p className="text-[11px] text-slate-400">La décision est journalisée (auteur, date, motif).</p>
        <ModalActions onCancel={onClose} submitLabel="Confirmer" busy={busy} danger />
      </form>
    </Modal>
  );
};

// --- Commentaires -----------------------------------------------------------------------------

interface CommentThreadProps {
  post: PostView;
  onPostChange: (patch: Partial<PostView>) => void;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ post, onPostChange }) => {
  const { user, requireAuth } = useAuth();
  const { notify } = useToast();
  const [comments, setComments] = useState<CommentView[] | null>(null);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<CommentView | null>(null);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [report, setReport] = useState<CommentView | null>(null);
  const [moderate, setModerate] = useState<{ comment: CommentView; action: 'hide' | 'remove' | 'restore' } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const load = () =>
    api
      .get<CommentView[]>(`/community/posts/${post.id}/comments`)
      .then(setComments)
      .catch((err) => {
        notify(errorMessage(err, 'Chargement impossible.'), 'error');
        setComments([]);
      });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, user?.id]);

  const send = () =>
    requireAuth(async () => {
      const text = draft.trim();
      if (!text) return;
      setSending(true);
      try {
        const result = await api.post<{ comment: CommentView; commentsCount: number }>(`/community/posts/${post.id}/comments`, {
          text,
          parentId: replyTo?.id,
        });
        setDraft('');
        setReplyTo(null);
        onPostChange({ commentsCount: result.commentsCount, isFollowing: true });
        await load();
      } catch (err) {
        notify(errorMessage(err, 'Commentaire non publié.'), 'error');
      } finally {
        setSending(false);
      }
    }, 'Connectez-vous pour participer à la discussion.');

  const like = (comment: CommentView) =>
    requireAuth(async () => {
      try {
        const result = await api.post<{ liked: boolean; likes: number }>(`/community/comments/${comment.id}/like`);
        setComments((current) => current && updateTree(current, comment.id, { isLiked: result.liked, likes: result.likes }));
      } catch (err) {
        notify(errorMessage(err), 'error');
      }
    }, 'Connectez-vous pour réagir.');

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const result = await api.patch<{ text: string; editedAt: string }>(`/community/comments/${editing.id}`, { text: editing.text });
      setComments((current) => current && updateTree(current, editing.id, { text: result.text, editedAt: result.editedAt }));
      setEditing(null);
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const remove = async (comment: CommentView) => {
    if (!window.confirm('Supprimer ce commentaire ? Il ne sera plus visible dans la discussion.')) return;
    try {
      await api.delete(`/community/comments/${comment.id}`);
      onPostChange({ commentsCount: Math.max(0, post.commentsCount - 1) });
      await load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const accept = async (comment: CommentView) => {
    try {
      const updated = await api.post<PostView>(`/community/posts/${post.id}/status`, { status: 'answered', acceptedCommentId: comment.id });
      onPostChange({ questionStatus: updated.questionStatus, acceptedCommentId: updated.acceptedCommentId });
      notify('Réponse acceptée : la question est marquée comme résolue.');
      await load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const isQuestionAuthor = post.type === 'question' && user?.id === post.author?.id;

  const renderComment = (comment: CommentView, depth: number) => {
    const hiddenForOthers = comment.status !== 'published';
    return (
      <div key={comment.id} className={depth ? 'ml-8' : ''}>
        <div
          className={`flex items-start gap-2.5 rounded-xl p-2.5 text-xs ${
            comment.isAccepted ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'
          } ${hiddenForOthers ? 'opacity-70' : ''}`}
        >
          <Avatar src={comment.author?.avatarUrl} name={comment.author?.fullName ?? '?'} className="w-6 h-6 mt-0.5 !text-[9px]" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <MemberName member={comment.author} className="font-bold text-slate-900" />
                {comment.author?.headline && <span className="text-[10px] text-slate-400"> · {comment.author.headline}</span>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] text-slate-400">
                  {timeAgo(comment.createdAt)}
                  {comment.editedAt ? ' · modifié' : ''}
                </span>
                {user && comment.status !== 'deleted' && (
                  <ActionMenu
                    items={[
                      comment.canEdit && { label: 'Modifier', icon: Pencil, onClick: () => setEditing({ id: comment.id, text: comment.text ?? '' }) },
                      comment.canEdit && { label: 'Supprimer', icon: Trash2, onClick: () => remove(comment), danger: true },
                      !comment.canEdit && comment.author?.id !== user.id && { label: 'Signaler', icon: Flag, onClick: () => setReport(comment) },
                      comment.canModerate && comment.status === 'published' && { label: 'Masquer (modération)', icon: EyeOff, onClick: () => setModerate({ comment, action: 'hide' }) },
                      comment.canModerate && comment.status === 'published' && { label: 'Retirer (modération)', icon: Trash2, onClick: () => setModerate({ comment, action: 'remove' }), danger: true },
                      comment.canModerate && (comment.status === 'hidden' || comment.status === 'removed') && { label: 'Rétablir', icon: RotateCcw, onClick: () => setModerate({ comment, action: 'restore' }) },
                    ]}
                  />
                )}
              </div>
            </div>
            {comment.isAccepted && (
              <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 className="w-3 h-3" /> Réponse acceptée par l'auteur (avis de membre, non validé par QIAO)
              </div>
            )}
            {editing?.id === comment.id ? (
              <div className="mt-1 space-y-1.5">
                <textarea
                  value={editing.text}
                  onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                  rows={2}
                  maxLength={2000}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-red-500"
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold cursor-pointer">
                    Enregistrer
                  </button>
                  <button onClick={() => setEditing(null)} className="px-3 py-1 rounded-full border border-slate-200 text-[11px] font-semibold cursor-pointer">
                    Annuler
                  </button>
                </div>
              </div>
            ) : comment.status === 'deleted' ? (
              <p className="text-slate-400 italic text-[11px] mt-0.5">Commentaire supprimé par son auteur.</p>
            ) : comment.text === null ? (
              <p className="text-slate-400 italic text-[11px] mt-0.5">Commentaire retiré par la modération.</p>
            ) : (
              <>
                {hiddenForOthers && (
                  <p className="text-[10px] font-bold text-amber-700 mt-0.5">
                    {comment.status === 'hidden' ? 'Masqué par la modération' : 'Retiré par la modération'} — visible par vous seul(e)
                  </p>
                )}
                <RichText text={comment.text} className="text-slate-700 text-[11px] mt-0.5 leading-snug" />
              </>
            )}
            {comment.status === 'published' && (
              <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-500">
                <button
                  onClick={() => like(comment)}
                  className={`flex items-center gap-1 cursor-pointer ${comment.isLiked ? 'text-red-600 font-bold' : 'hover:text-slate-900'}`}
                >
                  <ThumbsUp className={`w-3 h-3 ${comment.isLiked ? 'fill-red-600' : ''}`} /> {comment.likes}
                </button>
                {post.permissions.canComment && (
                  <button
                    onClick={() => {
                      setReplyTo(depth ? comments!.find((c) => c.replies.some((r) => r.id === comment.id)) ?? comment : comment);
                      if (depth && comment.author?.handle) setDraft(`@${comment.author.handle} `);
                      inputRef.current?.focus();
                    }}
                    className="flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                  >
                    <CornerDownRight className="w-3 h-3" /> Répondre
                  </button>
                )}
                {isQuestionAuthor && !comment.isAccepted && comment.author?.id !== user?.id && post.questionStatus !== 'closed' && (
                  <button onClick={() => accept(comment)} className="flex items-center gap-1 text-emerald-700 hover:underline cursor-pointer font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Accepter cette réponse
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {comment.replies.length > 0 && <div className="mt-2 space-y-2">{comment.replies.map((reply) => renderComment(reply, depth + 1))}</div>}
      </div>
    );
  };

  return (
    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
      {comments === null ? (
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement des commentaires...
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[11px] text-slate-400">{post.type === 'question' ? 'Aucune réponse pour le moment. Soyez le premier à aider !' : 'Aucun commentaire pour le moment.'}</p>
      ) : (
        comments.map((comment) => renderComment(comment, 0))
      )}

      {post.permissions.canComment ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="space-y-1.5"
        >
          {replyTo && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <CornerDownRight className="w-3 h-3" /> Réponse à {replyTo.author?.fullName}
              <button type="button" onClick={() => setReplyTo(null)} aria-label="Annuler la réponse" className="cursor-pointer hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={post.type === 'question' ? 'Écrire une réponse...' : 'Écrire un commentaire...'}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-red-500 resize-none"
            />
            <button
              type="submit"
              disabled={sending}
              className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-60"
              aria-label="Publier le commentaire"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          {!user
            ? 'Connectez-vous pour participer à la discussion.'
            : post.locked
              ? 'Discussion verrouillée par la modération.'
              : post.questionStatus === 'closed'
                ? 'Cette question est fermée.'
                : 'Rejoignez la communauté pour participer à cette discussion.'}
        </p>
      )}

      {report && (
        <ReportModal target={{ type: 'comment', id: report.id, label: report.text ?? 'Commentaire' }} onClose={() => setReport(null)} />
      )}
      {moderate && (
        <ModerateModal
          target={{ type: 'comment', id: moderate.comment.id }}
          action={moderate.action}
          onClose={() => setModerate(null)}
          onDone={() => load()}
        />
      )}
    </div>
  );
};

function updateTree(list: CommentView[], id: string, patch: Partial<CommentView>): CommentView[] {
  return list.map((comment) =>
    comment.id === id ? { ...comment, ...patch } : { ...comment, replies: updateTree(comment.replies, id, patch) },
  );
}

// --- Carte de publication ---------------------------------------------------------------------

interface PostCardProps {
  post: PostView;
  onChange: (post: PostView) => void;
  onRemoved?: (postId: string) => void;
  /** Page de discussion : texte complet et commentaires ouverts. */
  detailed?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onChange, onRemoved, detailed = false }) => {
  const { user, requireAuth } = useAuth();
  const { notify } = useToast();
  const [threadOpen, setThreadOpen] = useState(detailed);
  const [expanded, setExpanded] = useState(detailed);
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [moderating, setModerating] = useState<'hide' | 'remove' | 'restore' | 'lock' | 'unlock' | null>(null);

  const patch = (changes: Partial<PostView>) => onChange({ ...post, ...changes });
  const interfaceLanguage = INTERFACE_LANGUAGE[user?.language ?? 'FR'] ?? 'fr';
  const long = post.content.length > 320;
  const open = () => navigateCommunity(`post/${post.id}`);

  const toggle = (path: 'like' | 'bookmark' | 'follow', reason: string) =>
    requireAuth(async () => {
      try {
        const result = await api.post<{ liked?: boolean; likes?: number; bookmarked?: boolean; following?: boolean }>(`/community/posts/${post.id}/${path}`);
        if (path === 'like') patch({ isLiked: !!result.liked, likes: result.likes ?? post.likes });
        if (path === 'bookmark') {
          patch({ isBookmarked: !!result.bookmarked });
          notify(result.bookmarked ? 'Publication enregistrée dans votre espace.' : 'Publication retirée de vos favoris.');
        }
        if (path === 'follow') {
          patch({ isFollowing: !!result.following });
          notify(result.following ? 'Vous serez notifié des nouvelles réponses.' : 'Vous ne suivez plus cette discussion.');
        }
      } catch (err) {
        notify(errorMessage(err), 'error');
      }
    }, reason);

  const share = () => {
    const url = `${window.location.origin}/?tab=community&cv=post/${post.id}`;
    navigator.clipboard?.writeText(url).catch(() => undefined);
    notify('Lien de la publication copié dans le presse-papiers !');
  };

  const remove = async () => {
    if (!window.confirm('Supprimer cette publication ? Elle ne sera plus visible dans la communauté (QIAO conserve un historique pour la modération).')) return;
    try {
      await api.delete(`/community/posts/${post.id}`);
      notify('Publication supprimée.');
      onRemoved?.(post.id);
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const setQuestionStatus = async (status: 'open' | 'answered' | 'closed') => {
    try {
      const updated = await api.post<PostView>(`/community/posts/${post.id}/status`, { status });
      patch({ questionStatus: updated.questionStatus, acceptedCommentId: updated.acceptedCommentId });
      notify(`Question ${QUESTION_STATUS_LABELS[status].toLowerCase()}.`);
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const contactAuthor = () =>
    requireAuth(() => {
      if (post.author?.handle) navigateCommunity(`messages/new?to=${post.author.handle}&post=${post.id}`);
    }, 'Connectez-vous pour écrire à ce membre.');

  const statusTone = { open: 'bg-blue-50 text-blue-700 border-blue-200', answered: 'bg-emerald-50 text-emerald-700 border-emerald-200', closed: 'bg-slate-100 text-slate-600 border-slate-200' };

  return (
    <article id={`post-${post.id}`} className="py-5 sm:py-6 first:pt-4">
      {/* Post Header: Avatar, Name, Time */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={post.author?.avatarUrl} name={post.author?.fullName ?? '?'} className="w-10 h-10 border border-slate-200 shadow-2xs" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              <MemberName member={post.author} />
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {[post.author?.headline ?? 'Membre QIAO', post.author?.location].filter(Boolean).join(' • ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-slate-400 font-medium">
            {timeAgo(post.createdAt)}
            {post.editedAt ? ' · modifié' : ''}
          </span>
          <ActionMenu
            items={[
              user && { label: post.isFollowing ? 'Ne plus suivre la discussion' : 'Suivre la discussion', icon: post.isFollowing ? BellOff : Bell, onClick: () => toggle('follow', '') },
              post.permissions.canEdit && { label: 'Modifier', icon: Pencil, onClick: () => setEditing(true) },
              post.permissions.canSetQuestionStatus && post.questionStatus !== 'closed' && { label: 'Fermer la question', icon: Lock, onClick: () => setQuestionStatus('closed') },
              post.permissions.canSetQuestionStatus && post.questionStatus !== 'open' && { label: 'Rouvrir la question', icon: HelpCircle, onClick: () => setQuestionStatus('open') },
              post.permissions.canMessageAuthor && { label: "Contacter l'auteur en privé", icon: Mail, onClick: contactAuthor },
              { label: 'Copier le lien', icon: Link2, onClick: share },
              user && !post.permissions.canEdit && post.author?.id !== user.id && { label: 'Signaler', icon: Flag, onClick: () => setReporting(true) },
              post.permissions.canModerate && post.status === 'published' && { label: 'Masquer (modération)', icon: EyeOff, onClick: () => setModerating('hide') },
              post.permissions.canModerate && post.status === 'published' && { label: 'Retirer (modération)', icon: Trash2, onClick: () => setModerating('remove'), danger: true },
              post.permissions.canModerate && (post.status === 'hidden' || post.status === 'removed') && { label: 'Rétablir', icon: RotateCcw, onClick: () => setModerating('restore') },
              post.permissions.canModerate && { label: post.locked ? 'Rouvrir la discussion' : 'Verrouiller la discussion', icon: post.locked ? Unlock : Lock, onClick: () => setModerating(post.locked ? 'unlock' : 'lock') },
              post.permissions.canDelete && { label: 'Supprimer', icon: Trash2, onClick: remove, danger: true },
            ]}
          />
        </div>
      </div>

      {/* Contexte : type, statut, communauté, catégorie */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {post.type === 'question' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
            <HelpCircle className="w-3 h-3" /> Question
          </span>
        )}
        {post.questionStatus && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusTone[post.questionStatus]}`}>
            {QUESTION_STATUS_LABELS[post.questionStatus]}
          </span>
        )}
        {post.community ? (
          <button
            onClick={() => navigateCommunity(`c/${post.community!.slug}`)}
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
          >
            {post.community.name}
          </button>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">Fil général</span>
        )}
        {post.community && post.community.visibility !== 'public' && <VisibilityBadge visibility={post.community.visibility} />}
        {post.professionalCategory && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">{post.professionalCategory.name}</span>
        )}
        {post.language !== interfaceLanguage && <LanguageBadge language={post.language} />}
        {post.locked && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-white">
            <Lock className="w-3 h-3" /> Verrouillée
          </span>
        )}
        {post.status !== 'published' && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            {{ draft: 'Brouillon', hidden: 'Masquée par la modération', removed: 'Retirée par la modération', deleted: 'Supprimée' }[post.status as 'draft']}
          </span>
        )}
      </div>

      {/* Post Content */}
      {post.title && (
        <h4 onClick={detailed ? undefined : open} className={`mt-2 text-sm sm:text-base font-bold text-slate-900 leading-snug ${detailed ? '' : 'hover:text-red-600 cursor-pointer'}`}>
          {post.title}
        </h4>
      )}
      <RichText
        text={expanded || !long ? post.content : `${post.content.slice(0, 320).trimEnd()}…`}
        className="mt-2 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal"
      />
      {long && !expanded && (
        <button onClick={() => setExpanded(true)} className="mt-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer">
          Voir plus
        </button>
      )}

      <AttachmentList attachments={post.attachments} />
      {post.links.length > 0 && (
        <div className="mt-2 space-y-1">
          {post.links.map((link) => (
            <a key={link} href={link} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline truncate">
              <Link2 className="w-3 h-3 shrink-0" /> {link}
            </a>
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Post Actions: Like, Comment, Share, Bookmark */}
      {post.status !== 'draft' && (
        <div className="mt-4 flex items-center justify-between pt-2 text-slate-500 text-xs">
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => toggle('like', 'Connectez-vous pour réagir aux publications.')}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${post.isLiked ? 'text-red-600 font-bold' : 'hover:text-slate-900'}`}
              aria-label="J'aime"
            >
              <ThumbsUp className={`w-4 h-4 ${post.isLiked ? 'fill-red-600' : ''}`} />
              <span>{post.likes}</span>
            </button>
            <button
              onClick={() => (detailed ? undefined : setThreadOpen(!threadOpen))}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${threadOpen ? 'text-slate-900 font-bold' : 'hover:text-slate-900'}`}
              aria-label="Commentaires"
            >
              <MessageSquare className="w-4 h-4" />
              <span>
                {post.commentsCount}
                <span className="hidden sm:inline"> {post.type === 'question' ? (post.commentsCount > 1 ? 'réponses' : 'réponse') : ''}</span>
              </span>
            </button>
            <button onClick={share} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Partager</span>
            </button>
            {!detailed && (
              <button onClick={open} className="hidden sm:inline text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer">
                Ouvrir la discussion
              </button>
            )}
          </div>

          <button
            onClick={() => toggle('bookmark', 'Connectez-vous pour enregistrer des publications.')}
            className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${post.isBookmarked ? 'text-red-600' : 'text-slate-400 hover:text-slate-700'}`}
            title="Enregistrer"
            aria-label="Enregistrer la publication"
          >
            <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-red-600' : ''}`} />
          </button>
        </div>
      )}

      {/* Aperçu des derniers commentaires ou fil complet */}
      {threadOpen ? (
        <CommentThread post={post} onPostChange={patch} />
      ) : (
        post.preview.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
            {post.preview.map((c) => (
              <div key={c.id} className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-2.5 text-xs">
                <Avatar src={c.author?.avatarUrl} name={c.author?.fullName ?? '?'} className="w-6 h-6 mt-0.5 !text-[9px]" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <MemberName member={c.author} className="font-bold text-slate-900" />
                    <span className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span>
                  </div>
                  {c.text && <RichText text={c.text} className="text-slate-700 text-[11px] mt-0.5 leading-snug line-clamp-3" />}
                </div>
              </div>
            ))}
            {post.commentsCount > post.preview.length && (
              <button onClick={() => setThreadOpen(true)} className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer">
                Voir les {post.commentsCount} commentaires
              </button>
            )}
          </div>
        )
      )}

      {editing && <PostComposerModal edit={post} onClose={() => setEditing(false)} onSaved={(saved) => onChange(saved)} />}
      {reporting && <ReportModal target={{ type: 'post', id: post.id, label: post.title ?? post.content }} onClose={() => setReporting(false)} />}
      {moderating && (
        <ModerateModal
          target={{ type: 'post', id: post.id }}
          action={moderating}
          onClose={() => setModerating(null)}
          onDone={() => api.get<PostView>(`/community/posts/${post.id}`).then(onChange).catch(() => onRemoved?.(post.id))}
        />
      )}
    </article>
  );
};
