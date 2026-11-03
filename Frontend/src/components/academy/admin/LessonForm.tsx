import React, { useState } from 'react';
import { CheckCircle2, FileText, Link2, Paperclip, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../../lib/api';
import {
  AdminCourseDetail,
  AdminLesson,
  AdminModule,
  AdminQuizQuestion,
  FileRef,
  LESSON_TYPE_LABELS,
  LessonType,
  VIDEO_PLATFORMS,
  isPlayableVideoUrl,
  videoEmbed,
} from '../../../lib/academy';
import { useToast } from '../../../context/ToastContext';
import { Field, Modal, ModalActions, errorMessage, inputClass } from '../../community/ui';
import { LessonTypeIcon, UploadButton, formatSize } from '../ui';

const TYPES: LessonType[] = ['text', 'video', 'pdf', 'quiz'];

const emptyQuestion = (): AdminQuizQuestion => ({ id: '', prompt: '', options: ['', ''], answer: 0, explanation: null });

const FileChip: React.FC<{ file: FileRef; onRemove: () => void }> = ({ file, onRemove }) => (
  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 max-w-full">
    <FileText className="w-4 h-4 text-red-600 shrink-0" />
    <span className="truncate font-semibold">{file.name}</span>
    <span className="text-[10px] text-slate-400 shrink-0">{formatSize(file.size)}</span>
    <button type="button" onClick={onRemove} aria-label="Retirer le fichier" className="text-slate-400 hover:text-red-600 cursor-pointer">
      <X className="w-3.5 h-3.5" />
    </button>
  </span>
);

/** Support en cours d'édition : fichier téléversé ou lien https. */
interface ResourceDraft {
  id?: string;
  kind: 'file' | 'link';
  title: string;
  url: string;
  file: FileRef | null;
}

const RESOURCE_ACCEPT =
  'application/pdf,.docx,.xlsx,.pptx,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation';

/** Supports complémentaires de la leçon (toutes leçons) : fiches PDF, modèles Word / Excel, présentations, liens. */
const ResourcesEditor: React.FC<{ resources: ResourceDraft[]; onChange: (resources: ResourceDraft[]) => void }> = ({ resources, onChange }) => {
  const update = (index: number, patch: Partial<ResourceDraft>) => onChange(resources.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-red-600" /> Supports de la leçon {resources.length > 0 && `(${resources.length})`}
        </span>
        <span className="text-[10px] text-slate-400">Facultatif · réservés aux inscrits</span>
      </div>
      {resources.map((resource, index) => (
        <div key={resource.id ?? `new-${index}`} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
          <div className="flex items-center gap-2">
            {resource.kind === 'file' ? <FileText className="w-4 h-4 text-red-600 shrink-0" /> : <Link2 className="w-4 h-4 text-blue-600 shrink-0" />}
            <input
              required
              maxLength={200}
              value={resource.title}
              onChange={(e) => update(index, { title: e.target.value })}
              placeholder={resource.kind === 'file' ? 'Titre du support (ex. Fiche de synthèse)' : 'Titre du lien (ex. Vidéo complémentaire)'}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => onChange(resources.filter((_, i) => i !== index))}
              aria-label="Retirer le support"
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {resource.kind === 'file' ? (
            resource.file && (
              <div className="pl-6 text-[11px] text-slate-500 truncate">
                {resource.file.name} · {formatSize(resource.file.size)}
              </div>
            )
          ) : (
            <div className="pl-6">
              <input
                required
                type="url"
                pattern="https://.*"
                value={resource.url}
                onChange={(e) => update(index, { url: e.target.value })}
                placeholder="https://…"
                className={inputClass}
              />
            </div>
          )}
        </div>
      ))}
      {resources.length < 20 && (
        <div className="flex flex-wrap items-center gap-2">
          <UploadButton
            purpose="resource"
            accept={RESOURCE_ACCEPT}
            label="Ajouter un fichier (PDF, Word, Excel, PowerPoint)"
            onUploaded={(file) => onChange([...resources, { kind: 'file', title: file.name.replace(/\.[a-z0-9]+$/i, ''), url: '', file }])}
          />
          <button
            type="button"
            onClick={() => onChange([...resources, { kind: 'link', title: '', url: '', file: null }])}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer inline-flex items-center gap-1.5"
          >
            <Link2 className="w-3.5 h-3.5 text-blue-600" /> Ajouter un lien
          </button>
        </div>
      )}
    </div>
  );
};

