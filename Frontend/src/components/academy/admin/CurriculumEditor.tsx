import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Import, Layers, Paperclip, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../../lib/api';
import { AdminCourseDetail, AdminLesson, AdminModule, LESSON_TYPE_LABELS, LessonType } from '../../../lib/academy';
import { useToast } from '../../../context/ToastContext';
import { ActionMenu } from '../../community/PostCard';
import { Card, EmptyState, Field, Modal, ModalActions, SectionTitle, errorMessage, inputClass } from '../../community/ui';
import { LessonTypeIcon } from '../ui';
import { LessonForm } from './LessonForm';

const move = <T,>(list: T[], index: number, delta: number) => {
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(index + delta, 0, item);
  return next;
};

const ModuleForm: React.FC<{ course: AdminCourseDetail; module: AdminModule | null; onClose: () => void; onSaved: (c: AdminCourseDetail) => void }> = ({
  course,
  module,
  onClose,
  onSaved,
}) => {
  const { notify } = useToast();
  const [title, setTitle] = useState(module?.title ?? '');
  const [description, setDescription] = useState(module?.description ?? '');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { title, description: description || null };
      onSaved(
        module
          ? await api.patch<AdminCourseDetail>(`/academy/admin/modules/${module.id}`, payload)
          : await api.post<AdminCourseDetail>(`/academy/admin/courses/${course.id}/modules`, payload),
      );
      notify(module ? 'Module enregistré.' : 'Module ajouté.');
      onClose();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={module ? 'Modifier le module' : 'Nouveau module'} icon={<Layers className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Titre du module">
          <input required minLength={2} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Objectifs du module (facultatif)">
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
        </Field>
        <ModalActions onCancel={onClose} submitLabel={module ? 'Enregistrer' : 'Ajouter le module'} busy={busy} />
      </form>
    </Modal>
  );
};

const QUICK_TYPES: { type: LessonType; label: string; hint: string }[] = [
  { type: 'video', label: 'Vidéo', hint: 'Lien YouTube, Vimeo, Drive… ou fichier' },
  { type: 'pdf', label: 'Document PDF', hint: 'Support de cours lisible en ligne' },
  { type: 'text', label: 'Texte', hint: 'Cours rédigé, intertitres, listes' },
  { type: 'quiz', label: 'Quiz', hint: 'Questions corrigées automatiquement' },
];

/** Boutons d'ajout direct d'une leçon par type. */
const QuickAdd: React.FC<{ onPick: (type: LessonType) => void; disabled?: boolean }> = ({ onPick, disabled }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <span className="text-[11px] font-semibold text-slate-500 mr-1 inline-flex items-center gap-1">
      <Plus className="w-3.5 h-3.5 text-red-600" /> Ajouter :
    </span>
    {QUICK_TYPES.map(({ type, label }) => (
      <button
        key={type}
        type="button"
        disabled={disabled}
        onClick={() => onPick(type)}
        className="px-2.5 py-1 rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:border-red-300 hover:text-red-600 cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
      >
        <LessonTypeIcon type={type} className="w-3.5 h-3.5" /> {label}
      </button>
    ))}
  </div>
);

