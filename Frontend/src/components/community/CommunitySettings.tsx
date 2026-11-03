import React, { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Bell, KeyRound, Link2, Loader2, LogOut, MessageCircle, Monitor, Save, ShieldCheck, Trash2, UserCircle, Briefcase, Lock } from 'lucide-react';
import { api } from '../../lib/api';
import { User } from '../../lib/models';
import { COUNTRIES, FieldVisibility, LANGUAGE_LABELS, MyProfile, PrivacySettings, navigateCommunity } from '../../lib/community';
import { formatDate, timeAgo } from '../../lib/text';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { startOAuth } from '../Modals/AuthModal';
import { Avatar, Card, EmptyState, Field, Loading, MultiSelect, Pills, SectionTitle, errorMessage, inputClass, useCategories } from './ui';
import { WechatMessagingCard } from './WechatMessagingCard';

const SECTIONS = [
  { id: 'profil', label: 'Profil', icon: UserCircle },
  { id: 'expertise', label: 'Expertise', icon: Briefcase },
  { id: 'confidentialite', label: 'Confidentialité', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'wechat', label: 'WeChat', icon: MessageCircle },
  { id: 'securite', label: 'Comptes & sécurité', icon: KeyRound },
];

const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_LABELS)
  .filter(([code]) => code !== 'other')
  .map(([id, label]) => ({ id, label }));

const SaveButton: React.FC<{ busy: boolean; label?: string }> = ({ busy, label = 'Enregistrer' }) => (
  <button disabled={busy} className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60">
    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {label}
  </button>
);

