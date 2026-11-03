import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Eye, GraduationCap, Trash2 } from 'lucide-react';
import { api } from '../../../lib/api';
import { resolveImage } from '../../../lib/assets';
import { AdminCourseDetail, PublicationStatus } from '../../../lib/academy';
import { navigateDashboard } from '../../../lib/payments';
import { useToast } from '../../../context/ToastContext';
import { Card, EmptyState, Loading, Pills, errorMessage } from '../../community/ui';
import { StatusActions, StatusBadge } from '../ui';
import { CourseForm } from './CourseForm';
import { CourseLearnersPanel } from './CourseLearnersPanel';
import { CurriculumEditor } from './CurriculumEditor';

const TABS = [
  { id: 'programme', label: 'Programme' },
  { id: 'infos', label: 'Informations & prix' },
  { id: 'inscrits', label: 'Inscrits & progression' },
];

/** Éditeur d'une formation : programme (modules, leçons), informations, inscrits ; publication. */
export const CourseEditor: React.FC<{ courseId: string; tab?: string }> = ({ courseId, tab = 'programme' }) => {
  const { notify } = useToast();
  const [course, setCourse] = useState<AdminCourseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = TABS.some((t) => t.id === tab) ? tab : 'programme';
  const go = (next: string) => navigateDashboard(`admin-academy/formations/${courseId}/${next}`, { replace: true });

  const load = useCallback(() => {
    api
      .get<AdminCourseDetail>(`/academy/admin/courses/${courseId}`)
      .then(setCourse)
      .catch((err) => setError(errorMessage(err)));
  }, [courseId]);
  useEffect(() => load(), [load]);

  const setStatus = async (status: PublicationStatus) => {
    setBusy(true);
    try {
      setCourse(await api.post<AdminCourseDetail>(`/academy/admin/courses/${courseId}/status`, { status }));
      notify(status === 'published' ? 'Formation publiée : elle apparaît dans QIAO Academy.' : status === 'archived' ? 'Formation archivée.' : 'Formation repassée en brouillon.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!course || !window.confirm(`Supprimer définitivement « ${course.title} » et tout son contenu ?`)) return;
    try {
      await api.delete(`/academy/admin/courses/${courseId}`);
      notify('Formation supprimée.');
      navigateDashboard('admin-academy/formations');
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  if (error) {
    return (
      <Card>
        <EmptyState icon={<GraduationCap className="w-10 h-10" />} text={error} action={{ label: 'Retour aux formations', onClick: () => navigateDashboard('admin-academy/formations') }} />
      </Card>
    );
  }
  if (!course) return <Loading />;

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigateDashboard('admin-academy/formations')}
        className="text-xs font-semibold text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Toutes les formations
      </button>
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <img src={resolveImage(course.image)} alt={course.title} className="w-full md:w-40 h-28 rounded-xl object-cover shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={course.status} />
              <span className="text-[11px] text-slate-500">
                {course.price} TND · {course.duration} · {course.level}
                {course.trainingDomainTitle && ` · domaine « ${course.trainingDomainTitle} »`}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{course.title}</h2>
            <div className="text-[11px] text-slate-500">
              {course.stats.modules} module(s) · {course.stats.publishedLessons}/{course.stats.lessons} leçon(s) visibles · {course.stats.learners} inscrit(s) ·{' '}
              {course.stats.completions} terminée(s)
              {course.paths.length > 0 && ` · parcours : ${course.paths.map((p) => p.title).join(', ')}`}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <StatusActions status={course.status} busy={busy} onChange={setStatus} />
              <button
                onClick={() => navigateDashboard(`admin-academy/apercu/${courseId}`)}
                className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Aperçu apprenant
              </button>
              {course.stats.learners === 0 && course.paths.length === 0 && (
                <button onClick={remove} className="px-3 py-1.5 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer inline-flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
              )}
            </div>
            {course.status === 'draft' && course.stats.publishedLessons === 0 && (
              <p className="text-[11px] text-amber-700">Ajoutez au moins une leçon visible pour pouvoir publier la formation.</p>
            )}
          </div>
        </div>
      </Card>

      <Pills options={TABS} value={current} onChange={go} />
      {current === 'programme' && <CurriculumEditor course={course} onChange={setCourse} />}
      {current === 'infos' && (
        <Card>
          <CourseForm key={course.updatedAt} course={course} onSaved={setCourse} />
        </Card>
      )}
      {current === 'inscrits' && <CourseLearnersPanel courseId={courseId} title={course.title} />}
    </div>
  );
};
