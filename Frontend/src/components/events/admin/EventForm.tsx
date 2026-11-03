import React, { useState } from 'react';
import { Check, ImagePlus, Loader2, MapPin, Monitor, Save, Shuffle } from 'lucide-react';
import { api } from '../../../lib/api';
import { resolveImage } from '../../../lib/assets';
import {
  AdminEvent,
  EVENT_CATEGORY_OPTIONS,
  EVENT_FORMAT_LABELS,
  EVENT_IMAGE_LIBRARY,
  EVENT_PLACEMENT_OPTIONS,
  EVENT_TYPE_SUGGESTIONS,
} from '../../../lib/events';
import { EventFormat } from '../../../lib/models';
import { useToast } from '../../../context/ToastContext';
import { Field, errorMessage, inputClass } from '../../community/ui';
import { SeoAssistant } from '../../seo/SeoAssistant';

const FORMAT_ICONS: Record<EventFormat, React.ComponentType<{ className?: string }>> = { onsite: MapPin, online: Monitor, hybrid: Shuffle };

const emptyForm = (event: AdminEvent | null) => ({
  title: event?.title ?? '',
  category: event?.category ?? '',
  categoryKey: event?.categoryKey ?? 'salons',
  startDate: event?.startDate ?? '',
  endDate: event?.endDate ?? '',
  time: event?.time ?? '',
  format: event?.format ?? ('onsite' as EventFormat),
  location: event?.location ?? '',
  country: event?.country ?? '',
  onlineUrl: event?.onlineUrl ?? '',
  priceLabel: event?.priceLabel ?? '',
  image: event?.image ?? EVENT_IMAGE_LIBRARY[0],
  description: event?.description ?? '',
  placements: event?.placements ?? ['events-page'],
  capacity: event?.capacity ?? 0,
  registrationOpen: event?.registrationOpen ?? true,
  organizer: event?.details?.organizer ?? '',
  expectedAttendees: event?.details?.expectedAttendees ?? '',
  venue: event?.details?.venue ?? '',
  focusSectors: (event?.details?.focusSectors ?? []).join(', '),
  programHighlights: (event?.details?.programHighlights ?? []).join('\n'),
  website: event?.details?.website ?? '',
});

