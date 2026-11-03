import React, { useState } from 'react';
import { Check, Clock, Download, Loader2, NotebookPen, Pencil, Play, RefreshCw, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { LearnLesson, LessonNote, formatTimecode, parseTimecode, videoEmbed } from '../../lib/academy';
import { useToast } from '../../context/ToastContext';
import { errorMessage, inputClass } from '../community/ui';
import type { VideoHandle } from './VideoPlayer';

/**
 * Notes personnelles de l'apprenant. Sur une vidéo, chaque note est ancrée à l'instant de lecture :
 * un clic sur l'instant y ramène la vidéo. Les notes ne sont visibles que par leur auteur.
 */
export const LessonNotes: React.FC<{
  courseId: string;
  courseTitle: string;
  lesson: LearnLesson;
  lessons: LearnLesson[];
  notes: LessonNote[];
  onNotesChange: (notes: LessonNote[]) => void;
  player: React.RefObject<VideoHandle | null>;
}> = ({ courseId, courseTitle, lesson, lessons, notes, onNotesChange, player }) => {
  const { notify } = useToast();
  const isVideo = lesson.type === 'video';
  const [text, setText] = useState('');
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ id: string; text: string; time: string } | null>(null);
  const mine = notes
    .filter((n) => n.lessonId === lesson.id)
    .sort((a, b) => (a.seconds ?? -1) - (b.seconds ?? -1) || a.createdAt.localeCompare(b.createdAt));

  /** Instant courant de la vidéo, saisi au moment où l'apprenant commence sa note (la vidéo est mise en pause). */
  const captureTime = async (pause: boolean) => {
    if (!isVideo || !player.current?.timed) return;
    const seconds = await player.current.getTime();
    if (seconds !== null) setTime(formatTimecode(seconds));
    if (pause) player.current.pause();
  };

  const add = async () => {
    if (!text.trim()) return;
    const seconds = isVideo && time.trim() ? parseTimecode(time) : null;
    if (isVideo && time.trim() && seconds === null) {
      notify('Instant invalide : utilisez le format 2:05 ou 1:02:05.', 'error');
      return;
    }
    setBusy(true);
    try {
      const note = await api.post<LessonNote>(`/academy/learn/${courseId}/lessons/${lesson.id}/notes`, { text, seconds });
      onNotesChange([...notes, note]);
      setText('');
      setTime('');
    } catch (err) {
      notify(errorMessage(err, 'Note non enregistrée.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!editing || !editing.text.trim()) return;
    const seconds = isVideo && editing.time.trim() ? parseTimecode(editing.time) : null;
    if (isVideo && editing.time.trim() && seconds === null) {
      notify('Instant invalide : utilisez le format 2:05 ou 1:02:05.', 'error');
      return;
    }
    try {
      const note = await api.patch<LessonNote>(`/academy/notes/${editing.id}`, { text: editing.text, seconds });
      onNotesChange(notes.map((n) => (n.id === note.id ? note : n)));
      setEditing(null);
    } catch (err) {
      notify(errorMessage(err, 'Modification impossible.'), 'error');
    }
  };

  const remove = async (note: LessonNote) => {
    if (!window.confirm('Supprimer cette note ?')) return;
    try {
      await api.delete(`/academy/notes/${note.id}`);
      onNotesChange(notes.filter((n) => n.id !== note.id));
    } catch (err) {
      notify(errorMessage(err, 'Suppression impossible.'), 'error');
    }
  };

  /** Toutes les notes de la formation, leçon par leçon, dans un fichier texte. */
  const exportNotes = () => {
    const lines = [`Mes notes — ${courseTitle}`, ''];
    for (const l of lessons) {
      const items = notes.filter((n) => n.lessonId === l.id).sort((a, b) => (a.seconds ?? -1) - (b.seconds ?? -1));
      if (items.length === 0) continue;
      lines.push(`## ${l.title}`);
      for (const n of items) lines.push(`${n.seconds !== null ? `[${formatTimecode(n.seconds)}] ` : '- '}${n.text}`);
      lines.push('');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes-${courseId}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Fichier, lien direct, YouTube et Vimeo exposent l'instant de lecture ; les autres plateformes non.
  const provider = lesson.videoUrl ? videoEmbed(lesson.videoUrl)?.provider : undefined;
  const timed = isVideo && (!provider || provider === 'youtube' || provider === 'vimeo');

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
          <NotebookPen className="w-4 h-4 text-red-600" /> Mes notes {mine.length > 0 && <span className="text-xs text-slate-400 font-semibold">({mine.length})</span>}
        </h4>
        {notes.length > 0 && (
          <button type="button" onClick={exportNotes} className="text-[11px] font-semibold text-slate-500 hover:text-red-600 cursor-pointer inline-flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Exporter toutes mes notes
          </button>
        )}
      </div>

      <div className="space-y-2">
        {isVideo && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>À</span>
            <input
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="0:00"
              aria-label="Instant de la vidéo"
              className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
            {timed ? (
              <button type="button" onClick={() => captureTime(false)} className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-red-600 cursor-pointer">
                <RefreshCw className="w-3 h-3" /> instant actuel
              </button>
            ) : (
              <span>(saisissez l'instant : ce lecteur ne le communique pas)</span>
            )}
          </div>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => !time && captureTime(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              add();
            }
          }}
          rows={2}
          maxLength={2000}
          placeholder={isVideo ? 'Prenez une note : la vidéo se met en pause et la note est ancrée à cet instant.' : 'Prenez une note sur cette leçon.'}
          className={inputClass}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400">Ctrl + Entrée pour enregistrer · visibles par vous seul</span>
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={add}
            className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Ajouter la note
          </button>
        </div>
      </div>

      {mine.length > 0 && (
        <ul className="space-y-2">
          {mine.map((note) =>
            editing?.id === note.id ? (
              <li key={note.id} className="p-2.5 rounded-xl bg-white border border-red-200 space-y-2">
                {isVideo && (
                  <input
                    value={editing.time}
                    onChange={(e) => setEditing({ ...editing, time: e.target.value })}
                    placeholder="0:00"
                    aria-label="Instant de la vidéo"
                    className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono font-semibold"
                  />
                )}
                <textarea rows={2} maxLength={2000} value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} className={inputClass} />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditing(null)} className="px-3 py-1 rounded-full border border-slate-200 text-[11px] font-semibold text-slate-600 cursor-pointer inline-flex items-center gap-1">
                    <X className="w-3 h-3" /> Annuler
                  </button>
                  <button type="button" onClick={save} className="px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1">
                    <Check className="w-3 h-3" /> Enregistrer
                  </button>
                </div>
              </li>
            ) : (
              <li key={note.id} className="group p-2.5 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5">
                {note.seconds !== null ? (
                  <button
                    type="button"
                    onClick={() => player.current?.seek(note.seconds as number)}
                    disabled={!timed}
                    title={timed ? 'Revoir ce passage' : undefined}
                    className="shrink-0 px-2 py-0.5 rounded-lg bg-[#071329] text-white text-[11px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer disabled:cursor-default hover:bg-red-600 disabled:hover:bg-[#071329]"
                  >
                    {timed && <Play className="w-2.5 h-2.5" />} {formatTimecode(note.seconds)}
                  </button>
                ) : (
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-600 mt-2" />
                )}
                <p className="flex-1 min-w-0 text-xs text-slate-700 whitespace-pre-line break-words">{note.text}</p>
                <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setEditing({ id: note.id, text: note.text, time: note.seconds !== null ? formatTimecode(note.seconds) : '' })}
                    aria-label="Modifier la note"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => remove(note)} aria-label="Supprimer la note" className="p-1 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
};
