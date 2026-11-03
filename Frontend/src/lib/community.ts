/** Types et utilitaires de QIAO Community (API /api/community). */
import { useEffect, useState } from 'react';

export type Visibility = 'public' | 'restricted' | 'private';
export type MembershipPolicy = 'open' | 'approval' | 'invite';
export type MembershipState = 'none' | 'pending' | 'active' | 'invited' | 'rejected' | 'removed' | 'banned' | 'left';

export interface MemberSummary {
  id: string;
  handle: string | null;
  fullName: string;
  headline: string | null;
  location: string | null;
  avatarUrl: string | null;
  isExpert: boolean;
  expertVerified: boolean;
  suspended: boolean;
}

export interface Category {
  id: string;
  name: string;
  sortOrder?: number;
  active?: boolean;
}

export interface CommunitySummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: Category | null;
  coverImage: string | null;
  icon: string;
  languages: string[];
  scope: string | null;
  visibility: Visibility;
  membershipPolicy: MembershipPolicy;
  status: 'active' | 'archived';
  featured: boolean;
  membersCount: number;
  postsCount: number;
  createdAt: string;
  membership: { state: MembershipState; role: 'member' | 'moderator' | null };
  canViewContent: boolean;
  canPublish: boolean;
}

export interface CommunityDetail extends CommunitySummary {
  rules: string | null;
  moderators: MemberSummary[];
  isModerator: boolean;
  pendingRequests: number;
}

export interface Attachment {
  id: string;
  name: string;
  mime: string;
  size: number;
  kind: 'image' | 'file';
}

export interface CommentView {
  id: string;
  postId: string;
  parentId: string | null;
  author: MemberSummary | null;
  text: string | null;
  status: 'published' | 'hidden' | 'removed' | 'deleted';
  likes: number;
  isLiked: boolean;
  isAccepted: boolean;
  createdAt: string;
  editedAt: string | null;
  canEdit: boolean;
  canModerate: boolean;
  replies: CommentView[];
}

export interface PostView {
  id: string;
  type: 'post' | 'question';
  title: string | null;
  content: string;
  tags: string[];
  language: string;
  status: 'published' | 'draft' | 'hidden' | 'removed' | 'deleted';
  questionStatus: 'open' | 'answered' | 'closed' | null;
  acceptedCommentId: string | null;
  locked: boolean;
  community: { id: string; slug: string; name: string; visibility: Visibility } | null;
  professionalCategory: Category | null;
  author: MemberSummary | null;
  likes: number;
  commentsCount: number;
  attachments: Attachment[];
  links: string[];
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  isLiked: boolean;
  isBookmarked: boolean;
  isFollowing: boolean;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canModerate: boolean;
    canComment: boolean;
    canReact: boolean;
    canSetQuestionStatus: boolean;
    canMessageAuthor: boolean;
  };
  preview: CommentView[];
}

export interface Paged<T> {
  items: T[];
  total: number;
  page?: number;
  hasMore?: boolean;
}

export interface ExpertCard extends MemberSummary {
  categories: Category[];
  countriesServed: string[];
  languages: string[];
  country: string | null;
  verificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
  isFollowing: boolean;
}

export interface RecommendedMember extends MemberSummary {
  country: string | null;
  reason: string;
  isFollowing: boolean;
}

export interface MemberProfileView extends MemberSummary {
  bio: string | null;
  company: string | null;
  country: string | null;
  city: string | null;
  languages: string[] | null;
  sectors: Category[];
  interests: string[];
  email: string | null;
  memberSince: string;
  showActivity: boolean;
  expert: {
    headline: string;
    biography: string | null;
    categories: Category[];
    countriesServed: string[];
    languages: string[];
    yearsExperience: number | null;
    verificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
    verifiedAt: string | null;
  } | null;
  stats: { followers: number; following: number; posts: number };
  communities: { id: string; slug: string; name: string; role: string }[] | null;
  relationship: {
    isSelf: boolean;
    isFollowing: boolean;
    followsYou: boolean;
    blocked: boolean;
    canMessage: boolean;
    messageRestriction: string | null;
  };
}

export type FieldVisibility = 'public' | 'members' | 'private';

export interface PrivacySettings {
  profile: 'public' | 'members';
  company: FieldVisibility;
  location: FieldVisibility;
  bio: FieldVisibility;
  languages: FieldVisibility;
  communities: FieldVisibility;
  activity: FieldVisibility;
  email: FieldVisibility;
  messages: 'everyone' | 'connections' | 'nobody';
}

export interface MyProfile {
  id: string;
  handle: string | null;
  fullName: string;
  email: string;
  company: string | null;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  languages: string[];
  sectors: string[];
  interests: string[];
  privacy: PrivacySettings;
  notificationPrefs: Record<string, boolean>;
  notificationKinds: { id: string; label: string; mandatory?: boolean }[];
  expert: {
    listed: boolean;
    headline: string;
    biography: string | null;
    categories: string[];
    countriesServed: string[];
    languages: string[];
    yearsExperience: number | null;
    verificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
    verificationNote: string | null;
    verificationRequestedAt: string | null;
  } | null;
  blocked: { id: string; handle: string | null; fullName: string; avatarUrl: string | null }[];
}

export interface ConversationSummary {
  id: string;
  other: MemberSummary | null;
  blocked: boolean;
  context: { type: 'post' | 'profile'; id: string | null; label: string | null } | null;
  lastMessage: { body: string; fromMe: boolean; createdAt: string } | null;
  unread: number;
  lastMessageAt: string;
}

