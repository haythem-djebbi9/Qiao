import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Flag, Loader2, Lock, ShieldAlert } from 'lucide-react';
import { api } from '../../lib/api';
import { ModerationSummary, ReportView, navigateCommunity, routeFromLink } from '../../lib/community';
import { formatDate, timeAgo } from '../../lib/text';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, EmptyState, Loading, MemberName, Pills, SectionTitle, errorMessage } from './ui';

const STATUS_LABELS: Record<ReportView['status'], { label: string; tone: string }> = {
  new: { label: 'Nouveau', tone: 'bg-red-50 text-red-700 border-red-200' },
  under_review: { label: 'En cours d’examen', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  action_taken: { label: 'Mesure prise', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Aucune infraction', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
  closed: { label: 'Clos', tone: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const TARGET_LABELS: Record<ReportView['targetType'], string> = {
  post: 'Publication',
  comment: 'Commentaire',
  user: 'Profil membre',
  message: 'Message privé',
  community: 'Communauté',
};

const ACTIONS: { id: string; label: string; targets: ReportView['targetType'][]; adminOnly?: boolean; tone?: string }[] = [
  { id: 'review', label: 'Prendre en charge', targets: ['post', 'comment', 'user', 'message', 'community'] },
  { id: 'dismiss', label: 'Aucune infraction', targets: ['post', 'comment', 'user', 'message', 'community'] },
  { id: 'hide', label: 'Masquer', targets: ['post', 'comment'] },
  { id: 'remove', label: 'Retirer', targets: ['post', 'comment', 'message'], tone: 'danger' },
  { id: 'restore', label: 'Rétablir', targets: ['post', 'comment'] },
  { id: 'lock', label: 'Verrouiller la discussion', targets: ['post', 'comment'] },
  { id: 'warn', label: 'Avertir le membre', targets: ['post', 'comment', 'user', 'message'] },
  { id: 'ban', label: 'Exclure de la communauté', targets: ['post', 'comment'], tone: 'danger' },
  { id: 'suspend', label: 'Suspendre le compte', targets: ['post', 'comment', 'user', 'message'], adminOnly: true, tone: 'danger' },
  { id: 'escalate', label: 'Escalader aux administrateurs', targets: ['post', 'comment', 'user', 'community'] },
];

/** File de modération : signalements (périmètre du modérateur) et demandes d'adhésion. */
export const ModerationPanel: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ModerationSummary | null>(null);
  const [status, setStatus] = useState('open');
  const [data, setData] = useState<{ items: ReportView[]; total: number; counts: Record<string, number>; isAdmin: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) api.get<ModerationSummary>('/community/moderation/summary').then(setSummary).catch(() => undefined);
  }, [user]);

  const load = useCallback(() => {
    api
      .get<{ items: ReportView[]; total: number; counts: Record<string, number>; isAdmin: boolean }>('/community/moderation/reports', { status, limit: 30 })
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <Card>
        <EmptyState icon={<Lock className="w-10 h-10" />} text={error} />
      </Card>
    );
  }
  if (!data) return <Loading label="Chargement de la file de modération..." />;

  const open = (data.counts.new ?? 0) + (data.counts.under_review ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-600" /> Modération
            </h2>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl">
            {data.isAdmin
              ? 'Administrateur : tous les signalements de la plateforme, y compris les profils, communautés et messages privés signalés.'
              : 'Signalements des publications et commentaires de vos communautés. Les messages privés restent inaccessibles aux modérateurs.'}
          </p>
        </div>
        <Pills
          options={[
            { id: 'open', label: 'À traiter', count: open },
            { id: 'action_taken', label: 'Mesures prises' },
            { id: 'rejected', label: 'Sans infraction' },
            { id: 'all', label: 'Tous' },
          ]}
          value={status}
          onChange={setStatus}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          {data.items.length === 0 ? (
            <Card>
              <EmptyState icon={<CheckCircle2 className="w-10 h-10" />} text="Aucun signalement dans cette liste." />
            </Card>
          ) : (
            data.items.map((report) => <ReportCard key={report.id} report={report} isAdmin={data.isAdmin} onResolved={load} />)
          )}
        </div>
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <SectionTitle title="Communautés modérées" />
            {summary?.isAdmin && <p className="text-[11px] text-slate-500 mb-2">Administrateur : toutes les communautés.</p>}
            <div className="space-y-2">
              {(summary?.communities ?? []).slice(0, 15).map((community) => (
                <div key={community.id} className="flex items-center justify-between text-xs">
                  <button onClick={() => navigateCommunity(`c/${community.slug}`)} className="font-semibold text-slate-800 hover:text-red-600 cursor-pointer text-left">
                    {community.name}
                  </button>
                  <button onClick={() => navigateCommunity(`c/${community.slug}/requests`)} className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                    Demandes
                  </button>
                </div>
              ))}
            </div>
            {summary && summary.pendingRequests > 0 && (
              <p className="mt-3 text-[11px] font-semibold text-amber-700">
                {summary.pendingRequests} demande{summary.pendingRequests > 1 ? 's' : ''} d'adhésion en attente.
              </p>
            )}
          </Card>
          <Card>
            <SectionTitle title="Rappel" />
            <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4">
              <li>Chaque décision est journalisée (auteur, date, motif) et notifiée au membre concerné.</li>
              <li>La modération porte sur les contenus et comportements, jamais sur la vérification des experts.</li>
              <li>Escaladez les cas graves (fraude, contenu illégal) aux administrateurs QIAO.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ReportCard: React.FC<{ report: ReportView; isAdmin: boolean; onResolved: () => void }> = ({ report, isAdmin, onResolved }) => {
  const { notify } = useToast();
  const [resolution, setResolution] = useState('');
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState<string | null>(null);
  const status = STATUS_LABELS[report.status];
  const isOpen = report.status === 'new' || report.status === 'under_review';

  const resolve = async (action: string) => {
    if (['remove', 'ban', 'suspend'].includes(action) && !window.confirm('Confirmer cette mesure ? Elle sera notifiée au membre et journalisée.')) return;
    setBusy(action);
    try {
      await api.post(`/community/moderation/reports/${report.id}/resolve`, {
        action,
        resolution: resolution.trim() || undefined,
        suspensionDays: action === 'suspend' ? days : undefined,
      });
      notify('Décision enregistrée.');
      onResolved();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  const actions = ACTIONS.filter((a) => a.targets.includes(report.targetType) && (!a.adminOnly || isAdmin) && !(a.id === 'review' && report.status === 'under_review') && !(a.id === 'ban' && !report.community) && !(a.id === 'remove' && report.targetType === 'message' && !isAdmin) && !(a.id === 'escalate' && (isAdmin || report.escalated)));

  return (
    <Card className={report.escalated && isOpen ? 'border-red-300 ring-2 ring-red-500/10' : ''}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.tone}`}>{status.label}</span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">{TARGET_LABELS[report.targetType]}</span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 inline-flex items-center gap-1">
          <Flag className="w-3 h-3" /> {report.reasonLabel}
        </span>
        {report.escalated && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Escaladé
          </span>
        )}
        {report.community && <span className="text-[10px] text-slate-500">· {report.community.name}</span>}
        <span className="ml-auto text-[10px] text-slate-400">{timeAgo(report.createdAt, 'long')}</span>
      </div>

      {report.snapshot && <p className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 whitespace-pre-line line-clamp-6">{report.snapshot}</p>}
      {report.description && <p className="mt-2 text-[11px] text-slate-600">Précisions du signalement : « {report.description} »</p>}

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500">
        <div>
          Signalé par : <MemberName member={report.reporter} className="font-semibold text-slate-700" />
        </div>
        {report.targetUser && (
          <div>
            Membre concerné : <MemberName member={report.targetUser} className="font-semibold text-slate-700" />
          </div>
        )}
        {report.target && (
          <div className="sm:col-span-2 flex items-center gap-2">
            État actuel : <strong className="text-slate-700">{report.target.status}</strong>
            {report.target.locked ? ' · verrouillée' : ''}
            {report.target.link && (
              <button
                onClick={() => {
                  const route = routeFromLink(report.target!.link!);
                  if (route) navigateCommunity(route);
                }}
                className="text-blue-600 hover:underline cursor-pointer inline-flex items-center gap-0.5"
              >
                Ouvrir <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
        {report.resolvedBy && (
          <div className="sm:col-span-2">
            Décision : <strong className="text-slate-700">{report.action}</strong> par {report.resolvedBy}
            {report.resolvedAt ? ` le ${formatDate(report.resolvedAt)}` : ''}
            {report.resolution ? ` — ${report.resolution}` : ''}
          </div>
        )}
        {report.assignedTo && isOpen && <div className="sm:col-span-2">Pris en charge par {report.assignedTo}</div>}
      </div>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
          <input
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            maxLength={1000}
            placeholder="Motif / note de décision (communiqué au membre concerné)"
            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-red-500"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => resolve(action.id)}
                disabled={!!busy}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border cursor-pointer inline-flex items-center gap-1 disabled:opacity-60 ${
                  action.tone === 'danger' ? 'border-red-300 text-red-700 hover:bg-red-50' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {busy === action.id && <Loader2 className="w-3 h-3 animate-spin" />}
                {action.label}
              </button>
            ))}
            {isAdmin && report.targetType !== 'community' && (
              <label className="text-[11px] text-slate-500 inline-flex items-center gap-1 ml-1">
                Suspension :
                <input type="number" min={1} max={365} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-14 rounded-lg border border-slate-200 px-1.5 py-1 text-[11px]" /> jours
              </label>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
