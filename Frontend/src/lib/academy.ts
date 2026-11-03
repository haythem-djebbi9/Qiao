/** QIAO Academy (LMS) : formes renvoyées par l'API (Backend/src/modules/academy) et libellés de l'interface. */
import type { Course, LearningPath, TrainingDomain } from './models';

export type PublicationStatus = 'draft' | 'published' | 'archived';
export type LessonType = 'text' | 'video' | 'pdf' | 'quiz';

/** label : une formation ; masculine : un parcours, un domaine. */
export const STATUS_LABELS: Record<PublicationStatus, { label: string; masculine: string; tone: string }> = {
  draft: { label: 'Brouillon', masculine: 'Brouillon', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  published: { label: 'Publiée', masculine: 'Publié', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  archived: { label: 'Archivée', masculine: 'Archivé', tone: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  text: 'Texte',
  video: 'Vidéo',
  pdf: 'Document PDF',
  quiz: 'Quiz',
};

export const CATALOG_DOMAINS = [
  { id: 'business', label: 'Business & Entrepreneuriat' },
  { id: 'commerce', label: 'Commerce Chine - Afrique du Nord' },
  { id: 'investment', label: 'Investissement & Finance' },
  { id: 'law', label: 'Droit & Réglementation' },
  { id: 'logistics', label: 'Logistique & Import-Export' },
  { id: 'tech', label: 'Technologie & IA' },
  { id: 'languages', label: 'Langues & Communication' },
  { id: 'culture', label: 'Culture & Relations' },
];
export const COURSE_LEVELS = ['Débutant', 'Intermédiaire', 'Avancé / Dirigeant', 'Tous niveaux'];
export const COURSE_FORMATS = ['En ligne à son rythme', 'Masterclass live', 'Parcours certifiant'];
export const BADGE_COLORS = [
  { id: 'bg-red-600', label: 'Rouge' },
  { id: 'bg-blue-600', label: 'Bleu' },
  { id: 'bg-emerald-600', label: 'Vert' },
];
export const DOMAIN_ICONS = ['Briefcase', 'Globe', 'Truck', 'Scale', 'Languages', 'TrendingUp', 'UserCheck'];

export interface FileRef {
  id: string;
  name: string;
  mime: string;
  size: number;
}

/** Support complémentaire d'une leçon : fichier protégé (inscrits) ou lien externe. */
export interface LessonResource {
  id: string;
  kind: 'file' | 'link';
  title: string;
  url: string | null;
  file: FileRef | null;
}

/** Note personnelle d'un apprenant : ancrée à un instant de la vidéo (seconds) ou libre. */
export interface LessonNote {
  id: string;
  lessonId: string;
  seconds: number | null;
  text: string;
  createdAt: string;
  updatedAt: string;
}

/** « 125 » → « 2:05 », « 3725 » → « 1:02:05 ». */
export function formatTimecode(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** « 2:05 » ou « 1:02:05 » → secondes ; null si la saisie est invalide. */
export function parseTimecode(value: string): number | null {
  const parts = value.trim().split(':').map((p) => p.trim());
  if (parts.length === 0 || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
}

export interface AdminQuizQuestion extends QuizQuestion {
  answer: number;
  explanation: string | null;
}

/** Leçon telle que la voit l'apprenant (sans les réponses du quiz). */
export interface LearnLesson {
  id: string;
  moduleId: string;
  title: string;
  type: LessonType;
  durationMinutes: number;
  published: boolean;
  content: string | null;
  videoUrl: string | null;
  file: FileRef | null;
  resources: LessonResource[];
  quiz: { passingScore: number; questions: QuizQuestion[] } | null;
  completed: boolean;
  completedAt: string | null;
  bestScore: number | null;
  attempts: number;
}

export interface LearnEnrollment {
  id: string;
  progress: number;
  status: 'active' | 'completed';
  source: 'order' | 'admin' | 'path';
  lastLessonId: string | null;
  lastActivityAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

/** Certificat de réussite délivré automatiquement à la fin d'une formation. */
export interface CertificateSummary {
  id: string;
  number: string;
  status: 'valid' | 'revoked';
  issuedAt: string;
  /** Moyenne des meilleurs scores aux quiz (%), null si la formation n'a pas de quiz. */
  averageScore: number | null;
  lessonsCount: number;
  quizzesCount: number;
  revokedAt: string | null;
}

export interface AdminCertificate extends CertificateSummary {
  revokedReason: string | null;
}

/** Réponse publique de vérification : ni score ni motif de révocation. */
export interface CertificateVerification {
  number: string;
  status: 'valid' | 'revoked';
  holderName: string;
  courseTitle: string;
  issuedAt: string;
  revokedAt: string | null;
}

/** Page publique de vérification d'un certificat (lien imprimé sur le PDF). */
export const certificateVerifyHref = (number: string) => `?tab=certificat&numero=${encodeURIComponent(number)}`;

export interface LearnView {
  mode: 'learner' | 'preview';
  course: Pick<Course, 'id' | 'title' | 'description' | 'image' | 'instructor' | 'instructorRole' | 'instructorImg' | 'level' | 'format' | 'duration'> & {
    status: PublicationStatus;
  };
  enrollment: LearnEnrollment | null;
  certificate: CertificateSummary | null;
  modules: { id: string; title: string; description: string | null; lessons: LearnLesson[] }[];
  stats: { totalLessons: number; completedLessons: number; progress: number };
}

export interface ProgressSummary {
  progress: number;
  status: 'active' | 'completed';
  completedLessons: number;
  totalLessons: number;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  passingScore: number;
  correctCount: number;
  total: number;
  recorded: boolean;
  results: { questionId: string; selected: number; correct: boolean; answer: number | null; explanation: string | null }[];
  lesson?: { id: string; completed: boolean; completedAt: string | null; bestScore: number | null; attempts: number };
  progress?: number;
  status?: 'active' | 'completed';
  completedLessons?: number;
  totalLessons?: number;
}

export interface CourseOutline {
  course: Course;
  modules: { id: string; title: string; lessons: { id: string; title: string; type: LessonType; durationMinutes: number }[] }[];
  lessonsCount: number;
  totalMinutes: number;
}

// --- Administration -----------------------------------------------------------

export interface CourseStats {
  modules: number;
  lessons: number;
  publishedLessons: number;
  learners: number;
  completions: number;
  averageProgress: number;
}

export interface AdminCourse extends Course {
  status: PublicationStatus;
  trainingDomainId: string | null;
  trainingDomainTitle?: string | null;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  stats: CourseStats;
}

export interface AdminLesson {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  type: LessonType;
  content: string | null;
  videoUrl: string | null;
  fileId: string | null;
  file: FileRef | null;
  resources: LessonResource[];
  durationMinutes: number;
  sortOrder: number;
  published: boolean;
  quiz: { passingScore: number; questions: AdminQuizQuestion[] } | null;
}

export interface AdminModule {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: AdminLesson[];
}

export interface AdminCourseDetail extends AdminCourse {
  paths: { id: string; title: string }[];
  curriculum: AdminModule[];
}

export interface AdminPath extends Omit<LearningPath, 'courses'> {
  status: PublicationStatus;
  courseIds: string[];
  sortOrder: number;
  courses: { id: string; title: string; status: PublicationStatus; price: number }[];
  stats: { learners: number; averageProgress: number };
}

export interface AdminDomain extends TrainingDomain {
  status: PublicationStatus;
  sortOrder: number;
  linkedCourses: number;
  publishedCourses: number;
}

export interface Overview {
  courses: Record<PublicationStatus | 'total', number>;
  paths: Record<PublicationStatus | 'total', number>;
  domains: Record<PublicationStatus | 'total', number>;
  lessons: number;
  enrollments: number;
  learners: number;
  completions: number;
  averageProgress: number;
}

export interface Member {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  company: string | null;
}

export interface CourseLearners {
  course: { id: string; title: string; status: PublicationStatus };
  lessons: { id: string; title: string; type: LessonType; moduleTitle: string }[];
  learners: {
    enrollmentId: string;
    user: Member;
    source: 'order' | 'admin' | 'path';
    viaPath: string | null;
    started: boolean;
    enrolledAt: string;
    progress: number;
    status: 'active' | 'completed';
    lastActivityAt: string | null;
    completedAt: string | null;
    completedLessons: number;
    lessons: Record<string, { completedAt: string | null; bestScore: number | null; attempts: number }>;
    certificate: AdminCertificate | null;
  }[];
  summary: { learners: number; completions: number; averageProgress: number; notStarted: number };
}

export interface LearnerRow {
  id: string;
  itemType: 'course' | 'path';
  itemId: string;
  title: string;
  progress: number;
  status: 'active' | 'completed';
  source: 'order' | 'admin' | 'path';
  viaPath: string | null;
  lastActivityAt: string | null;
  completedAt: string | null;
  createdAt: string;
  user: Member;
}

export const SOURCE_LABELS: Record<'order' | 'admin' | 'path', string> = {
  order: 'Commande',
  admin: 'Accès offert',
  path: 'Via un parcours',
};

// --- Utilitaires ------------------------------------------------------------------

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Lecteur intégré pour YouTube et Vimeo ; null pour un lien direct (balise vidéo). */
export type VideoProvider = 'youtube' | 'vimeo' | 'dailymotion' | 'drive' | 'loom';

/** Plateformes reconnues : la vidéo reste hébergée chez elles (rien à téléverser). */
export const VIDEO_PLATFORMS = 'YouTube, Vimeo, Dailymotion, Google Drive, Loom ou lien direct MP4 / WebM';

/** Lecteur intégrable d'un lien vidéo ; null pour un fichier direct (MP4 / WebM) lu par le navigateur. */
export function videoEmbed(url: string): { provider: VideoProvider; src: string } | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\.|^m\./, '');
    // L'API du lecteur (enablejsapi) permet de lire l'instant courant et de s'y rendre depuis les notes.
    const youtube = (id: string) => ({ provider: 'youtube' as const, src: `https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&rel=0&origin=${encodeURIComponent(window.location.origin)}` });
    if (host === 'youtu.be') return youtube(parsed.pathname.slice(1));
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const id = parsed.searchParams.get('v') ?? parsed.pathname.match(/\/(?:embed|shorts|live)\/([\w-]+)/)?.[1];
      return id ? youtube(id) : null;
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = parsed.pathname.match(/(\d{6,})/)?.[1];
      const hash = parsed.searchParams.get('h') ?? parsed.pathname.match(/\/\d{6,}\/([\da-f]{6,})/)?.[1];
      return id ? { provider: 'vimeo', src: `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ''}` } : null;
    }
    if (host === 'dailymotion.com' || host === 'dai.ly' || host === 'geo.dailymotion.com') {
      const id = host === 'dai.ly' ? parsed.pathname.slice(1) : (parsed.searchParams.get('video') ?? parsed.pathname.match(/\/video\/([a-z0-9]+)/i)?.[1]);
      return id ? { provider: 'dailymotion', src: `https://www.dailymotion.com/embed/video/${id}` } : null;
    }
    if (host === 'drive.google.com') {
      const id = parsed.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] ?? parsed.searchParams.get('id');
      return id ? { provider: 'drive', src: `https://drive.google.com/file/d/${id}/preview` } : null;
    }
    if (host === 'loom.com') {
      const id = parsed.pathname.match(/\/(?:share|embed)\/([\da-f]+)/i)?.[1];
      return id ? { provider: 'loom', src: `https://www.loom.com/embed/${id}` } : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function videoEmbedUrl(url: string): string | null {
  return videoEmbed(url)?.src ?? null;
}

/** Lien utilisable : plateforme reconnue ou fichier vidéo direct. */
export function isPlayableVideoUrl(url: string): boolean {
  if (videoEmbed(url)) return true;
  try {
    return /\.(mp4|webm|m4v|mov)$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

/** Première leçon non terminée (ou la dernière ouverte), pour reprendre la formation. */
export function resumeLesson(view: LearnView): LearnLesson | null {
  const lessons = view.modules.flatMap((m) => m.lessons);
  const last = lessons.find((l) => l.id === view.enrollment?.lastLessonId);
  if (last && !last.completed) return last;
  return lessons.find((l) => !l.completed) ?? last ?? lessons[0] ?? null;
}
