import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, Flag, Languages, Lock, MapPin, MessageSquare, ShieldCheck, UserMinus, UserPlus, Users, X } from 'lucide-react';
import { api } from '../../lib/api';
import { CommunityDetail, CommunitySummary, LANGUAGE_LABELS, MemberSummary, POLICY_LABELS, Paged, navigateCommunity } from '../../lib/community';
import { formatDate } from '../../lib/text';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FeedSection } from './FeedSection';
import { ActionMenu } from './PostCard';
import {
  Avatar,
  Card,
  CommunityIcon,
  EmptyState,
  Loading,
  MemberName,
  MembershipButton,
  Pills,
  ReportModal,
  SectionTitle,
  VisibilityBadge,
  errorMessage,
  inputClass,
} from './ui';

interface MembershipRow {
  membershipId: string;
  status: string;
  role: 'member' | 'moderator';
  joinedAt: string | null;
  requestedAt: string;
  requestMessage: string | null;
  member: MemberSummary;
}

/** Page d'une communauté : discussions, membres, règles, et outils des modérateurs. */
export const CommunityDetailView: React.FC<{ slug: string; section?: string }> = ({ slug, section = 'discussions' }) => {
  const { user, requireAuth } = useAuth();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    api
      .get<CommunityDetail>(`/community/communities/${slug}`)
      .then(setCommunity)
      .catch((err) => setError(errorMessage(err, 'Communauté introuvable.')));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load, user?.id]);

  if (error) {
    return (
      <Card>
        <EmptyState icon={<Lock className="w-10 h-10" />} text={error} action={{ label: 'Voir le répertoire des communautés', onClick: () => navigateCommunity('communities') }} />
      </Card>
    );
  }
  if (!community) return <Loading label="Chargement de la communauté..." />;

  const go = (next: string) => navigateCommunity(`c/${slug}${next === 'discussions' ? '' : `/${next}`}`);
  const sections = [
    { id: 'discussions', label: 'Discussions' },
    { id: 'membres', label: `Membres (${community.membersCount})` },
    { id: 'a-propos', label: 'À propos & règles' },
    ...(community.isModerator ? [{ id: 'requests', label: "Demandes d'adhésion", count: community.pendingRequests }, { id: 'gestion', label: 'Gestion des membres' }] : []),
  ];

  const onMembershipChange = (updated: CommunitySummary) => {
    setCommunity({ ...community, ...updated });
    load();
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigateCommunity('communities')} className="text-xs font-semibold text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> Toutes les communautés
      </button>

      {/* En-tête */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#030d21] via-[#051536] to-[#040f29] text-white shadow-xl border border-slate-800">
        {community.coverImage && (
          <img
            src={community.coverImage}
            alt=""
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#051126]/95 via-[#071738]/80 to-transparent" />
        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <CommunityIcon name={community.icon} className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {community.category && <span className="text-[11px] font-black tracking-widest text-slate-300 uppercase">{community.category.name}</span>}
                <VisibilityBadge visibility={community.visibility} />
                {community.status === 'archived' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">Archivée</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight">{community.name}</h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">{community.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {community.membersCount} membres
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> {community.postsCount} discussions
                </span>
                <span className="inline-flex items-center gap-1">
                  <Languages className="w-3.5 h-3.5" /> {community.languages.map((l) => LANGUAGE_LABELS[l] ?? l).join(', ')}
                </span>
                {community.scope && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {community.scope}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <MembershipButton community={community} onChange={onMembershipChange} size="md" />
            <span className="text-[11px] text-slate-400">{POLICY_LABELS[community.membershipPolicy]}</span>
            {user && (
              <button onClick={() => setReporting(true)} className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer">
                <Flag className="w-3 h-3" /> Signaler la communauté
              </button>
            )}
          </div>
        </div>
      </div>

      <Pills options={sections} value={section} onChange={go} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          {section === 'discussions' &&
            (community.canViewContent ? (
              <FeedSection
                title={`Discussions — ${community.name}`}
                community={{ id: community.id, slug: community.slug, canPublish: community.canPublish }}
                emptyText="Aucune discussion pour le moment : lancez la première !"
              />
            ) : (
              <LockedContent community={community} onJoin={onMembershipChange} />
            ))}
          {section === 'membres' && (community.canViewContent ? <MembersList community={community} status="active" /> : <LockedContent community={community} onJoin={onMembershipChange} />)}
          {section === 'a-propos' && (
            <Card>
              <SectionTitle title="À propos" />
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{community.description}</p>
              <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 rounded-xl p-3">
                  <dt className="text-slate-500">Visibilité</dt>
                  <dd className="font-bold text-slate-900 mt-0.5">
                    {community.visibility === 'public'
                      ? 'Publique : discussions lisibles par tous'
                      : community.visibility === 'restricted'
                        ? 'Restreinte : discussions réservées aux membres'
                        : 'Privée : invisible hors membres et invités'}
                  </dd>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <dt className="text-slate-500">Adhésion</dt>
                  <dd className="font-bold text-slate-900 mt-0.5">{POLICY_LABELS[community.membershipPolicy]}</dd>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <dt className="text-slate-500">Créée le</dt>
                  <dd className="font-bold text-slate-900 mt-0.5">{formatDate(community.createdAt)}</dd>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <dt className="text-slate-500">Langues</dt>
                  <dd className="font-bold text-slate-900 mt-0.5">{community.languages.map((l) => LANGUAGE_LABELS[l] ?? l).join(', ')}</dd>
                </div>
              </dl>
              <h4 className="mt-6 text-sm font-bold text-slate-900">Règles de la communauté</h4>
              <p className="mt-2 text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 border border-slate-200 rounded-xl p-4">
                {community.rules ?? 'Les règles générales de QIAO Community s’appliquent.'}
              </p>
            </Card>
          )}
          {section === 'requests' && community.isModerator && <RequestsPanel community={community} onDecision={load} />}
          {section === 'gestion' && community.isModerator && <ManagementPanel community={community} onChange={load} />}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <SectionTitle title="Modérateurs" />
            {community.moderators.length === 0 ? (
              <p className="text-xs text-slate-400">Communauté modérée par l'équipe QIAO.</p>
            ) : (
              <div className="space-y-3">
                {community.moderators.map((moderator) => (
                  <div key={moderator.id} className="flex items-center gap-2.5">
                    <Avatar src={moderator.avatarUrl} name={moderator.fullName} className="w-9 h-9 border border-slate-200" />
                    <div className="min-w-0">
                      <MemberName member={moderator} className="text-xs font-bold text-slate-900" />
                      <p className="text-[10px] text-slate-500 truncate">{moderator.headline}</p>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <SectionTitle title="Règles en bref" />
            <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line line-clamp-6">{community.rules ?? 'Les règles générales de QIAO Community s’appliquent.'}</p>
            <button onClick={() => go('a-propos')} className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
              Lire toutes les règles
            </button>
          </Card>
          {!user && (
            <Card className="text-center">
              <p className="text-xs text-slate-600 mb-3">Un compte QIAO suffit pour rejoindre les communautés, poser vos questions et contacter les experts.</p>
              <button onClick={() => requireAuth(() => load())} className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer">
                Se connecter / S'inscrire
              </button>
            </Card>
          )}
        </div>
      </div>

      {reporting && <ReportModal target={{ type: 'community', id: community.id, label: community.name }} onClose={() => setReporting(false)} />}
    </div>
  );
};

const LockedContent: React.FC<{ community: CommunityDetail; onJoin: (c: CommunitySummary) => void }> = ({ community, onJoin }) => (
  <Card className="text-center py-10">
    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
      <Lock className="w-6 h-6" />
    </div>
    <h3 className="text-base font-bold text-slate-900">Contenu réservé aux membres</h3>
    <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto">
      Les discussions et la liste des membres de « {community.name} » sont visibles uniquement par ses membres
      {community.membershipPolicy === 'approval' ? ', après validation par un modérateur' : ''}.
    </p>
    {community.membership.state === 'pending' && (
      <p className="mt-3 text-xs font-semibold text-amber-700">Votre demande est en attente de validation.</p>
    )}
    <div className="mt-4 flex justify-center">
      <MembershipButton community={community} onChange={onJoin} size="md" />
    </div>
  </Card>
);

const MembersList: React.FC<{ community: CommunityDetail; status: 'active' | 'invited' | 'banned'; manage?: boolean; onChange?: () => void }> = ({
  community,
  status,
  manage,
  onChange,
}) => {
  const { user } = useAuth();
  const { notify } = useToast();
  const [rows, setRows] = useState<MembershipRow[] | null>(null);
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    api
      .get<Paged<MembershipRow>>(`/community/communities/${community.slug}/members`, { status, q: q || undefined, limit: 50 })
      .then((page) => setRows(page.items))
      .catch((err) => {
        notify(errorMessage(err), 'error');
        setRows([]);
      });
  }, [community.slug, status, q, notify]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const act = async (row: MembershipRow, action: 'remove' | 'ban' | 'unban' | 'promote' | 'demote') => {
    const labels = { remove: 'Retirer', ban: 'Exclure', unban: 'Lever l’exclusion de', promote: 'Nommer modérateur', demote: 'Retirer le rôle de modérateur à' };
    const reason = action === 'remove' || action === 'ban' ? window.prompt(`${labels[action]} ${row.member.fullName} — motif communiqué au membre :`) : '';
    if (reason === null) return;
    try {
      await api.post(`/community/communities/${community.slug}/members/${row.membershipId}/action`, { action, reason: reason || undefined });
      notify('Décision enregistrée.');
      load();
      onChange?.();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  return (
    <Card>
      <SectionTitle title={status === 'active' ? 'Membres' : status === 'invited' ? 'Invitations en attente' : 'Membres exclus'} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un membre..." className={`${inputClass} mb-4`} />
      {rows === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">Aucun membre dans cette liste.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.membershipId} className="py-3 flex items-center gap-3">
              <Avatar src={row.member.avatarUrl} name={row.member.fullName} className="w-10 h-10 border border-slate-200" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <MemberName member={row.member} className="text-sm font-bold text-slate-900" />
                  {row.role === 'moderator' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Modérateur</span>}
                  {row.member.isExpert && !row.member.expertVerified && <span className="text-[10px] text-slate-400">Professionnel</span>}
                </div>
                <p className="text-[11px] text-slate-500 truncate">{[row.member.headline, row.member.location].filter(Boolean).join(' • ')}</p>
                {row.joinedAt && status === 'active' && <p className="text-[10px] text-slate-400">Membre depuis le {formatDate(row.joinedAt)}</p>}
              </div>
              {manage && row.member.id !== user?.id && (
                <ActionMenu
                  items={[
                    status === 'active' && { label: 'Retirer de la communauté', icon: UserMinus, onClick: () => act(row, 'remove') },
                    status === 'active' && { label: 'Exclure (bannir)', icon: X, onClick: () => act(row, 'ban'), danger: true },
                    status === 'banned' && { label: "Lever l'exclusion", icon: Check, onClick: () => act(row, 'unban') },
                    status === 'active' && user?.role === 'admin' && row.role === 'member' && { label: 'Nommer modérateur', icon: ShieldCheck, onClick: () => act(row, 'promote') },
                    status === 'active' && user?.role === 'admin' && row.role === 'moderator' && { label: 'Retirer le rôle de modérateur', icon: UserMinus, onClick: () => act(row, 'demote') },
                  ]}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

const RequestsPanel: React.FC<{ community: CommunityDetail; onDecision: () => void }> = ({ community, onDecision }) => {
  const { notify } = useToast();
  const [rows, setRows] = useState<MembershipRow[] | null>(null);
  const load = useCallback(() => {
    api
      .get<Paged<MembershipRow>>(`/community/communities/${community.slug}/members`, { status: 'pending', limit: 50 })
      .then((page) => setRows(page.items))
      .catch(() => setRows([]));
  }, [community.slug]);
  useEffect(() => load(), [load]);

  const decide = async (row: MembershipRow, decision: 'approve' | 'reject') => {
    try {
      await api.post(`/community/communities/${community.slug}/requests/${row.membershipId}`, { decision });
      notify(decision === 'approve' ? `${row.member.fullName} est maintenant membre.` : 'Demande refusée.');
      load();
      onDecision();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  return (
    <Card>
      <SectionTitle title="Demandes d'adhésion en attente" />
      {rows === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState icon={<Check className="w-10 h-10" />} text="Aucune demande en attente." />
      ) : (
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.membershipId} className="py-4 flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Avatar src={row.member.avatarUrl} name={row.member.fullName} className="w-10 h-10 border border-slate-200" />
                <div className="min-w-0">
                  <MemberName member={row.member} className="text-sm font-bold text-slate-900" />
                  <p className="text-[11px] text-slate-500">{[row.member.headline, row.member.location].filter(Boolean).join(' • ')}</p>
                  {row.requestMessage && <p className="mt-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5">« {row.requestMessage} »</p>}
                  <p className="text-[10px] text-slate-400 mt-1">Demande du {formatDate(row.requestedAt)}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => decide(row, 'approve')} className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Accepter
                </button>
                <button onClick={() => decide(row, 'reject')} className="px-4 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer">
                  Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

const ManagementPanel: React.FC<{ community: CommunityDetail; onChange: () => void }> = ({ community, onChange }) => {
  const { notify } = useToast();
  const [member, setMember] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'active' | 'invited' | 'banned'>('active');
  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await api.post<{ invited: string }>(`/community/communities/${community.slug}/invitations`, { member });
      notify(`Invitation envoyée à ${result.invited}.`);
      setMember('');
      onChange();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle title="Inviter un membre" />
        <form onSubmit={invite} className="flex flex-col sm:flex-row gap-2">
          <input value={member} onChange={(e) => setMember(e.target.value)} required placeholder="@identifiant ou adresse e-mail exacte" className={inputClass} />
          <button disabled={busy} className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5 disabled:opacity-60 shrink-0">
            <UserPlus className="w-3.5 h-3.5" /> Inviter
          </button>
        </form>
        <p className="text-[11px] text-slate-400 mt-2">Le membre reçoit une notification et choisit d'accepter ou non l'invitation.</p>
      </Card>
      <Pills
        options={[
          { id: 'active', label: 'Membres actifs' },
          { id: 'invited', label: 'Invités' },
          { id: 'banned', label: 'Exclus' },
        ]}
        value={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />
      <MembersList key={tab} community={community} status={tab} manage onChange={onChange} />
    </div>
  );
};