/** Paramètres Community du membre (profil, expertise, confidentialité appliquée côté serveur, notifications, sécurité). */
export const CommunitySettings: React.FC<{ section?: string }> = ({ section = 'profil' }) => {
  const { user, requireAuth } = useAuth();
  const [profile, setProfile] = useState<MyProfile | null>(null);

  const load = useCallback(() => {
    api.get<MyProfile>('/community/me/profile').then(setProfile).catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (!user) {
    return (
      <Card>
        <EmptyState icon={<Lock className="w-10 h-10" />} text="Connectez-vous pour gérer votre profil Community." action={{ label: 'Se connecter', onClick: () => requireAuth(() => undefined) }} />
      </Card>
    );
  }
  if (!profile) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={profile.avatarUrl} name={profile.fullName} className="w-12 h-12 border border-slate-200" />
          <div>
            <h2 className="text-lg font-black text-slate-900">Paramètres de mon profil</h2>
            <button onClick={() => navigateCommunity(`member/${profile.handle}`)} className="text-xs text-blue-600 hover:underline cursor-pointer">
              Voir mon profil public (@{profile.handle})
            </button>
          </div>
        </div>
      </div>
      <Pills options={SECTIONS.map(({ id, label }) => ({ id, label }))} value={section} onChange={(id) => navigateCommunity(`settings/${id}`, { replace: true })} />
      {section === 'profil' && <ProfileForm profile={profile} onSaved={setProfile} />}
      {section === 'expertise' && <ExpertForm profile={profile} onSaved={setProfile} />}
      {section === 'confidentialite' && <PrivacyForm profile={profile} onSaved={setProfile} />}
      {section === 'notifications' && <NotificationsForm profile={profile} onSaved={setProfile} />}
      {section === 'wechat' && <WechatMessagingCard />}
      {section === 'securite' && <SecurityPanel />}
    </div>
  );
};

// --- Profil -------------------------------------------------------------------------------------

const ProfileForm: React.FC<{ profile: MyProfile; onSaved: (p: MyProfile) => void }> = ({ profile, onSaved }) => {
  const { notify } = useToast();
  const { refreshUser } = useAuth();
  const { professionalCategories } = useCategories();
  const [form, setForm] = useState({
    fullName: profile.fullName,
    handle: profile.handle ?? '',
    headline: profile.headline ?? '',
    company: profile.company ?? '',
    country: profile.country ?? '',
    city: profile.city ?? '',
    avatarUrl: profile.avatarUrl ?? '',
    bio: profile.bio ?? '',
    languages: profile.languages,
    sectors: profile.sectors,
    interests: profile.interests.join(', '),
  });
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const saved = await api.patch<MyProfile>('/community/me/profile', {
        ...form,
        interests: form.interests
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean),
      });
      onSaved(saved);
      await refreshUser();
      notify('Profil enregistré.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom affiché">
            <input value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} required minLength={2} className={inputClass} />
          </Field>
          <Field label="Identifiant (@)" hint="Utilisé pour votre adresse de profil et les mentions.">
            <input value={form.handle} onChange={(e) => set({ handle: e.target.value.toLowerCase() })} className={inputClass} />
          </Field>
          <Field label="Titre professionnel">
            <input value={form.headline} onChange={(e) => set({ headline: e.target.value })} maxLength={160} placeholder="Ex : Directeur import-export" className={inputClass} />
          </Field>
          <Field label="Entreprise / organisation">
            <input value={form.company} onChange={(e) => set({ company: e.target.value })} maxLength={160} className={inputClass} />
          </Field>
          <Field label="Pays">
            <select value={form.country} onChange={(e) => set({ country: e.target.value })} className={inputClass}>
              <option value="">—</option>
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Ville">
            <input value={form.city} onChange={(e) => set({ city: e.target.value })} maxLength={80} className={inputClass} />
          </Field>
        </div>
        <Field label="Photo de profil (adresse https://)">
          <input value={form.avatarUrl} onChange={(e) => set({ avatarUrl: e.target.value })} placeholder="https://..." className={inputClass} />
        </Field>
        <Field label="Présentation">
          <textarea rows={4} maxLength={2000} value={form.bio} onChange={(e) => set({ bio: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Langues parlées">
          <MultiSelect options={LANGUAGE_OPTIONS} value={form.languages} onChange={(languages) => set({ languages })} />
        </Field>
        <Field label="Secteurs professionnels" hint="Utilisés pour vous recommander des communautés et des membres.">
          <MultiSelect options={professionalCategories.map((c) => ({ id: c.id, label: c.name }))} value={form.sectors} onChange={(sectors) => set({ sectors })} max={8} />
        </Field>
        <Field label="Centres d'intérêt (séparés par des virgules)">
          <input value={form.interests} onChange={(e) => set({ interests: e.target.value })} placeholder="Sourcing, Huile d'olive, Énergie solaire" className={inputClass} />
        </Field>
        <div className="flex justify-end">
          <SaveButton busy={busy} />
        </div>
      </form>
    </Card>
  );
};

// --- Expertise ----------------------------------------------------------------------------------

const VERIFICATION_STATUS: Record<string, { label: string; tone: string }> = {
  none: { label: 'Non vérifié (déclaratif)', tone: 'bg-slate-50 text-slate-600 border-slate-200' },
  pending: { label: 'Vérification en cours', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  verified: { label: 'Vérifié par QIAO', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  rejected: { label: 'Vérification refusée', tone: 'bg-red-50 text-red-700 border-red-200' },
};

const ExpertForm: React.FC<{ profile: MyProfile; onSaved: (p: MyProfile) => void }> = ({ profile, onSaved }) => {
  const { notify } = useToast();
  const { professionalCategories } = useCategories();
  const expert = profile.expert;
  const [enabled, setEnabled] = useState(!!expert);
  const [form, setForm] = useState({
    headline: expert?.headline ?? profile.headline ?? '',
    biography: expert?.biography ?? '',
    categories: expert?.categories ?? [],
    countriesServed: expert?.countriesServed ?? [],
    languages: expert?.languages ?? profile.languages,
    yearsExperience: expert?.yearsExperience?.toString() ?? '',
    listed: expert?.listed ?? true,
  });
  const [evidence, setEvidence] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const saved = await api.put<MyProfile>('/community/me/expert', {
        ...form,
        yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined,
      });
      onSaved(saved);
      notify('Profil professionnel enregistré.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Retirer votre profil professionnel de l’annuaire des experts ?')) return;
    try {
      onSaved(await api.delete<MyProfile>('/community/me/expert'));
      setEnabled(false);
      notify('Profil professionnel retiré.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const requestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onSaved(await api.post<MyProfile>('/community/me/expert/verification', { evidence }));
      setEvidence('');
      notify('Demande de vérification envoyée à l’équipe QIAO.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  if (!enabled) {
    return (
      <Card className="text-center py-10">
        <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Vous êtes avocat, transitaire, traducteur, consultant... ?</h3>
        <p className="mt-1 text-xs text-slate-600 max-w-lg mx-auto">
          Créez votre profil professionnel pour apparaître dans l'annuaire des experts et recevoir des questions. Le statut d'expert ne donne aucun droit
          d'administration ; la vérification par QIAO est une démarche distincte.
        </p>
        <button onClick={() => setEnabled(true)} className="mt-4 px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer">
          Créer mon profil professionnel
        </button>
      </Card>
    );
  }

  const status = VERIFICATION_STATUS[expert?.verificationStatus ?? 'none'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <Card className="lg:col-span-8">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Titre professionnel">
            <input value={form.headline} onChange={(e) => set({ headline: e.target.value })} required minLength={5} maxLength={160} placeholder="Ex : Avocate en droit commercial — Barreau de Tunis" className={inputClass} />
          </Field>
          <Field label="Catégories professionnelles (4 max.)">
            <MultiSelect options={professionalCategories.map((c) => ({ id: c.id, label: c.name }))} value={form.categories} onChange={(categories) => set({ categories })} max={4} />
          </Field>
          <Field label="Pays d'intervention">
            <MultiSelect options={COUNTRIES.map((c) => ({ id: c, label: c }))} value={form.countriesServed} onChange={(countriesServed) => set({ countriesServed })} />
          </Field>
          <Field label="Langues de travail">
            <MultiSelect options={LANGUAGE_OPTIONS} value={form.languages} onChange={(languages) => set({ languages })} />
          </Field>
          <Field label="Années d'expérience">
            <input type="number" min={0} max={60} value={form.yearsExperience} onChange={(e) => set({ yearsExperience: e.target.value })} className={`${inputClass} max-w-32`} />
          </Field>
          <Field label="Présentation professionnelle">
            <textarea rows={4} maxLength={3000} value={form.biography} onChange={(e) => set({ biography: e.target.value })} className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer">
            <input type="checkbox" checked={form.listed} onChange={(e) => set({ listed: e.target.checked })} className="accent-red-600" />
            Apparaître dans l'annuaire des experts
          </label>
          <div className="flex items-center justify-between gap-2">
            {expert ? (
              <button type="button" onClick={remove} className="text-xs font-semibold text-slate-500 hover:text-red-600 cursor-pointer inline-flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Retirer mon profil professionnel
              </button>
            ) : (
              <span />
            )}
            <SaveButton busy={busy} />
          </div>
        </form>
      </Card>
      <Card className="lg:col-span-4">
        <SectionTitle title="Vérification QIAO" />
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${status.tone}`}>
          <BadgeCheck className="w-3.5 h-3.5" /> {status.label}
        </span>
        {expert?.verificationNote && <p className="mt-2 text-[11px] text-slate-600">{expert.verificationNote}</p>}
        <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
          Le badge « Vérifié par QIAO » n'apparaît qu'après examen de vos justificatifs par un administrateur. Modifier vos catégories impose une nouvelle vérification.
        </p>
        {expert && ['none', 'rejected'].includes(expert.verificationStatus) && (
          <form onSubmit={requestVerification} className="mt-4 space-y-2">
            <textarea
              rows={4}
              required
              minLength={20}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Numéro d'inscription (barreau, ordre, registre), diplôme, références vérifiables..."
              className={inputClass}
            />
            <button className="w-full px-4 py-2 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold cursor-pointer">Demander la vérification</button>
          </form>
        )}
        {!expert && <p className="mt-3 text-[11px] text-slate-400">Enregistrez d'abord votre profil professionnel.</p>}
      </Card>
    </div>
  );
};

// --- Confidentialité --------------------------------------------------------------------------------

const FIELD_LABELS: { key: keyof PrivacySettings; label: string }[] = [
  { key: 'company', label: 'Entreprise' },
  { key: 'location', label: 'Ville et pays' },
  { key: 'bio', label: 'Présentation' },
  { key: 'languages', label: 'Langues' },
  { key: 'communities', label: 'Communautés rejointes' },
  { key: 'activity', label: 'Publications et questions' },
  { key: 'email', label: 'Adresse e-mail' },
];

const PrivacyForm: React.FC<{ profile: MyProfile; onSaved: (p: MyProfile) => void }> = ({ profile, onSaved }) => {
  const { notify } = useToast();
  const [privacy, setPrivacy] = useState<PrivacySettings>(profile.privacy);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      onSaved(await api.patch<MyProfile>('/community/me/privacy', privacy));
      notify('Paramètres de confidentialité enregistrés.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const unblock = async (handle: string | null) => {
    if (!handle) return;
    try {
      await api.delete(`/community/members/${handle}/block`);
      onSaved(await api.get<MyProfile>('/community/me/profile'));
      notify('Membre débloqué.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const visibilitySelect = (key: keyof PrivacySettings) => (
    <select
      value={privacy[key] as FieldVisibility}
      onChange={(e) => setPrivacy({ ...privacy, [key]: e.target.value })}
      className="rounded-xl border border-slate-200 p-2 text-xs bg-white focus:outline-none focus:border-red-500"
    >
      <option value="public">Tout le monde</option>
      <option value="members">Membres connectés</option>
      <option value="private">Moi uniquement</option>
    </select>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <Card className="lg:col-span-8">
        <form onSubmit={submit} className="space-y-5">
          <p className="text-[11px] text-slate-500">Ces règles sont appliquées par le serveur : un champ masqué n'est jamais transmis aux personnes non autorisées.</p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-800">Qui peut voir mon profil</span>
            <select
              value={privacy.profile}
              onChange={(e) => setPrivacy({ ...privacy, profile: e.target.value as 'public' | 'members' })}
              className="rounded-xl border border-slate-200 p-2 text-xs bg-white focus:outline-none focus:border-red-500"
            >
              <option value="public">Tout le monde</option>
              <option value="members">Membres connectés uniquement</option>
            </select>
          </div>
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {FIELD_LABELS.map(({ key, label }) => (
              <div key={key} className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-700">{label}</span>
                {visibilitySelect(key)}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-800">Qui peut m'envoyer un message privé</span>
            <select
              value={privacy.messages}
              onChange={(e) => setPrivacy({ ...privacy, messages: e.target.value as PrivacySettings['messages'] })}
              className="rounded-xl border border-slate-200 p-2 text-xs bg-white focus:outline-none focus:border-red-500"
            >
              <option value="everyone">Tous les membres</option>
              <option value="connections">Membres de mes communautés et personnes que je suis</option>
              <option value="nobody">Personne (nouvelles conversations bloquées)</option>
            </select>
          </div>
          <div className="flex justify-end">
            <SaveButton busy={busy} />
          </div>
        </form>
      </Card>
      <Card className="lg:col-span-4">
        <SectionTitle title="Membres bloqués" />
        {profile.blocked.length === 0 ? (
          <p className="text-xs text-slate-400">Aucun membre bloqué.</p>
        ) : (
          <div className="space-y-3">
            {profile.blocked.map((member) => (
              <div key={member.id} className="flex items-center gap-2.5">
                <Avatar src={member.avatarUrl} name={member.fullName} className="w-8 h-8" />
                <span className="flex-1 text-xs font-semibold text-slate-800 truncate">{member.fullName}</span>
                <button onClick={() => unblock(member.handle)} className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer">
                  Débloquer
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// --- Notifications ------------------------------------------------------------------------------------

const NotificationsForm: React.FC<{ profile: MyProfile; onSaved: (p: MyProfile) => void }> = ({ profile, onSaved }) => {
  const { notify } = useToast();
  const [prefs, setPrefs] = useState(profile.notificationPrefs);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      onSaved(await api.patch<MyProfile>('/community/me/notification-prefs', { prefs }));
      notify('Préférences de notification enregistrées.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-[11px] text-slate-500">
          Notifications affichées dans la cloche QIAO. L'envoi par e-mail ou push n'est pas activé pour Community. Les notifications de messages ne contiennent
          jamais le texte du message.
        </p>
        <div className="divide-y divide-slate-100">
          {profile.notificationKinds.map((kind) => (
            <label key={kind.id} className="py-2.5 flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-xs text-slate-700">
                {kind.label}
                {kind.mandatory && <span className="ml-1 text-[10px] text-slate-400">(obligatoire)</span>}
              </span>
              <input
                type="checkbox"
                className="w-4 h-4 accent-red-600"
                checked={prefs[kind.id] !== false}
                disabled={kind.mandatory}
                onChange={(e) => setPrefs({ ...prefs, [kind.id]: e.target.checked })}
              />
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <SaveButton busy={busy} />
        </div>
      </form>
    </Card>
  );
};

// --- Comptes liés & sécurité ----------------------------------------------------------------------------

interface SessionRow {
  id: string;
  provider: string;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}

const PROVIDER_NAMES: Record<string, string> = { email: 'E-mail et mot de passe', wechat: 'WeChat', facebook: 'Facebook' };

const SecurityPanel: React.FC = () => {
  const { notify } = useToast();
  const { logout } = useAuth();
  const [me, setMe] = useState<User | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [providers, setProviders] = useState<{ id: string; name: string; enabled: boolean }[]>([]);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get<User>('/auth/me').then(setMe).catch(() => undefined);
    api.get<SessionRow[]>('/auth/sessions').then(setSessions).catch(() => setSessions([]));
    api.get<{ id: string; name: string; enabled: boolean }[]>('/auth/providers').then(setProviders).catch(() => setProviders([]));
  }, []);
  useEffect(() => load(), [load]);

  const link = async (provider: string) => {
    try {
      const { ticket } = await api.post<{ ticket: string }>(`/auth/oauth/${provider}/link-ticket`);
      startOAuth(provider, ticket);
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const unlink = async (id: string) => {
    if (!window.confirm('Retirer cette méthode de connexion ?')) return;
    try {
      await api.delete(`/auth/identities/${id}`);
      notify('Méthode de connexion retirée.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch('/auth/me/password', { currentPassword: passwords.currentPassword || undefined, newPassword: passwords.newPassword });
      setPasswords({ currentPassword: '', newPassword: '' });
      notify('Mot de passe enregistré. Vos autres sessions ont été déconnectées.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (session: SessionRow) => {
    try {
      await api.delete(`/auth/sessions/${session.id}`);
      if (session.current) logout();
      else load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const revokeOthers = async () => {
    try {
      await api.post('/auth/sessions/revoke-others');
      notify('Les autres appareils ont été déconnectés.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  if (!me) return <Loading />;
  const identities = me.identities ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <Card>
        <SectionTitle title="Méthodes de connexion" />
        <p className="text-[11px] text-slate-500 mb-4">Toutes vos méthodes ouvrent le même compte QIAO : profil, communautés et discussions restent identiques.</p>
        <div className="space-y-2.5">
          {identities.map((identity) => (
            <div key={identity.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
              <Link2 className="w-4 h-4 text-emerald-600" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900">{PROVIDER_NAMES[identity.provider] ?? identity.provider}</div>
                <div className="text-[10px] text-slate-500 truncate">
                  {identity.displayName} · liée le {formatDate(identity.linkedAt)}
                </div>
              </div>
              {identity.provider !== 'email' && (
                <button onClick={() => unlink(identity.id)} className="text-[11px] font-semibold text-slate-500 hover:text-red-600 cursor-pointer">
                  Retirer
                </button>
              )}
            </div>
          ))}
          {providers
            .filter((p) => !identities.some((i) => i.provider === p.id))
            .map((provider) => (
              <button
                key={provider.id}
                disabled={!provider.enabled}
                onClick={() => link(provider.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-300 text-left hover:border-red-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Link2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">
                  Lier mon compte {provider.name}
                  {!provider.enabled && <span className="block text-[10px] text-slate-400 font-normal">Non configuré sur cette plateforme</span>}
                </span>
              </button>
            ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title={me.hasPassword ? 'Changer de mot de passe' : 'Définir un mot de passe'} />
        <form onSubmit={changePassword} className="space-y-3">
          {me.hasPassword && (
            <Field label="Mot de passe actuel">
              <input type="password" required autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className={inputClass} />
            </Field>
          )}
          <Field label="Nouveau mot de passe" hint="8 caractères minimum. Les autres appareils seront déconnectés.">
            <input type="password" required minLength={8} autoComplete="new-password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className={inputClass} />
          </Field>
          <div className="flex justify-end">
            <SaveButton busy={busy} label="Enregistrer le mot de passe" />
          </div>
        </form>
      </Card>

      <Card className="lg:col-span-2">
        <SectionTitle
          title="Sessions actives"
          action={
            sessions.length > 1 ? (
              <button onClick={revokeOthers} className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer inline-flex items-center gap-1">
                <LogOut className="w-3.5 h-3.5" /> Déconnecter les autres appareils
              </button>
            ) : undefined
          }
        />
        <div className="divide-y divide-slate-100">
          {sessions.map((session) => (
            <div key={session.id} className="py-3 flex items-center gap-3">
              <Monitor className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-800 truncate">
                  {session.userAgent?.slice(0, 90) ?? 'Appareil inconnu'}
                  {session.current && <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">Cet appareil</span>}
                </div>
                <div className="text-[10px] text-slate-400">
                  {PROVIDER_NAMES[session.provider] ?? session.provider} · ouverte le {formatDate(session.createdAt)} · active {timeAgo(session.lastUsedAt, 'long').toLowerCase()}
                </div>
              </div>
              <button onClick={() => revoke(session)} className="text-[11px] font-semibold text-slate-500 hover:text-red-600 cursor-pointer">
                {session.current ? 'Se déconnecter' : 'Révoquer'}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-400 inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Une session expire après 30 jours d'inactivité.
        </p>
      </Card>
    </div>
  );
};
