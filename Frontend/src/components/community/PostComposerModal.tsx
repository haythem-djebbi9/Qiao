import React, { useEffect, useRef, useState } from 'react';
import { FileText, HelpCircle, Link2, Loader2, MessageSquare, Paperclip, Plus, Save, Send, X } from 'lucide-react';
import { api } from '../../lib/api';
import { Attachment, CommunitySummary, LANGUAGE_LABELS, Paged, PostView, formatSize } from '../../lib/community';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Avatar, Modal, errorMessage, inputClass, useCategories } from './ui';

const LANGUAGE_BY_INTERFACE: Record<string, string> = { FR: 'fr', AR: 'ar', EN: 'en', ZH: 'zh' };

interface PostComposerModalProps {
  onClose: () => void;
  onSaved: (post: PostView) => void;
  initialType?: 'post' | 'question';
  initialCommunityId?: string | null;
  /** Publication existante à modifier (ou brouillon à publier). */
  edit?: PostView | null;
}

export const PostComposerModal: React.FC<PostComposerModalProps> = ({ onClose, onSaved, initialType = 'post', initialCommunityId, edit }) => {
  const { user } = useAuth();
  const { notify } = useToast();
  const { professionalCategories } = useCategories();
  const [type, setType] = useState<'post' | 'question'>(edit?.type ?? initialType);
  const [title, setTitle] = useState(edit?.title ?? '');
  const [content, setContent] = useState(edit?.content ?? '');
  const [communityId, setCommunityId] = useState<string>(edit?.community?.id ?? initialCommunityId ?? '');
  const [category, setCategory] = useState(edit?.professionalCategory?.id ?? '');
  const [language, setLanguage] = useState(edit?.language ?? LANGUAGE_BY_INTERFACE[user?.language ?? 'FR'] ?? 'fr');
  const [tags, setTags] = useState<string[]>(edit?.tags ?? []);
  const [tagDraft, setTagDraft] = useState('');
  const [links, setLinks] = useState<string[]>(edit?.links ?? []);
  const [linkDraft, setLinkDraft] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(edit?.attachments ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null);
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const isEdit = !!edit;
  const isDraft = edit?.status === 'draft';

  // Seules les communautés où le membre peut publier sont proposées (le serveur vérifie de toute façon).
  useEffect(() => {
    api
      .get<Paged<CommunitySummary>>('/community/communities', { scope: 'joined', limit: 50 })
      .then((page) => setCommunities(page.items.filter((c) => c.canPublish)))
      .catch(() => setCommunities([]));
  }, []);

  const addTag = () => {
    const value = tagDraft.trim().replace(/^#/, '');
    if (value.length >= 2 && value.length <= 30 && tags.length < 5 && !tags.includes(value)) setTags([...tags, value]);
    setTagDraft('');
  };

  const addLink = () => {
    const value = linkDraft.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(value)) {
      notify('Lien invalide : commencez par http:// ou https://', 'error');
      return;
    }
    if (links.length < 3 && !links.includes(value)) setLinks([...links, value]);
    setLinkDraft('');
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 4 - attachments.length)) {
        const body = new FormData();
        body.append('file', file);
        const attachment = await api.post<Attachment>('/community/uploads', body);
        setAttachments((current) => [...current, attachment]);
      }
    } catch (err) {
      notify(errorMessage(err, 'Envoi du fichier impossible.'), 'error');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const submit = async (mode: 'draft' | 'publish') => {
    if (type === 'question' && title.trim().length < 8) {
      notify('Donnez un titre à votre question (8 caractères minimum).', 'error');
      return;
    }
    if (content.trim().length < 5) {
      notify('Votre texte doit contenir au moins 5 caractères.', 'error');
      return;
    }
    setSaving(mode);
    const payload = {
      title: title.trim() || undefined,
      content: content.trim(),
      professionalCategory: category || undefined,
      tags,
      language,
      links,
      attachmentIds: attachments.map((a) => a.id),
    };
    try {
      const saved = isEdit
        ? await api.patch<PostView>(`/community/posts/${edit!.id}`, { ...payload, publish: isDraft && mode === 'publish' })
        : await api.post<PostView>('/community/posts', { ...payload, type, communityId: communityId || undefined, draft: mode === 'draft' });
      notify(
        mode === 'draft'
          ? 'Brouillon enregistré : retrouvez-le dans « Mes brouillons ».'
          : isEdit && !isDraft
            ? 'Publication modifiée.'
            : type === 'question'
              ? 'Votre question est en ligne. Vous serez notifié des réponses.'
              : 'Votre publication est en ligne !',
      );
      onSaved(saved);
      onClose();
    } catch (err) {
      notify(errorMessage(err, 'Publication impossible.'), 'error');
    } finally {
      setSaving(null);
    }
  };

  const titleLabel = type === 'question' ? 'Votre question' : 'Titre (optionnel)';

  return (
    <Modal
      title={isEdit ? (isDraft ? 'Terminer le brouillon' : 'Modifier la publication') : type === 'question' ? 'Poser une question' : 'Créer une publication'}
      icon={type === 'question' ? <HelpCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit('publish');
        }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <Avatar src={user?.avatarUrl} name={user?.fullName ?? ''} className="w-8 h-8" />
          <div className="text-xs">
            <div className="font-bold text-slate-900">{user?.fullName}</div>
            <div className="text-slate-500">
              {user?.title ?? 'Membre QIAO'} • {user?.location ?? 'Afrique du Nord'}
            </div>
          </div>
        </div>

        {/* Type de contenu : publication générale ou question */}
        {!isEdit && (
          <div className="grid grid-cols-2 gap-2">
            {([
              ['post', 'Publication', 'Partager une information, une offre, une actualité', MessageSquare],
              ['question', 'Question', 'Demander un conseil ou une recommandation', HelpCircle],
            ] as const).map(([value, label, hint, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  type === value ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Icon className={`w-4 h-4 ${type === value ? 'text-red-600' : 'text-slate-500'}`} /> {label}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{hint}</div>
              </button>
            ))}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">{titleLabel}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required={type === 'question'}
            placeholder={type === 'question' ? 'Ex : Je cherche un avocat spécialisé en droit commercial en Tunisie' : 'Ex : Nouveau service de groupage Ningbo – Radès'}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">{type === 'question' ? 'Détails' : 'Votre message / opportunité'}</label>
          <textarea
            rows={5}
            required
            maxLength={5000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              type === 'question'
                ? 'Contexte, pays, délais... Les membres et experts pourront vous répondre. Mentionnez un membre avec @identifiant.'
                : "Partagez un besoin d'approvisionnement, une offre de partenariat... Mentionnez un membre avec @identifiant."
            }
            className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
          <div className="text-[10px] text-slate-400 text-right">{content.length}/5000</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Communauté</label>
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              disabled={isEdit}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:border-red-500 disabled:bg-slate-50"
            >
              <option value="">Fil général QIAO Community (public)</option>
              {isEdit && edit?.community && !communities.some((c) => c.id === edit.community!.id) && (
                <option value={edit.community.id}>{edit.community.name}</option>
              )}
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
            {!isEdit && communities.length === 0 && (
              <p className="text-[10px] text-slate-400 mt-1">Rejoignez une communauté pour y publier.</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie professionnelle</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:border-red-500"
            >
              <option value="">{type === 'question' ? 'Choisir (recommandé)' : 'Aucune'}</option>
              {professionalCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tags ({tags.length}/5)</label>
            <div className="flex gap-1.5">
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                maxLength={30}
                placeholder="ex: Import/Export"
                className={inputClass}
              />
              <button type="button" onClick={addTag} className="px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer" aria-label="Ajouter le tag">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Langue de la publication</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:border-red-500"
            >
              {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 -mt-2">
            {tags.map((tag) => (
              <span key={tag} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} aria-label={`Retirer ${tag}`} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Liens & pièces jointes */}
        <div className="space-y-2">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (linkDraft.trim()) addLink();
                  }
                }}
                placeholder="Ajouter un lien (https://...)"
                className={`${inputClass} pl-8`}
              />
            </div>
            <button type="button" onClick={addLink} disabled={!linkDraft.trim() || links.length >= 3} className="px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-40">
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading || attachments.length >= 4}
              className="px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-40 inline-flex items-center gap-1"
              title="Images JPG/PNG/WEBP/GIF, documents PDF/DOCX/XLSX — 5 Mo max."
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />} Fichier
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.docx,.xlsx"
              className="hidden"
              onChange={(e) => upload(e.target.files)}
            />
          </div>
          {links.map((link) => (
            <div key={link} className="flex items-center gap-2 text-[11px] text-blue-600 bg-blue-50/50 border border-blue-100 rounded-lg px-2.5 py-1.5">
              <Link2 className="w-3 h-3 shrink-0" />
              <span className="flex-1 truncate">{link}</span>
              <button type="button" onClick={() => setLinks(links.filter((l) => l !== link))} aria-label="Retirer le lien" className="text-slate-400 hover:text-red-600 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center gap-2 text-[11px] text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <FileText className="w-3 h-3 text-red-600 shrink-0" />
              <span className="flex-1 truncate">{attachment.name}</span>
              <span className="text-slate-400">{formatSize(attachment.size)}</span>
              <button
                type="button"
                onClick={() => setAttachments(attachments.filter((a) => a.id !== attachment.id))}
                aria-label="Retirer le fichier"
                className="text-slate-400 hover:text-red-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed">
          Une question publiée ici est une discussion entre membres : elle ne crée aucune commande ni demande de service. Les réponses sont des avis de
          membres, sans garantie de QIAO.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
            Annuler
          </button>
          {(!isEdit || isDraft) && (
            <button
              type="button"
              onClick={() => submit('draft')}
              disabled={!!saving || uploading}
              className="px-4 py-2 rounded-full border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              {saving === 'draft' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Enregistrer le brouillon
            </button>
          )}
          <button
            type="submit"
            disabled={!!saving || uploading}
            className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
          >
            {saving === 'publish' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{isEdit && !isDraft ? 'Enregistrer' : 'Publier'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
