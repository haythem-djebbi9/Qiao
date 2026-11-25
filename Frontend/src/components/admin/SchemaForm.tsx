import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, ImagePlus, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { resolveImage } from '../../lib/assets';
import { uploadAcademyFile } from '../academy/ui';
import { useToast } from '../../context/ToastContext';

/** Description d'un champ de formulaire d'administration. */
export type Field =
  | { key: string; label: string; type: 'text' | 'textarea' | 'number' | 'boolean' | 'image' | 'lines'; help?: string; required?: boolean }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[]; help?: string }
  | { key: string; label: string; type: 'group'; fields: Field[]; help?: string }
  | {
      key: string;
      label: string;
      type: 'list';
      fields: Field[];
      itemTitle: (item: Record<string, unknown>, index: number) => string;
      newItem: () => Record<string, unknown>;
      help?: string;
    };

export const inputClass =
  'w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500';
const labelClass = 'block text-[11px] font-bold text-slate-600 mb-1';

/** Identifiant court pour un nouvel élément de liste. */
export const newId = (prefix = 'n') => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const ImageInput: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const upload = async (file: File) => {
    setBusy(true);
    try {
      const result = await uploadAcademyFile(file, 'cover');
      if (result.ref) onChange(resolveImage(result.ref));
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Téléversement impossible.', 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex items-start gap-3">
      <div className="w-24 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
        {value ? <img src={resolveImage(value)} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-5 h-5 text-slate-300" />}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" className={inputClass} />
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void upload(file);
          }}
        />
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Téléverser une image
        </button>
      </div>
    </div>
  );
};

const ListField: React.FC<{ field: Extract<Field, { type: 'list' }>; value: Record<string, unknown>[]; onChange: (value: Record<string, unknown>[]) => void }> = ({
  field,
  value,
  onChange,
}) => {
  const [open, setOpen] = useState<number | null>(null);
  const move = (index: number, delta: number) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
    setOpen(index + delta);
  };
  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={String(item.id ?? index)} className="border border-slate-200 rounded-xl bg-white">
          <div className="flex items-center gap-2 px-3 py-2">
            <button type="button" onClick={() => setOpen(open === index ? null : index)} className="flex-1 min-w-0 flex items-center gap-1.5 text-left cursor-pointer">
              {open === index ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
              <span className="text-xs font-semibold text-slate-800 truncate" translate={field.itemTitle(item, index) ? 'no' : undefined}>
                {field.itemTitle(item, index) || `Élément ${index + 1}`}
              </span>
            </button>
            <button type="button" aria-label="Monter" disabled={index === 0} onClick={() => move(index, -1)} className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button type="button" aria-label="Descendre" disabled={index === value.length - 1} onClick={() => move(index, 1)} className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Supprimer"
              onClick={() => {
                if (!window.confirm('Supprimer cet élément ?')) return;
                onChange(value.filter((_, i) => i !== index));
                setOpen(null);
              }}
              className="p-1 rounded-md text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {open === index && (
            <div className="px-3 pb-3 border-t border-slate-100 pt-3">
              <SchemaForm fields={field.fields} value={item} onChange={(next) => onChange(value.map((current, i) => (i === index ? next : current)))} />
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          onChange([...value, field.newItem()]);
          setOpen(value.length);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" /> Ajouter
      </button>
    </div>
  );
};

/** Formulaire généré à partir de la description des champs (texte, image, listes, sous-groupes...). */
export const SchemaForm: React.FC<{ fields: Field[]; value: Record<string, unknown>; onChange: (value: Record<string, unknown>) => void }> = ({
  fields,
  value,
  onChange,
}) => {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next });
  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const current = value[field.key];
        const help = field.help ? <p className="text-[10px] text-slate-400 mt-1">{field.help}</p> : null;
        switch (field.type) {
          case 'boolean':
            return (
              <label key={field.key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input type="checkbox" checked={Boolean(current)} onChange={(e) => set(field.key, e.target.checked)} className="accent-red-600" />
                {field.label}
                {help}
              </label>
            );
          case 'textarea':
            return (
              <div key={field.key}>
                <label className={labelClass}>{field.label}</label>
                <textarea rows={4} value={String(current ?? '')} onChange={(e) => set(field.key, e.target.value)} className={inputClass} />
                {help}
              </div>
            );
          case 'lines':
            return (
              <div key={field.key}>
                <label className={labelClass}>{field.label}</label>
                <textarea
                  rows={4}
                  value={Array.isArray(current) ? current.join('\n') : String(current ?? '')}
                  onChange={(e) => set(field.key, e.target.value.split('\n'))}
                  onBlur={(e) => set(field.key, e.target.value.split('\n').map((line) => line.trim()).filter(Boolean))}
                  className={inputClass}
                />
                <p className="text-[10px] text-slate-400 mt-1">Un élément par ligne.</p>
              </div>
            );
          case 'number':
            return (
              <div key={field.key}>
                <label className={labelClass}>{field.label}</label>
                <input
                  type="number"
                  value={current === null || current === undefined ? '' : String(current)}
                  onChange={(e) => set(field.key, e.target.value === '' ? null : Number(e.target.value))}
                  className={inputClass}
                />
                {help}
              </div>
            );
          case 'image':
            return (
              <div key={field.key}>
                <label className={labelClass}>{field.label}</label>
                <ImageInput value={String(current ?? '')} onChange={(next) => set(field.key, next)} />
                {help}
              </div>
            );
          case 'select':
            return (
              <div key={field.key}>
                <label className={labelClass}>{field.label}</label>
                <select value={String(current ?? '')} onChange={(e) => set(field.key, e.target.value)} className={`${inputClass} cursor-pointer`}>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {help}
              </div>
            );
          case 'group':
            return (
              <fieldset key={field.key} className="border border-slate-200 rounded-xl p-3">
                <legend className="px-1 text-[11px] font-black text-[#0a1c3d]">{field.label}</legend>
                {help}
                <SchemaForm
                  fields={field.fields}
                  value={(current as Record<string, unknown>) ?? {}}
                  onChange={(next) => set(field.key, next)}
                />
              </fieldset>
            );
          case 'list':
            return (
              <div key={field.key}>
                <label className={labelClass}>{field.label}</label>
                {help}
                <ListField field={field} value={(current as Record<string, unknown>[]) ?? []} onChange={(next) => set(field.key, next)} />
              </div>
            );
          default:
            return (
              <div key={field.key}>
                <label className={labelClass}>
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </label>
                <input value={String(current ?? '')} onChange={(e) => set(field.key, e.target.value)} className={inputClass} />
                {help}
              </div>
            );
        }
      })}
    </div>
  );
};
