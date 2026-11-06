import React, { useCallback, useEffect, useState } from 'react';
import { JoinedList } from '../common/JoinedList';
import { ArrowLeft, Ban, Briefcase, Building2, CalendarDays, Flag, Languages, Lock, Mail, MapPin, Pencil, ShieldCheck, UserCheck, UserPlus } from 'lucide-react';
import { ServiceRequestModal } from '../payments/ServiceRequestModal';
import { api, ApiError } from '../../lib/api';
import { LANGUAGE_LABELS, MESSAGE_RESTRICTIONS, MemberProfileView as Profile, navigateCommunity } from '../../lib/community';
import { formatDate } from '../../lib/text';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FeedSection } from './FeedSection';
import { ActionMenu } from './PostCard';
import { Avatar, Card, EmptyState, Loading, ReportModal, SectionTitle, VerifiedBadge, errorMessage } from './ui';

const VERIFICATION_TEXT: Record<string, string> = {
  verified: 'Profil professionnel vérifié par QIAO',
  pending: 'Vérification en cours par QIAO',
  none: 'Informations déclarées par le membre (non vérifiées par QIAO)',
  rejected: 'Informations déclarées par le membre (non vérifiées par QIAO)',
};

/** Profil Community d'un membre : seules les informations autorisées par ses paramètres de confidentialité sont renvoyées par l'API. */
export const MemberProfileView: React.FC<{ handle: string }> = ({ handle }) => {
  const { user, requireAuth } = useAuth();
  const { notify } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [reporting, setReporting] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    api
      .get<Profile>(`/community/members/${handle}`)
      .then(setProfile)
      .catch((err) => setError({ status: err instanceof ApiError ? err.status : 0, message: errorMessage(err, 'Membre introuvable.') }));
  }, [handle]);

  useEffect(() => {
    load();
  }, [load, user?.id]);

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <EmptyState
          icon={<Lock className="w-10 h-10" />}
          text={error.message}
          action={error.status === 401 ? { label: 'Se connecter', onClick: () => requireAuth(load) } : { label: 'Retour', onClick: () => navigateCommunity('home') }}
        />
      </Card>
    );
  }
  if (!profile) return <Loading label="Chargement du profil..." />;

  const rel = profile.relationship;

  const follow = () =>
    requireAuth(async () => {
      try {
        const result = await api.post<{ following: boolean; followers: number }>(`/community/members/${handle}/follow`);
        setProfile({ ...profile, relationship: { ...rel, isFollowing: result.following }, stats: { ...profile.stats, followers: result.followers } });
        notify(result.following ? `Vous suivez ${profile.fullName}.` : `Vous ne suivez plus ${profile.fullName}.`);
      } catch (err) {
        notify(errorMessage(err), 'error');
      }
    }, 'Connectez-vous pour suivre ce membre.');

  const toggleBlock = async () => {
    if (!rel.blocked && !window.confirm(`Bloquer ${profile.fullName} ? Vous ne pourrez plus échanger, et ses contenus seront masqués pour vous.`)) return;
    try {
      if (rel.blocked) await api.delete(`/community/members/${handle}/block`);
      else await api.post(`/community/members/${handle}/block`);
      notify(rel.blocked ? 'Membre débloqué.' : 'Membre bloqué.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const message = () =>
    requireAuth(() => navigateCommunity(`messages/new?to=${handle}&context=profile`), 'Connectez-vous pour écrire à ce membre.');

  return (
    <div className="space-y-6">
      <button
        onClick={() => (window.history.length > 1 ? window.history.back() : navigateCommunity('home'))}
        className="text-xs font-semibold text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Retour
      </button>

      {/* En-tête du profil */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="h-24 sm:h-32 bg-gradient-to-r from-[#030d21] via-[#051536] to-[#0c2a5c]" />
        <div className="px-5 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 sm:-mt-12">
            <div className="flex items-end gap-4">
              <Avatar src={profile.avatarUrl} name={profile.fullName} className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-white shadow-md !text-xl" />
              <div className="pb-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-1.5">
                  {profile.fullName}
                  {profile.expertVerified && <VerifiedBadge className="w-5 h-5" />}
                </h1>
                <p className="text-xs text-slate-500">@{profile.handle}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {rel.isSelf ? (
                <button
                  onClick={() => navigateCommunity('settings')}
                  className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Modifier mon profil
                </button>
              ) : (
                <>
                  {!rel.blocked && !profile.suspended && (
                    <button
                      onClick={follow}
                      className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 ${
                        rel.isFollowing ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                      }`}
                    >
                      {rel.isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      {rel.isFollowing ? 'Suivi' : 'Suivre'}
                    </button>
                  )}
                  {profile.expert && !rel.blocked && !profile.suspended && (
                    <button
                      onClick={() => requireAuth(() => setRequesting(true), 'Connectez-vous pour demander une prestation.')}
                      className="px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Demander une prestation
                    </button>
                  )}
                  <button
                    onClick={message}
                    disabled={!!user && !rel.canMessage}
                    title={user && !rel.canMessage ? MESSAGE_RESTRICTIONS[rel.messageRestriction ?? ''] : undefined}
                    className="px-4 py-2 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Mail className="w-3.5 h-3.5" /> Message
                  </button>
                  {user && (
                    <ActionMenu
                      items={[
                        { label: rel.blocked ? 'Débloquer' : 'Bloquer', icon: Ban, onClick: toggleBlock, danger: !rel.blocked },
                        { label: 'Signaler le profil', icon: Flag, onClick: () => setReporting(true) },
                      ]}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {profile.headline && <p className="mt-4 text-sm font-semibold text-slate-800">{profile.headline}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            {profile.company && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {profile.company}
              </span>
            )}
            {(profile.city || profile.country) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> <JoinedList items={[profile.city, profile.country]} />
              </span>
            )}
            {profile.languages && profile.languages.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Languages className="w-3.5 h-3.5" /> <JoinedList items={profile.languages.map((l) => LANGUAGE_LABELS[l] ?? l)} />
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> Membre depuis {formatDate(profile.memberSince)}
            </span>
            {profile.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {profile.email}
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center gap-6 text-xs">
            <span>
              <strong className="text-slate-900 text-sm">{profile.stats.followers}</strong> <span className="text-slate-500">abonnés</span>
            </span>
            <span>
              <strong className="text-slate-900 text-sm">{profile.stats.following}</strong> <span className="text-slate-500">abonnements</span>
            </span>
            <span>
              <strong className="text-slate-900 text-sm">{profile.stats.posts}</strong> <span className="text-slate-500">publications</span>
            </span>
            {rel.followsYou && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">Vous suit</span>}
          </div>
          {profile.suspended && (
            <p className="mt-3 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Ce compte est actuellement suspendu.</p>
          )}
          {user && !rel.isSelf && !rel.canMessage && rel.messageRestriction && MESSAGE_RESTRICTIONS[rel.messageRestriction] && (
            <p className="mt-3 text-[11px] text-slate-500">{MESSAGE_RESTRICTIONS[rel.messageRestriction]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {profile.bio && (
            <Card>
              <SectionTitle title="À propos" />
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{profile.bio}</p>
            </Card>
          )}
          {profile.showActivity ? (
            <FeedSection title={`Publications de ${profile.fullName.split(' ')[0]}`} author={handle} compactFilters emptyText="Aucune publication visible pour le moment." />
          ) : (
            <Card>
              <EmptyState icon={<Lock className="w-10 h-10" />} text="Ce membre a choisi de ne pas afficher son activité." />
            </Card>
          )}
        </div>
        <div className="lg:col-span-4 space-y-6">
          {profile.expert && (
            <Card>
              <SectionTitle title="Expertise professionnelle" />
              <p className="text-sm font-semibold text-slate-900">{profile.expert.headline}</p>
              <div
                className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  profile.expert.verificationStatus === 'verified' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                <ShieldCheck className="w-3 h-3" /> {VERIFICATION_TEXT[profile.expert.verificationStatus]}
                {profile.expert.verifiedAt ? ` · ${formatDate(profile.expert.verifiedAt)}` : ''}
              </div>
              {profile.expert.biography && <p className="mt-3 text-xs text-slate-600 leading-relaxed whitespace-pre-line">{profile.expert.biography}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.expert.categories.map((c) => (
                  <span key={c.id} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    {c.name}
                  </span>
                ))}
              </div>
              <dl className="mt-3 space-y-1.5 text-xs text-slate-600">
                {profile.expert.countriesServed.length > 0 && (
                  <div className="flex gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" /> Intervient en : <JoinedList items={profile.expert.countriesServed} />
                  </div>
                )}
                {profile.expert.yearsExperience !== null && (
                  <div className="flex gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" /> {profile.expert.yearsExperience} ans d'expérience
                  </div>
                )}
              </dl>
              <p className="mt-3 text-[10px] text-slate-400 leading-relaxed">
                Ce profil décrit l'expertise d'un membre. Ce n'est ni une offre de service QIAO ni une recommandation : prenez contact directement.
              </p>
            </Card>
          )}
          {profile.sectors.length > 0 && (
            <Card>
              <SectionTitle title="Secteurs" />
              <div className="flex flex-wrap gap-1.5">
                {profile.sectors.map((s) => (
                  <span key={s.id} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    {s.name}
                  </span>
                ))}
                {profile.interests.map((i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {i}
                  </span>
                ))}
              </div>
            </Card>
          )}
          {profile.communities && (
            <Card>
              <SectionTitle title="Communautés" />
              {profile.communities.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune communauté visible.</p>
              ) : (
                <div className="space-y-2">
                  {profile.communities.map((c) => (
                    <button key={c.id} onClick={() => navigateCommunity(`c/${c.slug}`)} className="w-full flex items-center justify-between text-left text-xs group cursor-pointer">
                      <span className="font-semibold text-slate-800 group-hover:text-red-600">{c.name}</span>
                      {c.role === 'moderator' && <span className="text-[10px] font-bold text-emerald-700">Modérateur</span>}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {reporting && profile && <ReportModal target={{ type: 'user', id: profile.id, label: profile.fullName }} onClose={() => setReporting(false)} />}
      {requesting && profile.handle && (
        <ServiceRequestModal provider={{ handle: profile.handle, fullName: profile.fullName }} onClose={() => setRequesting(false)} />
      )}
    </div>
  );
};