/** Bibliothèque de visuels QIAO, ou lien https. */
const ImagePicker: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
      {EVENT_IMAGE_LIBRARY.map((src) => (
        <button
          key={src}
          type="button"
          onClick={() => onChange(src)}
          aria-label="Choisir ce visuel"
          aria-pressed={value === src}
          className={`relative h-12 rounded-lg overflow-hidden border-2 cursor-pointer ${value === src ? 'border-red-600' : 'border-transparent hover:border-slate-300'}`}
        >
          <img src={resolveImage(src)} alt="" className="w-full h-full object-cover" />
          {value === src && (
            <span className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </span>
          )}
        </button>
      ))}
    </div>
    <div className="flex items-center gap-2">
      <div className="w-16 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
        {value ? <img src={resolveImage(value)} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-4 h-4 text-slate-300" />}
      </div>
      <input
        value={value.startsWith('asset:') ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={value.startsWith('asset:') ? 'Visuel QIAO sélectionné — ou collez un lien https://…' : 'https://…'}
        className={inputClass}
      />
    </div>
  </div>
);

/** Fiche d'un événement : création (en brouillon) ou modification. */
export const EventForm: React.FC<{ event: AdminEvent | null; onSaved: (event: AdminEvent) => void; onCancel?: () => void }> = ({ event, onSaved, onCancel }) => {
  const { notify } = useToast();
  const [form, setForm] = useState(() => emptyForm(event));
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const online = form.format !== 'onsite';
  const confirmed = event?.stats.confirmed ?? 0;

  const togglePlacement = (id: string) =>
    set({ placements: form.placements.includes(id) ? form.placements.filter((p) => p !== id) : [...form.placements, id] });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasDetails = [form.organizer, form.expectedAttendees, form.venue, form.focusSectors, form.programHighlights, form.website].some((v) => v.trim());
    const payload = {
      title: form.title,
      category: form.category,
      categoryKey: form.categoryKey,
      startDate: form.startDate,
      endDate: form.endDate || null,
      time: form.time,
      format: form.format,
      location: form.location,
      country: form.country,
      onlineUrl: online ? form.onlineUrl.trim() || null : null,
      priceLabel: form.priceLabel.trim() || null,
      image: form.image.trim() || null,
      description: form.description,
      placements: form.placements,
      capacity: Math.max(0, Math.round(Number(form.capacity) || 0)),
      registrationOpen: form.registrationOpen,
      details: hasDetails
        ? {
            organizer: form.organizer,
            expectedAttendees: form.expectedAttendees,
            venue: form.venue,
            focusSectors: form.focusSectors.split(',').map((s) => s.trim()).filter(Boolean),
            programHighlights: form.programHighlights.split('\n').map((s) => s.trim()).filter(Boolean),
            ...(form.website.trim() ? { website: form.website.trim() } : {}),
          }
        : null,
    };
    setBusy(true);
    try {
      const saved = event
        ? await api.patch<AdminEvent>(`/events/admin/events/${event.id}`, payload)
        : await api.post<AdminEvent>('/events/admin/events', payload);
      notify(event ? 'Événement enregistré.' : 'Événement créé en brouillon : publiez-le quand il est prêt.');
      onSaved(saved);
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const legend = 'text-[11px] font-bold uppercase tracking-wider text-slate-400';

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset className="space-y-3">
        <legend className={legend}>L'événement</legend>
        <Field label="Titre">
          <input required minLength={3} maxLength={200} value={form.title} onChange={(e) => set({ title: e.target.value })} className={inputClass} placeholder="Forum d'affaires Chine - Tunisie 2027" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Type affiché" hint="Badge de la carte (Salon, Webinaire, Atelier…).">
            <input required minLength={2} maxLength={40} list="event-type-suggestions" value={form.category} onChange={(e) => set({ category: e.target.value })} className={inputClass} />
            <datalist id="event-type-suggestions">
              {EVENT_TYPE_SUGGESTIONS.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </Field>
          <Field label="Rubrique de la page Événements">
            <select value={form.categoryKey} onChange={(e) => set({ categoryKey: e.target.value })} className={inputClass}>
              {EVENT_CATEGORY_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Description">
          <textarea required minLength={10} maxLength={5000} rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Visuel">
          <ImagePicker value={form.image} onChange={(image) => set({ image })} />
        </Field>
        <SeoAssistant
          kind="event"
          fields={{
            Titre: form.title,
            Type: form.category,
            Rubrique: EVENT_CATEGORY_OPTIONS.find((o) => o.id === form.categoryKey)?.label,
            Description: form.description,
            'Date de début': form.startDate,
            'Date de fin': form.endDate,
            Horaires: form.time,
            Format: EVENT_FORMAT_LABELS[form.format],
            Ville: form.location,
            Pays: form.country,
            Tarif: form.priceLabel || 'Gratuit',
            Places: form.capacity > 0 ? String(form.capacity) : 'illimitées',
            Organisateur: form.organizer,
            'Participants attendus': form.expectedAttendees,
            'Lieu précis': form.venue,
            Secteurs: form.focusSectors,
            Programme: form.programHighlights,
          }}
          onApply={{ title: (title) => set({ title: title.slice(0, 200) }), description: (description) => set({ description: description.slice(0, 5000) }) }}
        />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className={legend}>Date et format</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Date de début">
            <input required type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Date de fin" hint="Vide pour un événement d'une journée.">
            <input type="date" min={form.startDate || undefined} value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Horaires">
            <input required minLength={2} maxLength={60} value={form.time} onChange={(e) => set({ time: e.target.value })} className={inputClass} placeholder="09:00 - 18:00 (GMT+1)" />
          </Field>
        </div>
        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-1">Format</span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Format">
            {(Object.keys(EVENT_FORMAT_LABELS) as EventFormat[]).map((format) => {
              const Icon = FORMAT_ICONS[format];
              const active = form.format === format;
              return (
                <button
                  key={format}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => set({ format })}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                    active ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {EVENT_FORMAT_LABELS[format]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={form.format === 'online' ? 'Lieu affiché' : 'Ville'}>
            <input
              required
              minLength={2}
              maxLength={120}
              value={form.location}
              onChange={(e) => set({ location: e.target.value })}
              className={inputClass}
              placeholder={form.format === 'online' ? 'En ligne (Zoom)' : 'Tunis, Tunisie'}
            />
          </Field>
          <Field label="Pays">
            <input required minLength={2} maxLength={60} value={form.country} onChange={(e) => set({ country: e.target.value })} className={inputClass} placeholder="Tunisie" />
          </Field>
        </div>
        {online && (
          <Field label="Lien de connexion" hint="Communiqué uniquement aux participants confirmés, dans leur espace QIAO. Jamais affiché sur la page publique.">
            <input type="url" pattern="https://.*" maxLength={500} value={form.onlineUrl} onChange={(e) => set({ onlineUrl: e.target.value })} className={inputClass} placeholder="https://zoom.us/j/…" />
          </Field>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className={legend}>Inscriptions et places</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Nombre de places"
            hint={confirmed > 0 ? `0 = illimité. ${confirmed} participant(s) déjà confirmé(s) : la jauge ne peut pas descendre en dessous.` : "0 = illimité. Une fois complet, les inscriptions passent en liste d'attente."}
          >
            <input type="number" min={0} max={100000} value={form.capacity} onChange={(e) => set({ capacity: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Tarif indicatif" hint="Affiché sur la fiche ; aucun paiement en ligne. Vide = gratuit.">
            <input maxLength={80} value={form.priceLabel} onChange={(e) => set({ priceLabel: e.target.value })} className={inputClass} placeholder="Gratuit pour les membres" />
          </Field>
        </div>
        <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
          <input type="checkbox" checked={form.registrationOpen} onChange={(e) => set({ registrationOpen: e.target.checked })} className="mt-0.5 accent-red-600" />
          <span>
            <span className="font-semibold">Inscriptions ouvertes</span>
            <span className="block text-[11px] text-slate-400">Elles se ferment automatiquement le jour de l'événement.</span>
          </span>
        </label>
        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-1">Afficher sur</span>
          <div className="flex flex-wrap gap-3">
            {EVENT_PLACEMENT_OPTIONS.map((option) => (
              <label key={option.id} className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.placements.includes(option.id)} onChange={() => togglePlacement(option.id)} className="accent-red-600" />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className={legend}>Fiche détaillée (facultatif)</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Organisateur">
            <input maxLength={200} value={form.organizer} onChange={(e) => set({ organizer: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Participants attendus">
            <input maxLength={200} value={form.expectedAttendees} onChange={(e) => set({ expectedAttendees: e.target.value })} className={inputClass} placeholder="300 décideurs" />
          </Field>
          <Field label="Lieu précis">
            <input maxLength={200} value={form.venue} onChange={(e) => set({ venue: e.target.value })} className={inputClass} placeholder="Palais des Congrès, Tunis" />
          </Field>
          <Field label="Site web officiel">
            <input type="url" pattern="https://.*" value={form.website} onChange={(e) => set({ website: e.target.value })} className={inputClass} placeholder="https://…" />
          </Field>
        </div>
        <Field label="Secteurs" hint="Séparés par des virgules.">
          <input value={form.focusSectors} onChange={(e) => set({ focusSectors: e.target.value })} className={inputClass} placeholder="Énergies renouvelables, Agro-industrie" />
        </Field>
        <Field label="Temps forts du programme" hint="Un par ligne.">
          <textarea rows={3} value={form.programHighlights} onChange={(e) => set({ programHighlights: e.target.value })} className={inputClass} />
        </Field>
      </fieldset>

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
            Annuler
          </button>
        )}
        <button type="submit" disabled={busy} className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {event ? 'Enregistrer' : "Créer l'événement"}
        </button>
      </div>
    </form>
  );
};
