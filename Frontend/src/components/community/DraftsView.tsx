import React, { useCallback, useEffect, useState } from 'react';
import { FilePen, Lock } from 'lucide-react';
import { api } from '../../lib/api';
import { PostView } from '../../lib/community';
import { timeAgo } from '../../lib/text';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PostComposerModal } from './PostComposerModal';
import { Card, EmptyState, Loading, errorMessage } from './ui';

/** Brouillons du membre : visibles par lui seul jusqu'à leur publication. */
export const DraftsView: React.FC = () => {
  const { user, requireAuth } = useAuth();
  const { notify } = useToast();
  const [drafts, setDrafts] = useState<PostView[] | null>(null);
  const [editing, setEditing] = useState<PostView | null>(null);

  const load = useCallback(() => {
    api.get<PostView[]>('/community/posts/drafts').then(setDrafts).catch(() => setDrafts([]));
  }, []);
  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (!user) {
    return (
      <Card>
        <EmptyState icon={<Lock className="w-10 h-10" />} text="Connectez-vous pour retrouver vos brouillons." action={{ label: 'Se connecter', onClick: () => requireAuth(() => undefined) }} />
      </Card>
    );
  }
  if (!drafts) return <Loading />;

  const remove = async (draft: PostView) => {
    if (!window.confirm('Supprimer ce brouillon ?')) return;
    try {
      await api.delete(`/community/posts/${draft.id}`);
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
        <FilePen className="w-5 h-5 text-red-600" /> Mes brouillons
      </h2>
      {drafts.length === 0 ? (
        <Card>
          <EmptyState icon={<FilePen className="w-10 h-10" />} text="Aucun brouillon. Utilisez « Enregistrer le brouillon » lors de la rédaction." />
        </Card>
      ) : (
        drafts.map((draft) => (
          <Card key={draft.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {draft.type === 'question' ? 'Question' : 'Publication'} — brouillon
                </span>
                <h3 className="mt-2 text-sm font-bold text-slate-900">{draft.title ?? draft.content.slice(0, 80)}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 mt-1">{draft.content}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {draft.community ? draft.community.name : 'Fil général'} · modifié {timeAgo(draft.updatedAt, 'long').toLowerCase()}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => setEditing(draft)} className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer">
                  Reprendre
                </button>
                <button onClick={() => remove(draft)} className="px-4 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:text-red-600 text-xs font-semibold cursor-pointer">
                  Supprimer
                </button>
              </div>
            </div>
          </Card>
        ))
      )}
      {editing && <PostComposerModal edit={editing} onClose={() => setEditing(null)} onSaved={() => load()} />}
    </div>
  );
};
