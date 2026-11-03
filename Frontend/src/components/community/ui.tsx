import React, { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Check,
  Clock,
  Download,
  Factory,
  FileText,
  Flag,
  Gem,
  Globe,
  GraduationCap,
  Handshake,
  Languages,
  Lightbulb,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Scale,
  Ship,
  Sprout,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { api, fetchObjectUrl } from '../../lib/api';
import { initials } from '../../lib/text';
import {
  Attachment,
  Category,
  CommunitySummary,
  LANGUAGE_SHORT,
  MemberSummary,
  REPORT_REASONS,
  Visibility,
  VISIBILITY_LABELS,
  formatSize,
  navigateCommunity,
} from '../../lib/community';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const errorMessage = (err: unknown, fallback = 'Action impossible.') => (err instanceof Error ? err.message : fallback);

// --- Avatars & identité ------------------------------------------------------------------

export const Avatar: React.FC<{ src: string | null | undefined; name: string; className: string }> = ({ src, name, className }) => {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  return src && !broken ? (
    <img src={src} alt={name} onError={() => setBroken(true)} className={`${className} rounded-full object-cover shrink-0`} />
  ) : (
    <span className={`${className} rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0`}>
      {initials(name || '?')}
    </span>
  );
};

/** Badge « Vérifié par QIAO » : affiché uniquement après une décision de vérification enregistrée. */
export const VerifiedBadge: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <span title="Profil professionnel vérifié par QIAO" className="inline-flex">
    <BadgeCheck className={`${className} text-blue-600`} />
  </span>
);

export const MemberName: React.FC<{ member: MemberSummary | null; className?: string }> = ({ member, className = '' }) => {
  if (!member) return <span className={`${className} text-slate-400 italic`}>Membre</span>;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (member.handle) navigateCommunity(`member/${member.handle}`);
      }}
      className={`${className} inline-flex items-center gap-1 hover:text-red-600 hover:underline cursor-pointer text-left`}
    >
      <span>{member.fullName}</span>
      {member.expertVerified && <VerifiedBadge />}
    </button>
  );
};

// --- Communautés -----------------------------------------------------------------------------

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Handshake,
  Sprout,
  Scale,
  Ship,
  Truck,
  TrendingUp,
  Factory,
  GraduationCap,
  MapPin,
  Languages,
  Lightbulb,
  Gem,
  MessageSquare,
  Globe,
};

export const COMMUNITY_ICON_NAMES = Object.keys(ICONS);

export const CommunityIcon: React.FC<{ name: string; className?: string }> = ({ name, className = 'w-6 h-6' }) => {
  const Icon = ICONS[name] ?? Users;
  return <Icon className={className} />;
};

export const VisibilityBadge: React.FC<{ visibility: Visibility; className?: string }> = ({ visibility, className = '' }) => {
  const Icon = visibility === 'public' ? Globe : visibility === 'restricted' ? Users : Lock;
  const tone =
    visibility === 'public'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : visibility === 'restricted'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-900 text-white border-slate-900';
  return (
    <span
      title={VISIBILITY_LABELS[visibility].hint}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tone} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {VISIBILITY_LABELS[visibility].label}
    </span>
  );
};

export const LanguageBadge: React.FC<{ language: string }> = ({ language }) => (
  <span title="Langue de la publication" className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
    {LANGUAGE_SHORT[language] ?? language.toUpperCase()}
  </span>
);

/**
 * Bouton d'adhésion : reflète l'état renvoyé par l'API (jamais supposé).
 * Libre → « Rejoindre » ; sur validation → « Demander à rejoindre » ; invitation → « Accepter l'invitation ».
 */