/** Programme de la formation : modules ordonnés, leçons ordonnées, visibilité de chaque leçon. */
export const CurriculumEditor: React.FC<{ course: AdminCourseDetail; onChange: (course: AdminCourseDetail) => void }> = ({ course, onChange }) => {
  const { notify } = useToast();
  const [moduleForm, setModuleForm] = useState<AdminModule | 'new' | null>(null);
  const [lessonForm, setLessonForm] = useState<{ module: AdminModule; lesson: AdminLesson | null; type?: LessonType } | null>(null);
  const [busy, setBusy] = useState(false);
  const modules = course.curriculum;

  const run = async (action: () => Promise<AdminCourseDetail>, success: string) => {
    setBusy(true);
    try {
      onChange(await action());
      notify(success);
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const reorderModules = (index: number, delta: number) =>
    run(() => api.put<AdminCourseDetail>(`/academy/admin/courses/${course.id}/modules/order`, { ids: move(modules, index, delta).map((m) => m.id) }), 'Ordre des modules enregistré.');
  const reorderLessons = (module: AdminModule, index: number, delta: number) =>
    run(() => api.put<AdminCourseDetail>(`/academy/admin/modules/${module.id}/lessons/order`, { ids: move(module.lessons, index, delta).map((l) => l.id) }), 'Ordre des leçons enregistré.');

  /** Formation vide : un premier module est créé, puis la leçon choisie s'ouvre directement. */
  const startWith = async (type: LessonType) => {
    setBusy(true);
    try {
      const updated = await api.post<AdminCourseDetail>(`/academy/admin/courses/${course.id}/modules`, { title: 'Introduction', description: null });
      onChange(updated);
      const first = updated.curriculum[0];
      if (first) setLessonForm({ module: first, lesson: null, type });
      notify('Premier module créé : renommez-le à tout moment.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalMinutes = modules.reduce((sum, m) => sum + m.lessons.reduce((s, l) => s + l.durationMinutes, 0), 0);

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          title={`Programme — ${modules.length} module${modules.length > 1 ? 's' : ''}, ${totalLessons} leçon${totalLessons > 1 ? 's' : ''}${totalMinutes ? ` (${totalMinutes} min)` : ''}`}
          action={
            <button
              onClick={() => setModuleForm('new')}
              className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter un module
            </button>
          }
        />
        {modules.length === 0 ? (
          <div className="space-y-3">
            <EmptyState icon={<Layers className="w-10 h-10" />} text="Cette formation n'a pas encore de contenu. Commencez par ajouter une première leçon :" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_TYPES.map(({ type, label, hint }) => (
                <button
                  key={type}
                  type="button"
                  disabled={busy}
                  onClick={() => startWith(type)}
                  className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-red-300 hover:shadow-sm text-left cursor-pointer disabled:opacity-50"
                >
                  <span className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2">
                    <LessonTypeIcon type={type} className="w-4 h-4" />
                  </span>
                  <span className="block text-xs font-bold text-slate-900">{label}</span>
                  <span className="block text-[10px] text-slate-500">{hint}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
              <Paperclip className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Chaque leçon peut aussi recevoir des supports téléchargeables (PDF, Word, Excel, PowerPoint) ou des liens.
            </p>
            {course.modules.length > 0 && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-blue-900">
                  <strong>Programme existant :</strong> {course.modules.join(' · ')}
                </div>
                <button
                  disabled={busy}
                  onClick={() => run(() => api.post<AdminCourseDetail>(`/academy/admin/courses/${course.id}/import-syllabus`), 'Programme importé en modules.')}
                  className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shrink-0 disabled:opacity-60"
                >
                  <Import className="w-3.5 h-3.5" /> Créer ces {course.modules.length} modules
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">
            La progression des apprenants = leçons visibles terminées ÷ leçons visibles. Une leçon masquée n'est ni affichée ni comptée.
          </p>
        )}
      </Card>

      {modules.map((module, mIndex) => (
        <div key={module.id} className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">{mIndex + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">{module.title}</div>
              {module.description && <div className="text-[11px] text-slate-500 truncate">{module.description}</div>}
            </div>
            <div className="flex items-center gap-0.5">
              <button disabled={busy || mIndex === 0} onClick={() => reorderModules(mIndex, -1)} aria-label="Monter le module" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-30 cursor-pointer">
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                disabled={busy || mIndex === modules.length - 1}
                onClick={() => reorderModules(mIndex, 1)}
                aria-label="Descendre le module"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-30 cursor-pointer"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <ActionMenu
                items={[
                  { label: 'Modifier le module', icon: Pencil, onClick: () => setModuleForm(module) },
                  {
                    label: 'Supprimer le module',
                    icon: Trash2,
                    danger: true,
                    onClick: () =>
                      window.confirm(
                        `Supprimer « ${module.title} »${module.lessons.length ? ` et ses ${module.lessons.length} leçon(s)` : ''} ? La progression des apprenants sera recalculée.`,
                      ) && run(() => api.delete<AdminCourseDetail>(`/academy/admin/modules/${module.id}`), 'Module supprimé.'),
                  },
                ]}
              />
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {module.lessons.map((lesson, lIndex) => (
              <div key={lesson.id} className={`px-5 py-2.5 flex items-center gap-3 ${lesson.published ? '' : 'bg-amber-50/40'}`}>
                <span className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <LessonTypeIcon type={lesson.type} className="w-3.5 h-3.5" />
                </span>
                <button onClick={() => setLessonForm({ module, lesson })} className="flex-1 min-w-0 text-left cursor-pointer group">
                  <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-red-600">{lesson.title}</div>
                  <div className="text-[10px] text-slate-500">
                    {LESSON_TYPE_LABELS[lesson.type]}
                    {lesson.durationMinutes > 0 && ` · ${lesson.durationMinutes} min`}
                    {lesson.type === 'quiz' && lesson.quiz && ` · ${lesson.quiz.questions.length} question(s), ${lesson.quiz.passingScore} % pour valider`}
                    {lesson.file && ` · ${lesson.file.name}`}
                    {lesson.resources.length > 0 && ` · ${lesson.resources.length} support(s)`}
                    {!lesson.published && <span className="ml-1 font-bold text-amber-700">· masquée</span>}
                  </div>
                </button>
                <div className="flex items-center gap-0.5">
                  <button disabled={busy || lIndex === 0} onClick={() => reorderLessons(module, lIndex, -1)} aria-label="Monter la leçon" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={busy || lIndex === module.lessons.length - 1}
                    onClick={() => reorderLessons(module, lIndex, 1)}
                    aria-label="Descendre la leçon"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <ActionMenu
                    items={[
                      { label: 'Modifier', icon: Pencil, onClick: () => setLessonForm({ module, lesson }) },
                      {
                        label: lesson.published ? 'Masquer aux apprenants' : 'Rendre visible',
                        icon: lesson.published ? EyeOff : Eye,
                        onClick: () =>
                          run(
                            () => api.patch<AdminCourseDetail>(`/academy/admin/lessons/${lesson.id}`, { published: !lesson.published }),
                            lesson.published ? 'Leçon masquée.' : 'Leçon visible.',
                          ),
                      },
                      {
                        label: 'Supprimer',
                        icon: Trash2,
                        danger: true,
                        onClick: () =>
                          window.confirm(`Supprimer la leçon « ${lesson.title} » ? La progression des apprenants sera recalculée.`) &&
                          run(() => api.delete<AdminCourseDetail>(`/academy/admin/lessons/${lesson.id}`), 'Leçon supprimée.'),
                      },
                    ]}
                  />
                </div>
              </div>
            ))}
            <div className="px-5 py-2.5">
              <QuickAdd disabled={busy} onPick={(type) => setLessonForm({ module, lesson: null, type })} />
            </div>
          </div>
        </div>
      ))}

      {moduleForm && <ModuleForm course={course} module={moduleForm === 'new' ? null : moduleForm} onClose={() => setModuleForm(null)} onSaved={onChange} />}
      {lessonForm && (
        <LessonForm
          module={lessonForm.module}
          modules={modules}
          lesson={lessonForm.lesson}
          initialType={lessonForm.type}
          onClose={() => setLessonForm(null)}
          onSaved={onChange}
        />
      )}
    </div>
  );
};
