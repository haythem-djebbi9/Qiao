import React, { useEffect, useState } from 'react';
import { X, Calendar, CheckCircle2, ShieldCheck, ArrowRight, Loader2, AlertCircle, Video } from 'lucide-react';
import { api } from '../../lib/api';
import { Appointment } from '../../lib/models';
import { useAuth } from '../../context/AuthContext';
import { AppointmentContext } from '../../context/AppActionsContext';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: AppointmentContext;
}

interface Availability {
  closed: boolean;
  slots: { time: string; available: boolean }[];
}

/** Prochain jour ouvré (les consultations ont lieu du lundi au vendredi). */
function nextBusinessDay(): string {
  const date = new Date();
  do {
    date.setDate(date.getDate() + 1);
  } while (date.getDay() === 0 || date.getDay() === 6);
  return date.toISOString().slice(0, 10);
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  context,
}) => {
  const { user } = useAuth();
  const [specialty, setSpecialty] = useState<string>('sourcing');
  const [selectedDate, setSelectedDate] = useState(nextBusinessDay);
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setConfirmed(null);
    setError(null);
    setSpecialty(context?.specialty ?? 'sourcing');
    setNotes(context?.notes ?? '');
    setSelectedDate(nextBusinessDay());
    setName(user?.fullName ?? '');
    setEmail(user?.email ?? '');
  }, [isOpen, context, user]);

  useEffect(() => {
    if (!isOpen || !selectedDate) return;
    api
      .get<Availability>('/appointments/availability', { date: selectedDate, specialty })
      .then((data) => {
        setAvailability(data);
        const current = data.slots.find((slot) => slot.time === selectedTime);
        if (!current?.available) {
          const firstFree = data.slots.find((slot) => slot.available);
          if (firstFree) setSelectedTime(firstFree.time);
        }
      })
      .catch(() => setAvailability(null));
  }, [isOpen, selectedDate, specialty]);

  if (!isOpen) return null;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const appointment = await api.post<Appointment>('/appointments', {
        specialty,
        date: selectedDate,
        time: selectedTime,
        fullName: name,
        email,
        phone: phone || undefined,
        notes: notes || undefined,
        source: context?.source,
      });
      setConfirmed(appointment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Réservation impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const noSlotLeft = availability !== null && !availability.slots.some((slot) => slot.available);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Prendre rendez-vous</h3>
              <p className="text-xs text-slate-500">Consultation stratégique gratuite de 30 min</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {confirmed ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-lg">Rendez-vous confirmé !</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                {confirmed.specialtyLabel} —{' '}
                {new Date(`${confirmed.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à{' '}
                {confirmed.time} (GMT+1). Une invitation a été envoyée à {email}.
              </p>
              <a
                href={confirmed.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100"
              >
                <Video className="w-4 h-4" />
                {confirmed.meetingLink.replace('https://', '')}
              </a>
              <div>
                <button
                  onClick={onClose}
                  className="mt-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Domaine de consultation
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50"
                >
                  <option value="sourcing">Sourcing d'usines & Fret maritime (Chine ➔ Maghreb)</option>
                  <option value="creation">Implantation & Création de filiale</option>
                  <option value="juridique">Sécurisation juridique & Contrats bilingues</option>
                  <option value="academy">Formations d'équipes QIAO Academy</option>
                  <option value="partenariat">Partenariats institutionnels & B2B</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date souhaitée
                  </label>
                  <input
                    type="date"
                    required
                    min={nextBusinessDay()}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Créneau horaire
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  >
                    {(availability?.slots ?? ['09:00', '10:00', '11:30', '14:00', '16:00', '17:30'].map((time) => ({ time, available: true }))).map(
                      (slot) => (
                        <option key={slot.time} value={slot.time} disabled={!slot.available}>
                          {slot.time} (GMT+1){slot.available ? '' : ' — indisponible'}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
              {availability?.closed ? (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 -mt-2">
                  Nos experts consultent du lundi au vendredi : choisissez un jour ouvré.
                </p>
              ) : noSlotLeft ? (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 -mt-2">
                  Tous les créneaux de cette journée sont réservés : choisissez une autre date.
                </p>
              ) : null}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  required
                  placeholder="Votre nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse e-mail
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="email@domaine.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Téléphone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+216 ... ou +86 ..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Objectif ou questions clés
                </label>
                <textarea
                  rows={2}
                  placeholder="Décrivez brièvement vos attentes pour préparer l'entretien..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                ></textarea>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || availability?.closed || noSlotLeft}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Confirmer le rendez-vous</span>
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Entretien confidentiel avec un expert biculturel dédié</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