export const MembershipButton: React.FC<{
  community: CommunitySummary;
  onChange: (community: CommunitySummary) => void;
  size?: 'sm' | 'md';
}> = ({ community, onChange, size = 'sm' }) => {
  const { requireAuth } = useAuth();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const [askMessage, setAskMessage] = useState(false);
  const [message, setMessage] = useState('');
  const state = community.membership.state;
  const archived = community.status === 'archived';

  const run = async (action: 'join' | 'leave', body?: unknown) => {
    setBusy(true);
    try {
      const updated = await api.post<CommunitySummary>(`/community/communities/${community.slug}/${action}`, body ?? {});
      onChange({ ...community, ...updated });
      const next = updated.membership.state;
      notify(
        next === 'active'
          ? `Vous êtes membre de ${community.name}.`
          : next === 'pending'
            ? 'Demande envoyée : un modérateur va l’examiner.'
            : action === 'leave'
              ? `Vous avez quitté ${community.name}. Vos publications restent en ligne.`
              : 'Mise à jour enregistrée.',
      );
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
      setAskMessage(false);
      setMessage('');
    }
  };

  const join = () =>
    requireAuth(() => {
      if (community.membershipPolicy === 'approval' || state === 'removed') setAskMessage(true);
      else run('join');
    }, 'Connectez-vous pour rejoindre cette communauté.');

  const base = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-xs sm:text-sm';
  const spinner = busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null;

  let button: React.ReactNode;
  if (archived) {
    button = <span className={`${base} rounded-full bg-slate-100 text-slate-500 font-semibold`}>Archivée</span>;
  } else if (state === 'active') {
    button = (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Quitter « ${community.name} » ? Vos publications resteront en ligne.`)) run('leave');
        }}
        disabled={busy}
        className={`${base} group rounded-full font-semibold border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all cursor-pointer inline-flex items-center gap-1.5`}
      >
        {spinner ?? <Check className="w-3.5 h-3.5 group-hover:hidden" />}
        <span className="group-hover:hidden">{community.membership.role === 'moderator' ? 'Modérateur' : 'Membre'}</span>
        <span className="hidden group-hover:inline">Quitter</span>
      </button>
    );
  } else if (state === 'pending') {
    button = (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm('Annuler votre demande d’adhésion ?')) run('leave');
        }}
        disabled={busy}
        className={`${base} rounded-full font-semibold border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer inline-flex items-center gap-1.5`}
      >
        {spinner ?? <Clock className="w-3.5 h-3.5" />} En attente
      </button>
    );
  } else if (state === 'invited') {
    button = (
      <span className="inline-flex items-center gap-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            run('join');
          }}
          disabled={busy}
          className={`${base} rounded-full font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer inline-flex items-center gap-1.5`}
        >
          {spinner ?? <Check className="w-3.5 h-3.5" />} Accepter l'invitation
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            run('leave');
          }}
          disabled={busy}
          className={`${base} rounded-full font-semibold border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer`}
        >
          Refuser
        </button>
      </span>
    );
  } else if (state === 'banned') {
    button = <span className={`${base} rounded-full bg-slate-100 text-slate-500 font-semibold`}>Accès retiré</span>;
  } else if (community.membershipPolicy === 'invite') {
    button = (
      <span className={`${base} rounded-full bg-slate-100 text-slate-500 font-semibold inline-flex items-center gap-1`}>
        <Lock className="w-3 h-3" /> Sur invitation
      </span>
    );
  } else {
    const label = community.membershipPolicy === 'approval' || state === 'removed' ? 'Demander à rejoindre' : 'Rejoindre';
    button = (
      <button
        onClick={(e) => {
          e.stopPropagation();
          join();
        }}
        disabled={busy}
        className={`${base} rounded-full font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5`}
      >
        {spinner ?? <UserPlus className="w-3.5 h-3.5" />} {label}
      </button>
    );
  }

  return (
    <>
      {button}
      {askMessage && (
        <Modal title={`Demander à rejoindre ${community.name}`} icon={<UserPlus className="w-4 h-4" />} onClose={() => setAskMessage(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run('join', { message: message.trim() || undefined });
            }}
            className="space-y-4"
          >
            <p className="text-xs text-slate-600 leading-relaxed">
              Les modérateurs examinent chaque demande. Présentez-vous en une phrase (facultatif) : activité, pays, ce que vous recherchez.
            </p>
            <textarea
              rows={3}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex. : Importateur à Tunis, je souhaite échanger sur les audits d'usines..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            <ModalActions onCancel={() => setAskMessage(false)} submitLabel="Envoyer la demande" busy={busy} />
          </form>
        </Modal>
      )}
    </>
  );
};

// --- Fenêtres --------------------------------------------------------------------------------

export const Modal: React.FC<{
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ title, icon, onClose, children, wide }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`bg-white rounded-3xl ${wide ? 'max-w-2xl' : 'max-w-lg'} w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200`}
    >
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2 mb-4 pr-8">
        {icon && <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">{icon}</div>}
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

export const ModalActions: React.FC<{ onCancel: () => void; submitLabel: string; busy?: boolean; danger?: boolean; disabled?: boolean }> = ({
  onCancel,
  submitLabel,
  busy,
  danger,
  disabled,
}) => (
  <div className="pt-2 flex items-center justify-end gap-2">
    <button
      type="button"
      onClick={onCancel}
      className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
    >
      Annuler
    </button>
    <button
      type="submit"
      disabled={busy || disabled}
      className={`px-5 py-2 rounded-full ${danger ? 'bg-slate-900 hover:bg-black' : 'bg-red-600 hover:bg-red-700'} text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-60`}
    >
      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {submitLabel}
    </button>
  </div>
);

/** Signalement d'un contenu, d'un membre, d'un message ou d'une communauté. */
export const ReportModal: React.FC<{
  target: { type: 'post' | 'comment' | 'user' | 'message' | 'community'; id: string; label: string };
  onClose: () => void;
}> = ({ target, onClose }) => {
  const { notify } = useToast();
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/community/reports', { targetType: target.type, targetId: target.id, reason, description: description.trim() || undefined });
      notify('Merci : votre signalement a été transmis à la modération.');
      onClose();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Signaler" icon={<Flag className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-2.5 line-clamp-2">{target.label}</p>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Motif</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:border-red-500"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Précisions (facultatif)</label>
          <textarea
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:border-red-500"
          />
        </div>
        {target.type === 'message' && (
          <p className="text-[11px] text-slate-500">Seul ce message sera transmis aux administrateurs, pas le reste de la conversation.</p>
        )}
        <ModalActions onCancel={onClose} submitLabel="Envoyer le signalement" busy={busy} />
      </form>
    </Modal>
  );
};

// --- Contenus ----------------------------------------------------------------------------------

const TOKEN_PATTERN = /(https?:\/\/[^\s<]+|@[a-z0-9][a-z0-9-]{1,58})/gi;

/** Texte utilisateur : liens cliquables et @mentions vers les profils (jamais de HTML interprété). */
export const RichText: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <p className={`whitespace-pre-line break-words ${className ?? ''}`}>
    {text.split(TOKEN_PATTERN).map((part, index) => {
      if (/^https?:\/\//i.test(part)) {
        return (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-600 hover:underline break-all">
            {part}
          </a>
        );
      }
      if (/^@[a-z0-9]/i.test(part)) {
        return (
          <button
            key={index}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateCommunity(`member/${part.slice(1).toLowerCase()}`);
            }}
            className="text-red-600 font-semibold hover:underline cursor-pointer"
          >
            {part}
          </button>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    })}
  </p>
);

/** Image jointe chargée avec la session (les communautés restreintes ne sont pas accessibles sans jeton). */
export const AttachmentImage: React.FC<{ attachment: Attachment; className?: string }> = ({ attachment, className }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let revoked: string | null = null;
    fetchObjectUrl(`/community/attachments/${attachment.id}`)
      .then((objectUrl) => {
        revoked = objectUrl;
        setUrl(objectUrl);
      })
      .catch(() => setFailed(true));
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [attachment.id]);
  if (failed) return <div className={`${className} bg-slate-100 flex items-center justify-center text-[11px] text-slate-400`}>Image indisponible</div>;
  if (!url) return <div className={`${className} bg-slate-100 animate-pulse`} />;
  return <img src={url} alt={attachment.name} className={`${className} object-cover`} />;
};

export const AttachmentList: React.FC<{ attachments: Attachment[] }> = ({ attachments }) => {
  const { notify } = useToast();
  if (attachments.length === 0) return null;
  const images = attachments.filter((a) => a.kind === 'image');
  const files = attachments.filter((a) => a.kind !== 'image');
  const download = async (attachment: Attachment) => {
    try {
      const url = await fetchObjectUrl(`/community/attachments/${attachment.id}`);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      notify(errorMessage(err, 'Téléchargement impossible.'), 'error');
    }
  };
  return (
    <div className="mt-3 space-y-2">
      {images.length > 0 && (
        <div className={`grid gap-2 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {images.map((image) => (
            <AttachmentImage key={image.id} attachment={image} className="w-full max-h-72 rounded-xl border border-slate-200" />
          ))}
        </div>
      )}
      {files.map((file) => (
        <button
          key={file.id}
          type="button"
          onClick={() => download(file)}
          className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left cursor-pointer"
        >
          <FileText className="w-4 h-4 text-red-600 shrink-0" />
          <span className="flex-1 min-w-0 text-xs font-semibold text-slate-800 truncate">{file.name}</span>
          <span className="text-[10px] text-slate-400">{formatSize(file.size)}</span>
          <Download className="w-3.5 h-3.5 text-slate-400" />
        </button>
      ))}
    </div>
  );
};