export interface ConversationThread {
  id: string;
  other: MemberSummary | null;
  context: ConversationSummary['context'];
  canSend: boolean;
  restriction: string | null;
  hasMore: boolean;
  messages: { id: string; fromMe: boolean; body: string | null; status: 'sent' | 'removed'; source?: 'web' | 'wechat'; createdAt: string }[];
}

export interface ActivityItem {
  id: string;
  kind: string | null;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface ModerationSummary {
  isAdmin: boolean;
  isModerator: boolean;
  communities: { id: string; slug: string; name: string }[];
  pendingRequests: number;
}

export interface ReportView {
  id: string;
  targetType: 'post' | 'comment' | 'user' | 'message' | 'community';
  targetId: string;
  reason: string;
  reasonLabel: string;
  description: string | null;
  snapshot: string | null;
  status: 'new' | 'under_review' | 'action_taken' | 'rejected' | 'closed';
  escalated: boolean;
  action: string | null;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
  community: { id: string; slug: string; name: string } | null;
  reporter: MemberSummary | null;
  targetUser: MemberSummary | null;
  assignedTo: string | null;
  resolvedBy: string | null;
  target: { status: string; locked?: boolean; link: string | null; label: string } | null;
}

// --- Libellés partagés ---------------------------------------------------------------

export const LANGUAGE_LABELS: Record<string, string> = { fr: 'Français', ar: 'العربية', en: 'English', zh: '中文', other: 'Autre' };
export const LANGUAGE_SHORT: Record<string, string> = { fr: 'FR', ar: 'AR', en: 'EN', zh: '中文', other: '—' };
export const COUNTRIES = ['Tunisie', 'Maroc', 'Algérie', 'Égypte', 'Libye', 'Mauritanie', 'Chine', 'France', 'Autre'];

export const VISIBILITY_LABELS: Record<Visibility, { label: string; hint: string }> = {
  public: { label: 'Publique', hint: 'Visible par tous' },
  restricted: { label: 'Restreinte', hint: 'Contenu réservé aux membres' },
  private: { label: 'Privée', hint: 'Sur invitation uniquement' },
};

export const POLICY_LABELS: Record<MembershipPolicy, string> = {
  open: 'Adhésion libre',
  approval: 'Adhésion sur validation',
  invite: 'Sur invitation',
};

export const QUESTION_STATUS_LABELS: Record<'open' | 'answered' | 'closed', string> = {
  open: 'Ouverte',
  answered: 'Résolue',
  closed: 'Fermée',
};

export const REPORT_REASONS: { id: string; label: string }[] = [
  { id: 'spam', label: 'Spam' },
  { id: 'harassment', label: 'Harcèlement' },
  { id: 'fraud', label: 'Fraude ou arnaque' },
  { id: 'impersonation', label: "Usurpation d'identité" },
  { id: 'advertising', label: 'Publicité non autorisée' },
  { id: 'illegal', label: 'Contenu illégal' },
  { id: 'credentials', label: 'Qualifications professionnelles trompeuses' },
  { id: 'privacy', label: "Divulgation d'informations privées" },
  { id: 'abuse', label: 'Propos abusifs ou discriminatoires' },
  { id: 'other', label: 'Autre' },
];

export const MESSAGE_RESTRICTIONS: Record<string, string> = {
  login: 'Connectez-vous pour envoyer un message.',
  self: '',
  suspended: "Ce compte n'est pas disponible.",
  blocked: 'Messagerie indisponible avec ce membre.',
  nobody: "Ce membre n'accepte pas de messages privés.",
  connections: 'Messages réservés aux membres de ses communautés ou qu’il suit.',
};

// --- Routeur interne de Community (?tab=community&cv=...) --------------------------------

/**
 * Routes : home, communities, c/<slug>[/<section>], post/<id>, member/<handle>, experts,
 * messages[/<id>], settings[/<section>], moderation, admin[/<section>], search, drafts.
 */
export type CommunityRoute = { name: string; params: string[]; query: URLSearchParams };

const listeners = new Set<(route: string) => void>();

function readRoute(): string {
  if (typeof window === 'undefined') return 'home';
  return new URLSearchParams(window.location.search).get('cv') || 'home';
}

export function parseRoute(route: string): CommunityRoute {
  const [path, qs = ''] = route.split('?');
  const [name = 'home', ...params] = path.split('/').filter(Boolean);
  return { name, params, query: new URLSearchParams(qs) };
}

/** Navigue dans Community en conservant une URL partageable (bouton retour du navigateur pris en charge). */
export function navigateCommunity(route: string, options: { replace?: boolean } = {}) {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', 'community');
  if (route && route !== 'home') url.searchParams.set('cv', route);
  else url.searchParams.delete('cv');
  url.hash = '';
  if (url.toString() !== window.location.href) {
    window.history[options.replace ? 'replaceState' : 'pushState'](null, '', url.toString());
  }
  listeners.forEach((listener) => listener(route || 'home'));
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

export function useCommunityRoute(): [CommunityRoute, string] {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const onChange = (next: string) => setRoute(next);
    const onPop = () => setRoute(readRoute());
    listeners.add(onChange);
    window.addEventListener('popstate', onPop);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener('popstate', onPop);
    };
  }, []);
  return [parseRoute(route), route];
}

/** Lien de notification (« community/post/<id> ») → route interne (« post/<id> »). */
export function routeFromLink(link: string): string | null {
  if (!link.startsWith('community')) return null;
  return link.replace(/^community\/?/, '') || 'home';
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}
