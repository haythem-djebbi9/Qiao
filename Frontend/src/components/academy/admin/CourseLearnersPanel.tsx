import React, { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle2, Download, RotateCcw, ShieldAlert, UserMinus, UserPlus, Users } from 'lucide-react';
import { api, downloadFile } from '../../../lib/api';
import { AdminCertificate, CourseLearners, SOURCE_LABELS, certificateVerifyHref } from '../../../lib/academy';
import { formatDate, timeAgo } from '../../../lib/text';
import { useToast } from '../../../context/ToastContext';
import { Avatar, Card, EmptyState, Field, Loading, Modal, ModalActions, SectionTitle, errorMessage, inputClass } from '../../community/ui';
import { LessonTypeIcon, ProgressBar } from '../ui';

/** Révocation d'un certificat : le motif est journalisé et communiqué au membre (jamais sur la page publique). */
const RevokeCertificateModal: React.FC<{
  certificate: AdminCertificate;
  holder: string;
  onClose: () => void;
  onDone: () => void;
}> = ({ certificate, holder, onClose, onDone }) => {
  const { notify } = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/academy/admin/certificates/${certificate.id}/revoke`, { reason });
      notify('Certificat révoqué : le membre a été notifié.');
      onDone();
      onClose();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Révoquer le certificat" icon={<ShieldAlert className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-slate-600">
          Certificat n° <span className="font-mono font-semibold">{certificate.number}</span> de {holder}. La page de vérification indiquera qu'il a été
          révoqué ; le membre ne pourra plus le télécharger. Vous pourrez le rétablir.
        </p>
        <Field label="Motif (communiqué au membre et journalisé)">
          <textarea required minLength={3} maxLength={500} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} />
        </Field>
        <ModalActions onCancel={onClose} submitLabel="Révoquer" busy={busy} danger />
      </form>
    </Modal>
  );
};

/** Accès offert à un membre (par son adresse e-mail), sans commande. */
export const GrantAccessModal: React.FC<{
  itemType: 'course' | 'path';
  itemId: string;
  title: string;
  onClose: () => void;
  onDone: () => void;
}> = ({ itemType, itemId, title, onClose, onDone }) => {
  const { notify } = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/academy/admin/enrollments', { email, itemType, itemId });
      notify('Accès accordé : le membre a été notifié.');
      onDone();
      onClose();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Inscrire un membre" icon={<UserPlus className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-slate-600">
          Accès offert à « {title} », sans commande ni facture. Le membre reçoit une notification et retrouve la formation dans son espace.
        </p>
        <Field label="Adresse e-mail du compte QIAO">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="membre@entreprise.com" />
        </Field>
        <ModalActions onCancel={onClose} submitLabel="Inscrire" busy={busy} />
      </form>
    </Modal>
  );
};

/** Inscrits d'une formation : progression, dernière activité et détail leçon par leçon (scores des quiz). */
export const CourseLearnersPanel: React.FC<{ courseId: string; title: string }> = ({ courseId, title }) => {
  const { notify } = useToast();
  const [data, setData] = useState<CourseLearners | null>(null);
  const [granting, setGranting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<{ certificate: AdminCertificate; holder: string } | null>(null);

  const load = useCallback(() => {
    api.get<CourseLearners>(`/academy/admin/courses/${courseId}/learners`).then(setData).catch((err) => notify(errorMessage(err), 'error'));
  }, [courseId, notify]);
  useEffect(() => load(), [load]);

  const revoke = async (enrollmentId: string, name: string) => {
    if (!window.confirm(`Retirer l'accès de ${name} ? Sa progression est conservée et réapparaîtra s'il se réinscrit.`)) return;
    try {
      await api.delete(`/academy/admin/enrollments/${enrollmentId}`);
      notify('Accès retiré.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const restore = async (certificate: AdminCertificate) => {
    if (!window.confirm(`Rétablir le certificat n° ${certificate.number} ? Il sera de nouveau valide et téléchargeable par le membre.`)) return;
    try {
      await api.post(`/academy/admin/certificates/${certificate.id}/restore`);
      notify('Certificat rétabli.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const downloadCopy = (certificate: AdminCertificate) =>
    downloadFile(`/academy/admin/certificates/${certificate.id}/pdf`, `certificat-qiao-academy-${certificate.number}.pdf`).catch((err) =>
      notify(errorMessage(err, 'Téléchargement impossible.'), 'error'),
    );

  if (!data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Inscrits', data.summary.learners],
          ['Formation terminée', data.summary.completions],
          ['Progression moyenne', `${data.summary.averageProgress} %`],
          ['Leçons visibles', data.lessons.length],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#071329] text-white rounded-2xl p-4">
            <div className="text-2xl font-black">{value}</div>
            <div className="text-[11px] text-slate-300 mt-1">{label}</div>
          </div>
        ))}
      </div>
      <Card>
        <SectionTitle
          title={`Inscrits et progression (${data.learners.length})`}
          action={
            <button onClick={() => setGranting(true)} className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" /> Inscrire un membre
            </button>
          }
        />
        {data.learners.length === 0 ? (
          <EmptyState icon={<Users className="w-10 h-10" />} text="Aucun inscrit pour le moment." />
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="hidden md:flex items-center gap-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <div className="w-64">Membre</div>
              <div className="flex-1">Progression</div>
              <div className="w-56">Certificat</div>
              <div className="w-56" />
            </div>
            {data.learners.map((learner) => (
              <div key={learner.enrollmentId} className="py-3">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex items-center gap-3 md:w-64 min-w-0">
                    <Avatar src={learner.user.avatarUrl} name={learner.user.fullName} className="w-9 h-9" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{learner.user.fullName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{learner.user.email}</div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={learner.progress} />
                      <span className="text-xs font-bold text-slate-900 w-10 text-right">{learner.progress} %</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {learner.completedLessons}/{data.lessons.length} leçons · {SOURCE_LABELS[learner.source]}
                      {learner.viaPath && ` « ${learner.viaPath} »`} · inscrit le {formatDate(learner.enrolledAt)}
                      {learner.lastActivityAt ? ` · actif ${timeAgo(learner.lastActivityAt, 'long')}` : learner.started ? '' : ' · pas encore commencée'}
                      {learner.status === 'completed' && learner.completedAt && (
                        <span className="text-emerald-700 font-semibold"> · terminée le {formatDate(learner.completedAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="md:w-56 min-w-0">
                    <div className="md:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Certificat</div>
                    {learner.certificate ? (
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                              learner.certificate.status === 'valid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {learner.certificate.status === 'valid' ? 'Valide' : 'Révoqué'}
                          </span>
                          <a
                            href={certificateVerifyHref(learner.certificate.number)}
                            target="_blank"
                            rel="noreferrer"
                            title="Ouvrir la page de vérification"
                            className="font-mono text-[11px] font-semibold text-slate-700 hover:text-red-600 truncate"
                          >
                            {learner.certificate.number}
                          </a>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          délivré le {formatDate(learner.certificate.issuedAt)}
                          {learner.certificate.averageScore !== null && ` · quiz ${learner.certificate.averageScore} %`}
                        </div>
                        {learner.certificate.status === 'revoked' && learner.certificate.revokedAt && (
                          <div className="text-[10px] text-slate-500 truncate" title={learner.certificate.revokedReason ?? undefined}>
                            révoqué le {formatDate(learner.certificate.revokedAt)}
                            {learner.certificate.revokedReason && ` · ${learner.certificate.revokedReason}`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {learner.status === 'completed' ? 'Délivré à sa prochaine visite' : 'Formation non terminée'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 md:w-56 md:justify-end shrink-0">
                    {learner.certificate && (
                      <>
                        <button
                          onClick={() => downloadCopy(learner.certificate!)}
                          title="Télécharger une copie du certificat"
                          aria-label="Télécharger une copie du certificat"
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {learner.certificate.status === 'valid' ? (
                          <button
                            onClick={() => setRevoking({ certificate: learner.certificate!, holder: learner.user.fullName })}
                            title="Révoquer le certificat"
                            aria-label="Révoquer le certificat"
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => restore(learner.certificate!)}
                            title="Rétablir le certificat"
                            aria-label="Rétablir le certificat"
                            className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                    {learner.started && data.lessons.length > 0 && (
                      <button
                        onClick={() => setExpanded(expanded === learner.enrollmentId ? null : learner.enrollmentId)}
                        className="px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        {expanded === learner.enrollmentId ? 'Masquer le détail' : 'Détail par leçon'}
                      </button>
                    )}
                    {learner.source !== 'path' && (
                      <button
                        onClick={() => revoke(learner.enrollmentId, learner.user.fullName)}
                        title="Retirer l'accès"
                        aria-label="Retirer l'accès"
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {expanded === learner.enrollmentId && (
                  <div className="mt-3 ml-0 md:ml-12 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {data.lessons.map((lesson, index) => {
                      const row = learner.lessons[lesson.id];
                      return (
                        <div key={lesson.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                          {row?.completedAt ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <span className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />}
                          <LessonTypeIcon type={lesson.type} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="flex-1 min-w-0 truncate text-slate-700">
                            {index + 1}. {lesson.title}
                          </span>
                          {lesson.type === 'quiz' && row && (
                            <span className="font-semibold text-slate-600 shrink-0">
                              {row.bestScore ?? 0} % · {row.attempts} essai{row.attempts > 1 ? 's' : ''}
                            </span>
                          )}
                          {row?.completedAt && <span className="text-slate-400 shrink-0">{formatDate(row.completedAt)}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      {granting && <GrantAccessModal itemType="course" itemId={courseId} title={title} onClose={() => setGranting(false)} onDone={load} />}
      {revoking && <RevokeCertificateModal certificate={revoking.certificate} holder={revoking.holder} onClose={() => setRevoking(null)} onDone={load} />}
    </div>
  );
};
