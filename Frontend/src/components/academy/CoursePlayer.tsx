import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Award, CheckCircle2, Clock, Eye, GraduationCap, Loader2, Lock } from 'lucide-react';
import { api } from '../../lib/api';
import { resolveImage } from '../../lib/assets';
import { LESSON_TYPE_LABELS, LearnLesson, LearnView, LessonNote, ProgressSummary, QuizResult, certificateVerifyHref, resumeLesson } from '../../lib/academy';
import { navigateDashboard } from '../../lib/payments';
import { formatDate } from '../../lib/text';
import { useToast } from '../../context/ToastContext';
import { Card, EmptyState, Loading, errorMessage } from '../community/ui';
import { LessonContent } from './LessonContent';
import { CertificateButton, CompletedMark, LessonTypeIcon, ProgressBar } from './ui';

/** Lecteur de formation : sommaire, leçon courante, validation et progression enregistrée côté serveur. */
export const CoursePlayer: React.FC<{
  courseId: string;
  lessonId?: string;
  /** Préfixe de l'adresse (?dv=) : « academy » pour l'apprenant, « admin-academy/apercu » pour l'aperçu administrateur. */
  basePath?: string;
  backTo?: string;
}> = ({ courseId, lessonId, basePath = 'academy', backTo = 'academy' }) => {
  const { notify } = useToast();
  const [view, setView] = useState<LearnView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<LessonNote[]>([]);

  // Notes personnelles de la formation (toutes leçons), chargées une fois.
  useEffect(() => {
    api.get<LessonNote[]>(`/academy/learn/${courseId}/notes`).then(setNotes).catch(() => setNotes([]));
  }, [courseId]);

  const load = useCallback(() => {
    setError(null);
    api
      .get<LearnView>(`/academy/learn/${courseId}`)
      .then(setView)
      .catch((err) => setError(errorMessage(err, 'Formation indisponible.')));
  }, [courseId]);
  useEffect(() => load(), [load]);

  const lessons = useMemo(() => view?.modules.flatMap((m) => m.lessons) ?? [], [view]);
  const current = lessons.find((l) => l.id === lessonId) ?? null;
  const index = current ? lessons.indexOf(current) : -1;
  const preview = view?.mode === 'preview';
  const open = (id: string) => navigateDashboard(`${basePath}/${courseId}/${id}`, { replace: true });

  // Sans leçon dans l'adresse : reprise à la première leçon non terminée (ou à la dernière ouverte).
  useEffect(() => {
    if (!view || current) return;
    const next = resumeLesson(view);
    if (next) open(next.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, current]);

  // Point de reprise enregistré à l'ouverture de chaque leçon.
  useEffect(() => {
    if (!current || view?.mode !== 'learner') return;
    api.post(`/academy/learn/${courseId}/lessons/${current.id}/view`).catch(() => undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [courseId, current?.id, view?.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyProgress = (lesson: Partial<LearnLesson> & { id: string }, summary: Partial<ProgressSummary>) => {
    setView((v) =>
      v && {
        ...v,
        modules: v.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.id === lesson.id ? { ...l, ...lesson } : l)) })),
        stats:
          summary.totalLessons !== undefined
            ? { totalLessons: summary.totalLessons, completedLessons: summary.completedLessons ?? 0, progress: summary.progress ?? 0 }
            : v.stats,
        enrollment: v.enrollment && summary.status ? { ...v.enrollment, progress: summary.progress ?? 0, status: summary.status } : v.enrollment,
      },
    );
    if (summary.status === 'completed' && view?.enrollment?.status !== 'completed') {
      notify('Félicitations : formation terminée ! Votre certificat est disponible. 🎓');
      // Certificat délivré par le serveur à la validation de la dernière leçon : son numéro est récupéré.
      api
        .get<LearnView>(`/academy/learn/${courseId}`)
        .then((fresh) => setView((v) => v && { ...v, certificate: fresh.certificate }))
        .catch(() => undefined);
    }
  };

  const complete = async (advance: boolean) => {
    if (!current || preview) return;
    setBusy(true);
    try {
      const result = await api.post<ProgressSummary & { lesson: Partial<LearnLesson> & { id: string } }>(
        `/academy/learn/${courseId}/lessons/${current.id}/complete`,
      );
      applyProgress(result.lesson, result);
      const next = lessons[index + 1];
      if (advance && next) open(next.id);
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const onQuizResult = (result: QuizResult) => {
    if (result.lesson) applyProgress(result.lesson, result);
  };

  if (error) {
    return (
      <Card>
        <EmptyState icon={<Lock className="w-10 h-10" />} text={error} action={{ label: 'Retour à mes formations', onClick: () => navigateDashboard(backTo) }} />
      </Card>
    );
  }
  if (!view) return <Loading label="Chargement de la formation..." />;

  const completedCourse = view.enrollment?.status === 'completed';
  return (
    <div className="space-y-5">
      {/* En-tête de la formation */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="relative h-28 sm:h-32 bg-slate-900">
          <img src={resolveImage(view.course.image)} alt={view.course.title} className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent" />
          <button
            onClick={() => navigateDashboard(backTo)}
            className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {backTo === 'academy' ? 'Mes formations' : 'Retour'}
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-red-400">QIAO Academy · {view.course.level}</div>
            <h2 className="text-base sm:text-lg font-bold text-white leading-snug">{view.course.title}</h2>
          </div>
        </div>
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <ProgressBar value={view.stats.progress} />
            <div className="text-[11px] text-slate-500 mt-1">
              {view.stats.completedLessons}/{view.stats.totalLessons} {view.stats.totalLessons > 1 ? 'leçons terminées' : 'leçon terminée'} ·{' '}
              <strong className="text-slate-800">{view.stats.progress} %</strong>
            </div>
          </div>
          {completedCourse && (
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Formation terminée
            </span>
          )}
          {!preview && (completedCourse || view.certificate) && <CertificateButton courseId={courseId} certificate={view.certificate} />}
        </div>
        {view.certificate && (
          <div className="px-4 pb-3 -mt-1 text-[11px] text-slate-500">
            Certificat n° <span className="font-mono font-semibold text-slate-700">{view.certificate.number}</span> · délivré le{' '}
            {formatDate(view.certificate.issuedAt)}
            {view.certificate.averageScore !== null && <> · score moyen aux quiz : {view.certificate.averageScore} %</>} ·{' '}
            <a href={certificateVerifyHref(view.certificate.number)} target="_blank" rel="noreferrer" className="font-semibold text-red-600 hover:underline">
              Page de vérification
            </a>
          </div>
        )}
        {preview && (
          <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0" /> Aperçu administrateur : toutes les leçons sont visibles (y compris masquées) et rien n'est enregistré.
          </div>
        )}
      </div>

      {lessons.length === 0 ? (
        <Card>
          <EmptyState icon={<GraduationCap className="w-10 h-10" />} text="Le contenu de cette formation est en cours de préparation. Vous serez notifié dès sa mise en ligne." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Sommaire */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-3 lg:sticky lg:top-24 max-h-[75vh] overflow-y-auto">
            <div className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Programme</div>
            <div className="space-y-3">
              {view.modules.map((module, mIndex) => (
                <div key={module.id}>
                  <div className="px-2 text-xs font-bold text-slate-900">
                    Module {mIndex + 1} · {module.title}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {module.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => open(lesson.id)}
                        className={`w-full text-left px-2 py-2 rounded-xl flex items-center gap-2 text-xs cursor-pointer transition-colors ${
                          lesson.id === current?.id ? 'bg-red-50 text-red-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <CompletedMark done={lesson.completed} />
                        <span className="flex-1 min-w-0 truncate">{lesson.title}</span>
                        {!lesson.published && <span className="text-[9px] font-bold text-amber-600">masquée</span>}
                        <LessonTypeIcon type={lesson.type} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Leçon */}
          <section className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
            {!current ? (
              <Loading />
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold inline-flex items-center gap-1">
                      <LessonTypeIcon type={current.type} className="w-3 h-3" /> {LESSON_TYPE_LABELS[current.type]}
                    </span>
                    <span>
                      Leçon {index + 1} sur {lessons.length}
                    </span>
                    {current.durationMinutes > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {current.durationMinutes} min
                      </span>
                    )}
                    {current.completed && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terminée
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-lg sm:text-xl font-bold text-slate-900 leading-snug">{current.title}</h3>
                </div>

                <LessonContent
                  courseId={courseId}
                  courseTitle={view.course.title}
                  lesson={current}
                  lessons={lessons}
                  preview={preview}
                  notes={notes}
                  onNotesChange={setNotes}
                  onVideoEnded={() => !current.completed && complete(false)}
                  onQuizResult={onQuizResult}
                />

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => lessons[index - 1] && open(lessons[index - 1].id)}
                    disabled={index <= 0}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-default"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Précédente
                  </button>
                  <div className="flex items-center gap-2">
                    {current.type !== 'quiz' && !current.completed && !preview && (
                      <button
                        onClick={() => complete(true)}
                        disabled={busy}
                        className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
                      >
                        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        {lessons[index + 1] ? 'Marquer comme terminée et continuer' : 'Marquer comme terminée'}
                      </button>
                    )}
                    {(current.completed || current.type === 'quiz' || preview) && lessons[index + 1] && (
                      <button
                        onClick={() => open(lessons[index + 1].id)}
                        className="px-5 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                      >
                        Leçon suivante <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
