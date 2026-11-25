import React, { useEffect } from 'react';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';
import { SectorService } from '../../data/sectorsData';
import { SECTOR_SERVICE_DETAILS } from '../../data/sectorServiceDetails';

interface SectorServiceModalProps {
  service: SectorService | null;
  sectorTitle: string;
  icon: React.ReactNode;
  onClose: () => void;
  onRequest: (service: SectorService) => void;
}

/** Fiche d'un service d'accompagnement : on lit d'abord ce qu'il comprend, puis on peut le demander. */
export const SectorServiceModal: React.FC<SectorServiceModalProps> = ({ service, sectorTitle, icon, onClose, onRequest }) => {
  useEffect(() => {
    if (!service) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [service, onClose]);

  if (!service) return null;
  const detail = service.detail ?? SECTOR_SERVICE_DETAILS[service.title];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={service.title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
      >
        <div className="relative bg-[#0a1c3d] text-white p-6">
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-3">{icon}</div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-300">{sectorTitle}</p>
          <h2 className="text-xl font-black mt-1 pr-8">{service.title}</h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">{detail?.intro ?? service.description}</p>
        </div>

        {detail && (
          <div className="p-6 space-y-5">
            <section>
              <h3 className="text-sm font-black text-[#0a1c3d] mb-2">Ce que comprend ce service</h3>
              <ul className="space-y-1.5">
                {detail.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="text-sm font-black text-[#0a1c3d] mb-2">Comment ça se passe</h3>
              <ol className="space-y-2">
                {detail.steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-red-50 text-[#e01a22] font-black text-[11px] flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}

        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onRequest(service)}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e01a22] hover:bg-[#c7151c] text-white text-sm font-bold px-4 py-2.5 rounded-xl cursor-pointer"
          >
            <span>Demander ce service</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="sm:w-32 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
