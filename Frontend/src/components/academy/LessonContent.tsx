import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, ExternalLink, FileText, Link2, Loader2, Paperclip, RotateCcw, XCircle } from 'lucide-react';
import { api, fetchObjectUrl } from '../../lib/api';
import { FileRef, LearnLesson, LessonNote, LessonResource, QuizResult } from '../../lib/academy';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../community/ui';
import { LessonNotes } from './LessonNotes';
import { formatSize } from './ui';
import { VideoHandle, VideoPlayer } from './VideoPlayer';

const URL_PATTERN = /(https?:\/\/[^\s<]+)/g;

const Linked: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(URL_PATTERN).map((part, index) =>
      /^https?:\/\//.test(part) ? (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-600 hover:underline break-all">
          {part}
        </a>
      ) : (
        <React.Fragment key={index}>{part}</React.Fragment>
      ),
    )}
  </>
);

/** Texte de leçon : « ## » pour un intertitre, « - » pour une liste, ligne vide entre les paragraphes (aucun HTML interprété). */
export const LessonText: React.FC<{ text: string }> = ({ text }) => (
  <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
    {text
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block, index) => {
        if (/^#{1,3}\s/.test(block)) {
          return (
            <h4 key={index} className="text-base font-bold text-slate-900 pt-1">
              {block.replace(/^#{1,3}\s+/, '')}
            </h4>
          );
        }
        const lines = block.split('\n');
        if (lines.every((line) => /^\s*[-•*]\s+/.test(line))) {
          return (
            <ul key={index} className="space-y-1.5">
              {lines.map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 shrink-0" />
                  <span>
                    <Linked text={line.replace(/^\s*[-•*]\s+/, '')} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="whitespace-pre-line break-words">
            <Linked text={block} />
          </p>
        );
      })}
  </div>
);

/** Fichier protégé chargé avec la session du membre (les supports ne sont servis qu'aux inscrits). */
function useProtectedFile(file: FileRef | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const fileId = file?.id ?? null;
  useEffect(() => {
    if (!fileId) return;
    let revoked: string | null = null;
    setUrl(null);
    setFailed(null);
    fetchObjectUrl(`/academy/files/${fileId}`)
      .then((objectUrl) => {
        revoked = objectUrl;
        setUrl(objectUrl);
      })
      .catch((err) => setFailed(errorMessage(err, 'Fichier indisponible.')));
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [fileId]);
  return { url, failed };
}

const VideoBlock: React.FC<{ lesson: LearnLesson; player: React.RefObject<VideoHandle | null>; onEnded?: () => void }> = ({ lesson, player, onEnded }) => {
  const { url, failed } = useProtectedFile(lesson.file);
  return <VideoPlayer ref={player} lesson={lesson} src={lesson.file ? url : lesson.videoUrl} failed={failed} onEnded={onEnded} />;
};

/** Support téléchargeable (fichier protégé, chargé avec la session) ou lien externe. */
const ResourceItem: React.FC<{ resource: LessonResource }> = ({ resource }) => {
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const download = async () => {
    if (!resource.file) return;
    setBusy(true);
    try {
      const url = await fetchObjectUrl(`/academy/files/${resource.file.id}`);
      const link = document.createElement('a');
      link.href = url;
      link.download = resource.file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      notify(errorMessage(err, 'Téléchargement impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };
  const row = 'w-full flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-red-300 hover:shadow-xs text-left cursor-pointer';
  if (resource.kind === 'link' && resource.url) {
    return (
      <a href={resource.url} target="_blank" rel="noopener noreferrer nofollow" className={row}>
        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Link2 className="w-4 h-4" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-semibold text-slate-900 truncate">{resource.title}</span>
          <span className="block text-[10px] text-slate-400 truncate">{resource.url.replace(/^https:\/\//, '')}</span>
        </span>
        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </a>
    );
  }
  if (!resource.file) return null;
  const ext = resource.file.name.split('.').pop()?.toUpperCase() ?? '';
  return (
    <button type="button" onClick={download} disabled={busy} className={row}>
      <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 text-[9px] font-black">{ext.slice(0, 4) || <FileText className="w-4 h-4" />}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold text-slate-900 truncate">{resource.title}</span>
        <span className="block text-[10px] text-slate-400 truncate">
          {resource.file.name} · {formatSize(resource.file.size)}
        </span>
      </span>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600 shrink-0" /> : <Download className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
    </button>
  );
};

const ResourcesBlock: React.FC<{ resources: LessonResource[] }> = ({ resources }) =>
  resources.length === 0 ? null : (
    <section className="space-y-2">
      <h4 className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
        <Paperclip className="w-4 h-4 text-red-600" /> Supports de la leçon
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {resources.map((resource) => (
          <ResourceItem key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );

const PdfBlock: React.FC<{ lesson: LearnLesson }> = ({ lesson }) => {
  const { url, failed } = useProtectedFile(lesson.file);
  if (!lesson.file) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
        <span className="flex items-center gap-2 min-w-0 text-xs font-semibold text-slate-800">
          <FileText className="w-4 h-4 text-red-600 shrink-0" />
          <span className="truncate">{lesson.file.name}</span>
          <span className="text-[10px] text-slate-400 font-normal">{formatSize(lesson.file.size)}</span>
        </span>
        {url && (
          <a
            href={url}
            download={lesson.file.name}
            className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Télécharger
          </a>
        )}
      </div>
      {failed ? (
        <div className="p-6 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-2xl">{failed}</div>
      ) : url ? (
        <iframe src={url} title={lesson.file.name} className="w-full h-[70vh] rounded-2xl border border-slate-200 bg-slate-50" />
      ) : (
        <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
      )}
    </div>
  );
};

const QuizBlock: React.FC<{
  courseId: string;
  lesson: LearnLesson;
  preview: boolean;
  onResult: (result: QuizResult) => void;
}> = ({ courseId, lesson, preview, onResult }) => {
  const { notify } = useToast();
  const questions = lesson.quiz?.questions ?? [];
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));
  const [result, setResult] = useState<QuizResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAnswers(questions.map(() => -1));
    setResult(null);
    // Nouvelle leçon : le formulaire repart de zéro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const submit = async () => {
    setBusy(true);
    try {
      const response = await api.post<QuizResult>(`/academy/learn/${courseId}/lessons/${lesson.id}/quiz`, { answers });
      setResult(response);
      onResult(response);
    } catch (err) {
      notify(errorMessage(err, 'Correction impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const verdict = (index: number) => result?.results[index];
  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500">
        {questions.length} question{questions.length > 1 ? 's' : ''} · score minimal pour valider : <strong>{lesson.quiz?.passingScore ?? 0} %</strong>
        {lesson.attempts > 0 && (
          <span>
            {' '}
            · meilleur score : <strong>{lesson.bestScore ?? 0} %</strong> ({lesson.attempts} tentative{lesson.attempts > 1 ? 's' : ''})
          </span>
        )}
      </div>
      {questions.map((question, qIndex) => {
        const v = verdict(qIndex);
        return (
          <fieldset
            key={question.id}
            className={`p-4 rounded-2xl border ${v ? (v.correct ? 'border-emerald-200 bg-emerald-50/40' : 'border-red-200 bg-red-50/40') : 'border-slate-200 bg-white'}`}
          >
            <legend className="sr-only">{question.prompt}</legend>
            <div className="flex items-start gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-[11px] font-bold flex items-center justify-center shrink-0">{qIndex + 1}</span>
              <p className="text-sm font-semibold text-slate-900 pt-0.5">{question.prompt}</p>
              {v && (v.correct ? <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 ml-auto shrink-0" />)}
            </div>
            <div className="space-y-2">
              {question.options.map((option, oIndex) => {
                const selected = answers[qIndex] === oIndex;
                const isAnswer = v?.answer === oIndex;
                return (
                  <label
                    key={oIndex}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      isAnswer
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                        : selected
                          ? 'border-red-400 bg-red-50 text-slate-900'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      checked={selected}
                      disabled={Boolean(result?.passed)}
                      onChange={() => {
                        setAnswers(answers.map((a, i) => (i === qIndex ? oIndex : a)));
                        setResult(null);
                      }}
                      className="accent-red-600"
                    />
                    {option}
                  </label>
                );
              })}
            </div>
            {v?.explanation && <p className="mt-3 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl p-2.5">{v.explanation}</p>}
          </fieldset>
        );
      })}

      {result && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center gap-3 ${
            result.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {result.passed ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <RotateCcw className="w-5 h-5 text-amber-600 shrink-0" />}
          <span>
            <strong>
              {result.score} % ({result.correctCount}/{result.total})
            </strong>{' '}
            —{' '}
            {result.passed
              ? 'quiz réussi, la leçon est validée.'
              : `il faut ${result.passingScore} % pour valider. Revoyez les questions signalées et réessayez.`}
            {!result.recorded && ' (Aperçu : résultat non enregistré.)'}
          </span>
        </div>
      )}

      {!result?.passed && (
        <button
          type="button"
          onClick={submit}
          disabled={busy || answers.some((a) => a < 0)}
          className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {result ? 'Réessayer' : 'Valider mes réponses'}
        </button>
      )}
      {preview && <p className="text-[11px] text-slate-400">Aperçu administrateur : la correction s'affiche, rien n'est enregistré.</p>}
    </div>
  );
};

/** Contenu d'une leçon selon son type, ses supports et les notes personnelles de l'apprenant. */
export const LessonContent: React.FC<{
  courseId: string;
  courseTitle: string;
  lesson: LearnLesson;
  lessons: LearnLesson[];
  preview: boolean;
  notes: LessonNote[];
  onNotesChange: (notes: LessonNote[]) => void;
  onVideoEnded?: () => void;
  onQuizResult: (result: QuizResult) => void;
}> = ({ courseId, courseTitle, lesson, lessons, preview, notes, onNotesChange, onVideoEnded, onQuizResult }) => {
  const player = useRef<VideoHandle | null>(null);
  return (
    <div className="space-y-5">
      {lesson.type === 'video' && <VideoBlock key={lesson.id} lesson={lesson} player={player} onEnded={onVideoEnded} />}
      {lesson.type === 'video' && (
        <LessonNotes courseId={courseId} courseTitle={courseTitle} lesson={lesson} lessons={lessons} notes={notes} onNotesChange={onNotesChange} player={player} />
      )}
      {lesson.type === 'pdf' && <PdfBlock lesson={lesson} />}
      {lesson.content && <LessonText text={lesson.content} />}
      {lesson.type === 'quiz' && <QuizBlock courseId={courseId} lesson={lesson} preview={preview} onResult={onQuizResult} />}
      <ResourcesBlock resources={lesson.resources ?? []} />
      {lesson.type !== 'video' && (
        <LessonNotes courseId={courseId} courseTitle={courseTitle} lesson={lesson} lessons={lessons} notes={notes} onNotesChange={onNotesChange} player={player} />
      )}
    </div>
  );
};
