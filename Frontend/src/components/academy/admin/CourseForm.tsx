import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { api } from '../../../lib/api';
import {
  AdminCourseDetail,
  AdminDomain,
  BADGE_COLORS,
  CATALOG_DOMAINS,
  COURSE_FORMATS,
  COURSE_LEVELS,
  formatMinutes,
} from '../../../lib/academy';
import { useToast } from '../../../context/ToastContext';
import { Field, errorMessage, inputClass } from '../../community/ui';
import { ImageField } from '../ui';
import { SeoAssistant } from '../../seo/SeoAssistant';

/** Informations de la formation (création et modification). */
export const CourseForm: React.FC<{
  course: AdminCourseDetail | null;
  onSaved: (course: AdminCourseDetail) => void;
  onCancel?: () => void;
}> = ({ course, onSaved, onCancel }) => {
  const { notify } = useToast();
  const [domains, setDomains] = useState<AdminDomain[]>([]);
  const [busy, setBusy] = useState(false);
  const autoLabel = (c: AdminCourseDetail) => (c.duration === formatMinutes(c.durationMinutes) ? '' : c.duration);
  const [form, setForm] = useState(() => ({
    title: course?.title ?? '',
    description: course?.description ?? '',
    instructor: course?.instructor ?? '',
    instructorRole: course?.instructorRole ?? '',
    instructorImg: course?.instructorImg ?? '',
    image: course?.image ?? '',
    price: course?.price ?? 0,
    durationMinutes: course?.durationMinutes ?? 60,
    duration: course ? autoLabel(course) : '',
    domain: course?.domain ?? 'business',
    level: course?.level ?? 'Débutant',
    format: course?.format ?? 'En ligne à son rythme',
    badge: course?.badge ?? '',
    badgeColor: course?.badgeColor ?? 'bg-red-600',
    sections: course?.sections ?? [],
    trainingDomainId: course?.trainingDomainId ?? '',
    sortOrder: course?.sortOrder ?? 0,
  }));
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    api.get<AdminDomain[]>('/academy/admin/domains').then(setDomains).catch(() => undefined);
  }, []);

  const toggleSection = (id: string) => set({ sections: form.sections.includes(id) ? form.sections.filter((s) => s !== id) : [...form.sections, id] });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      ...form,
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
      sortOrder: Number(form.sortOrder),
      instructorImg: form.instructorImg || null,
      image: form.image || null,
      instructorRole: form.instructorRole || null,
      badge: form.badge || null,
      trainingDomainId: form.trainingDomainId || null,
      ...(course ? {} : { sortOrder: undefined }),
    };
    try {
      const saved = course
        ? await api.patch<AdminCourseDetail>(`/academy/admin/courses/${course.id}`, payload)
        : await api.post<AdminCourseDetail>('/academy/admin/courses', payload);
      notify(course ? 'Formation enregistrée.' : 'Formation créée en brouillon : ajoutez maintenant ses modules et leçons.');
      onSaved(saved);
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Titre de la formation">
        <input required minLength={3} maxLength={200} value={form.title} onChange={(e) => set({ title: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Présentation" hint="Affichée dans la fiche de la formation.">
        <textarea required minLength={10} rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} className={inputClass} />
      </Field>
      <SeoAssistant
        kind="course"
        fields={{
          Titre: form.title,
          Description: form.description,
          Formateur: form.instructor,
          'Fonction du formateur': form.instructorRole,
          'Domaine du catalogue': form.domain,
          Niveau: form.level,
          Format: form.format,
          'Durée (minutes)': form.durationMinutes ? String(form.durationMinutes) : '',
          'Prix (TND)': String(form.price),
          Badge: form.badge,
        }}
        onApply={{ title: (title) => set({ title: title.slice(0, 200) }), description: (description) => set({ description: description.slice(0, 5000) }) }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Formateur">
          <input required minLength={2} value={form.instructor} onChange={(e) => set({ instructor: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Fonction du formateur">
          <input value={form.instructorRole} onChange={(e) => set({ instructorRole: e.target.value })} placeholder="Expert QIAO Academy" className={inputClass} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Image de couverture">
          <ImageField value={form.image} onChange={(image) => set({ image })} />
        </Field>
        <Field label="Photo du formateur">
          <ImageField value={form.instructorImg} onChange={(instructorImg) => set({ instructorImg })} />
        </Field>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="Prix (TND)">
          <input required type="number" min={0} max={100000} value={form.price} onChange={(e) => set({ price: Number(e.target.value) })} className={inputClass} />
        </Field>
        <Field label="Durée (minutes)">
          <input
            required
            type="number"
            min={0}
            max={100000}
            value={form.durationMinutes}
            onChange={(e) => set({ durationMinutes: Number(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field label="Libellé de durée" hint="Facultatif">
          <input value={form.duration} maxLength={30} onChange={(e) => set({ duration: e.target.value })} placeholder={formatMinutes(Number(form.durationMinutes) || 0)} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Domaine du catalogue">
          <select value={form.domain} onChange={(e) => set({ domain: e.target.value })} className={inputClass}>
            {CATALOG_DOMAINS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Niveau">
          <select value={form.level} onChange={(e) => set({ level: e.target.value })} className={inputClass}>
            {COURSE_LEVELS.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </Field>
        <Field label="Format">
          <select value={form.format} onChange={(e) => set({ format: e.target.value })} className={inputClass}>
            {COURSE_FORMATS.map((format) => (
              <option key={format}>{format}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Emplacement"
        hint="Une formation rattachée à un domaine de formation apparaît dans la fenêtre de ce domaine (section QIAO Academy de l'accueil) et non dans le catalogue de la page Academy."
      >
        <select value={form.trainingDomainId} onChange={(e) => set({ trainingDomainId: e.target.value })} className={inputClass}>
          <option value="">Catalogue de la page Academy</option>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              Domaine de l'accueil : {d.title}
              {d.status !== 'published' ? ' (non publié)' : ''}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Badge" hint="Ex. Nouveau, Best-seller (facultatif)">
          <input value={form.badge} maxLength={30} onChange={(e) => set({ badge: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Couleur du badge">
          <select value={form.badgeColor} onChange={(e) => set({ badgeColor: e.target.value })} disabled={!form.badge} className={inputClass}>
            {BADGE_COLORS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        {course && (
          <Field label="Ordre d'affichage">
            <input type="number" min={0} value={form.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) })} className={inputClass} />
          </Field>
        )}
      </div>

      <div>
        <span className="block text-xs font-semibold text-slate-700 mb-1.5">Mise en avant sur la page Academy</span>
        <div className="flex flex-wrap gap-2">
          {[
            ['popular', 'Formations populaires'],
            ['new', 'Nouvelles formations'],
          ].map(([id, label]) => (
            <label key={id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" checked={form.sections.includes(id)} onChange={() => toggleSection(id)} className="accent-red-600" />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="pt-2 flex items-center justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={busy}
          className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {course ? 'Enregistrer' : 'Créer la formation'}
        </button>
      </div>
    </form>
  );
};
