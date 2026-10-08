import React, { useEffect, useState } from 'react';
import { X, GraduationCap, Clock, Award, CheckCircle2, ArrowRight, Play, Loader2 } from 'lucide-react';
import { TrainingDomain } from '../../types';
import { api } from '../../lib/api';
import { Course } from '../../lib/models';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface CourseDetailModalProps {
  domain: TrainingDomain | null;
  onClose: () => void;
  onOpenCatalog: () => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  domain,
  onClose,
  onOpenCatalog,
}) => {
  const { requireAuth } = useAuth();
  const { notify } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState<string[]>([]);

  useEffect(() => {
    if (!domain) return;
    setLoading(true);
    api
      .get<{ courses: Course[] }>(`/academy/domains/${domain.id}/courses`)
      .then((data) => setCourses(data.courses))
      .catch((err) => notify(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [domain, notify]);

  if (!domain) return null;

  const enroll = (course: Course) =>
    requireAuth(async () => {
      setEnrolling(course.id);
      try {
        const { order } = await api.post<{ order: { reference: string } }>('/academy/enroll', {
          itemType: 'course',
          itemId: course.id,
        });
        setEnrolled((current) => [...current, course.id]);
        notify(`Inscription validée à « ${course.title} » (commande ${order.reference}).`);
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Inscription impossible.', 'error');
      } finally {
        setEnrolling(null);
      }
    }, 'Connectez-vous pour vous inscrire à cette formation.');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                QIAO Academy
              </span>
              <h3 className="text-lg font-bold text-slate-900">{domain.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Objectifs pédagogiques
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{domain.description}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Formations disponibles dans ce parcours
            </h4>
            <div className="space-y-3">
              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-red-600" /> Chargement des formations...
                </div>
              )}
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-red-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors flex items-center gap-2">
                      <Play className="w-3.5 h-3.5 text-red-600 fill-red-600" />
                      <span>{course.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{course.duration}</span>
                      </span>
                      <span>•</span>
                      <span>{course.level}</span>
                      <span>•</span>
                      <span className="text-amber-600 font-semibold">
                        {course.rating.toFixed(1)}/5 ({course.reviewsCount} avis)
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">{course.price} TND</span>
                    </div>
                  </div>

                  {enrolled.includes(course.id) ? (
                    <span className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Inscrit
                    </span>
                  ) : (
                    <button
                      onClick={() => enroll(course)}
                      disabled={enrolling === course.id}
                      className="px-4 py-2 bg-slate-900 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-60"
                    >
                      {enrolling === course.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      <span>S'inscrire</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-red-50/50 rounded-2xl border border-red-100 text-xs">
            <div className="flex items-center gap-2 text-red-900 font-semibold">
              <Award className="w-4 h-4 text-red-600 shrink-0" />
              <span>Certificat de réussite certifié QIAO</span>
            </div>
            <div className="flex items-center gap-2 text-red-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
              <span>Accès illimité aux vidéos 24/7</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-white"
          >
            Fermer
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenCatalog();
            }}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>Accéder au catalogue complet</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