// --- Divers -------------------------------------------------------------------------------------

export const EmptyState: React.FC<{ icon?: React.ReactNode; text: string; action?: { label: string; onClick: () => void } }> = ({ icon, text, action }) => (
  <div className="py-12 text-center text-slate-400">
    <div className="w-10 h-10 mx-auto text-slate-300 mb-2 flex items-center justify-center">{icon ?? <MessageSquare className="w-10 h-10" />}</div>
    <p className="text-sm font-medium">{text}</p>
    {action && (
      <button onClick={action.onClick} className="mt-3 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer">
        {action.label}
      </button>
    )}
  </div>
);

export const Loading: React.FC<{ label?: string }> = ({ label = 'Chargement...' }) => (
  <div className="py-12 flex items-center justify-center gap-2 text-sm text-slate-400">
    <Loader2 className="w-5 h-5 animate-spin text-red-600" /> {label}
  </div>
);

export const Pills: React.FC<{
  options: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
}> = ({ options, value, onChange }) => (
  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
    {options.map((option) => (
      <button
        key={option.id}
        onClick={() => onChange(option.id)}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
          value === option.id ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        {option.label}
        {option.count ? <span className="ml-1 px-1.5 rounded-full bg-red-600 text-white text-[10px]">{option.count}</span> : null}
      </button>
    ))}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-xs ${className}`}>{children}</div>
);

export const SectionTitle: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    {action}
  </div>
);

export const inputClass =
  'w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500';

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block">
    <span className="block text-xs font-semibold text-slate-700 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
  </label>
);

/** Catégories (communautés & professionnelles), chargées une fois par session. */
let categoriesCache: Promise<{ communityCategories: Category[]; professionalCategories: Category[] }> | null = null;
export function useCategories() {
  const [data, setData] = useState<{ communityCategories: Category[]; professionalCategories: Category[] }>({
    communityCategories: [],
    professionalCategories: [],
  });
  useEffect(() => {
    categoriesCache ??= api.get('/community/categories');
    categoriesCache.then(setData).catch(() => {
      categoriesCache = null;
    });
  }, []);
  return data;
}

export function resetCategoriesCache() {
  categoriesCache = null;
}

export const MultiSelect: React.FC<{
  options: { id: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
}> = ({ options, value, onChange, max }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((option) => {
      const selected = value.includes(option.id);
      return (
        <button
          key={option.id}
          type="button"
          onClick={() => {
            if (selected) onChange(value.filter((v) => v !== option.id));
            else if (!max || value.length < max) onChange([...value, option.id]);
          }}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
            selected ? 'bg-red-50 border-red-400 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          {selected && <Check className="w-3 h-3 inline mr-0.5" />}
          {option.label}
        </button>
      );
    })}
  </div>
);