/** Création / modification d'une leçon : texte, vidéo (lien ou fichier), PDF ou quiz à choix unique, et ses supports. */
export const LessonForm: React.FC<{
  module: AdminModule;
  modules: AdminModule[];
  lesson: AdminLesson | null;
  initialType?: LessonType;
  onClose: () => void;
  onSaved: (course: AdminCourseDetail) => void;
}> = ({ module, modules, lesson, initialType, onClose, onSaved }) => {
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState<LessonType>(lesson?.type ?? initialType ?? 'text');
  const [resources, setResources] = useState<ResourceDraft[]>(
    () => lesson?.resources.map((r) => ({ id: r.id, kind: r.kind, title: r.title, url: r.url ?? '', file: r.file })) ?? [],
  );
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [content, setContent] = useState(lesson?.content ?? '');
  const [durationMinutes, setDuration] = useState(lesson?.durationMinutes ?? 10);
  const [published, setPublished] = useState(lesson?.published ?? true);
  const [moduleId, setModuleId] = useState(lesson?.moduleId ?? module.id);
  const [videoMode, setVideoMode] = useState<'url' | 'file'>(lesson?.type === 'video' && lesson.fileId ? 'file' : 'url');
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? '');
  const [file, setFile] = useState<FileRef | null>(lesson?.file ?? null);
  const [passingScore, setPassingScore] = useState(lesson?.quiz?.passingScore ?? 70);
  const [questions, setQuestions] = useState<AdminQuizQuestion[]>(lesson?.quiz?.questions.length ? lesson.quiz.questions : [emptyQuestion()]);

  const updateQuestion = (index: number, patch: Partial<AdminQuizQuestion>) =>
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  const pickType = (next: LessonType) => {
    setType(next);
    // Un fichier vidéo n'est pas un PDF (et inversement) : il est retiré au changement de type.
    if (file && ((next === 'pdf' && file.mime !== 'application/pdf') || (next === 'video' && file.mime === 'application/pdf') || next === 'text' || next === 'quiz')) {
      setFile(null);
    }
  };

  const embed = videoUrl ? videoEmbed(videoUrl) : null;
  const urlProblem = type === 'video' && videoMode === 'url' && videoUrl.trim() && !isPlayableVideoUrl(videoUrl.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (urlProblem) {
      notify(`Lien vidéo non reconnu : utilisez ${VIDEO_PLATFORMS}.`, 'error');
      return;
    }
    setBusy(true);
    const payload = {
      resources: resources.map((r) => ({ ...(r.id ? { id: r.id } : {}), kind: r.kind, title: r.title, ...(r.kind === 'file' ? { fileId: r.file?.id } : { url: r.url.trim() }) })),
      title,
      type,
      content: content || null,
      durationMinutes: Number(durationMinutes) || 0,
      published,
      videoUrl: type === 'video' && videoMode === 'url' ? videoUrl || null : null,
      fileId: (type === 'video' && videoMode === 'file') || type === 'pdf' ? (file?.id ?? null) : null,
      quiz:
        type === 'quiz'
          ? {
              passingScore: Number(passingScore),
              questions: questions.map((q) => ({ ...(q.id ? { id: q.id } : {}), prompt: q.prompt, options: q.options, answer: q.answer, explanation: q.explanation || null })),
            }
          : null,
      ...(lesson && moduleId !== lesson.moduleId ? { moduleId } : {}),
    };
    try {
      const course = lesson
        ? await api.patch<AdminCourseDetail>(`/academy/admin/lessons/${lesson.id}`, payload)
        : await api.post<AdminCourseDetail>(`/academy/admin/modules/${module.id}/lessons`, payload);
      notify(lesson ? 'Leçon enregistrée.' : 'Leçon ajoutée.');
      onSaved(course);
      onClose();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={lesson ? 'Modifier la leçon' : `Nouvelle leçon — ${module.title}`} icon={<LessonTypeIcon type={type} />} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-1.5">Type de leçon</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => pickType(t)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  type === t ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <LessonTypeIcon type={t} className="w-4 h-4" /> {LESSON_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-3">
            <Field label="Titre de la leçon">
              <input required minLength={2} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Durée (min)">
            <input type="number" min={0} max={1440} value={durationMinutes} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass} />
          </Field>
        </div>

        {type === 'video' && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {(
                [
                  ['url', 'Lien vidéo (sans téléversement)'],
                  ['file', 'Fichier vidéo'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setVideoMode(mode)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${videoMode === mode ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {videoMode === 'url' ? (
              <div className="space-y-2">
                <Field label="Lien de la vidéo" hint={`${VIDEO_PLATFORMS}. La vidéo reste hébergée sur la plateforme : rien à téléverser. Pour une vidéo privée, choisissez « non répertoriée » (YouTube) ou un partage par lien (Drive).`}>
                  <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" className={inputClass} />
                </Field>
                {urlProblem && <p className="text-[11px] text-red-600">Lien non reconnu : collez l'adresse de la vidéo (pas celle de la chaîne ou du dossier).</p>}
                {embed && (
                  <iframe
                    src={embed.src}
                    title="Aperçu de la vidéo"
                    className="w-full max-w-sm aspect-video rounded-xl border border-slate-200 bg-slate-900"
                    allow="encrypted-media; picture-in-picture; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                )}
              </div>
            ) : file ? (
              <FileChip file={file} onRemove={() => setFile(null)} />
            ) : (
              <div className="flex items-center gap-3">
                <UploadButton purpose="lesson" accept="video/mp4,video/webm" label="Téléverser la vidéo (60 Mo max.)" onUploaded={setFile} />
                <span className="text-[11px] text-slate-400">MP4 ou WebM</span>
              </div>
            )}
          </div>
        )}

        {type === 'pdf' && (
          <Field label="Document PDF" hint="20 Mo maximum. Le document n'est accessible qu'aux inscrits.">
            {file ? <FileChip file={file} onRemove={() => setFile(null)} /> : <UploadButton purpose="lesson" accept="application/pdf" label="Téléverser le PDF" onUploaded={setFile} />}
          </Field>
        )}

        {type === 'quiz' && (
          <div className="space-y-3">
            <Field label="Score minimal pour valider (%)">
              <input type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} className={`${inputClass} max-w-[120px]`} />
            </Field>
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-[11px] font-bold flex items-center justify-center shrink-0">{qIndex + 1}</span>
                  <input
                    required
                    minLength={3}
                    value={question.prompt}
                    onChange={(e) => updateQuestion(qIndex, { prompt: e.target.value })}
                    placeholder="Intitulé de la question"
                    className={inputClass}
                  />
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                      aria-label="Supprimer la question"
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-1.5 pl-8">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuestion(qIndex, { answer: oIndex })}
                        title="Bonne réponse"
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer ${
                          question.answer === oIndex ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-400'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <input
                        required
                        value={option}
                        onChange={(e) => updateQuestion(qIndex, { options: question.options.map((o, i) => (i === oIndex ? e.target.value : o)) })}
                        placeholder={`Réponse ${oIndex + 1}`}
                        className={inputClass}
                      />
                      {question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestion(qIndex, {
                              options: question.options.filter((_, i) => i !== oIndex),
                              answer: question.answer === oIndex ? 0 : question.answer > oIndex ? question.answer - 1 : question.answer,
                            })
                          }
                          aria-label="Retirer la réponse"
                          className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {question.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => updateQuestion(qIndex, { options: [...question.options, ''] })}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      + Ajouter une réponse
                    </button>
                  )}
                  <input
                    value={question.explanation ?? ''}
                    onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
                    placeholder="Explication affichée après réussite (facultatif)"
                    className={`${inputClass} text-xs`}
                  />
                </div>
              </div>
            ))}
            {questions.length < 30 && (
              <button
                type="button"
                onClick={() => setQuestions([...questions, emptyQuestion()])}
                className="px-3 py-1.5 rounded-full border border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:border-red-300 hover:text-red-600 cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter une question
              </button>
            )}
            <p className="text-[11px] text-slate-400">Cliquez sur le rond devant une réponse pour la désigner comme bonne réponse. Elle n'est jamais envoyée à l'apprenant avant correction.</p>
          </div>
        )}

        <Field
          label={type === 'text' ? 'Contenu de la leçon' : type === 'quiz' ? 'Consigne (facultatif)' : 'Notes accompagnant la leçon (facultatif)'}
          hint="« ## » en début de ligne pour un intertitre, « - » pour une liste, une ligne vide entre deux paragraphes."
        >
          <textarea
            required={type === 'text'}
            rows={type === 'text' ? 12 : 4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${inputClass} font-normal`}
          />
        </Field>

        <ResourcesEditor resources={resources} onChange={setResources} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="accent-red-600" />
            Visible par les apprenants
          </label>
          {lesson && modules.length > 1 && (
            <label className="inline-flex items-center gap-2 text-xs text-slate-700">
              Module
              <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="rounded-xl border border-slate-200 p-2 text-xs bg-white">
                {modules.map((m, i) => (
                  <option key={m.id} value={m.id}>
                    {i + 1}. {m.title}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <ModalActions onCancel={onClose} submitLabel={lesson ? 'Enregistrer la leçon' : 'Ajouter la leçon'} busy={busy} />
      </form>
    </Modal>
  );
};
