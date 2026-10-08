import React from 'react';
import { X, CheckCircle2, ArrowRight, ShieldCheck, Clock, FileCheck } from 'lucide-react';
import { ServiceItem } from '../../types';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onRequestQuote: (serviceTitle: string) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onRequestQuote,
}) => {
  if (!service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header Image */}
        <div className="relative h-48 sm:h-56 w-full shrink-0 bg-slate-900">
          <img
            src={service.image}
            alt={service.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
              {service.category}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold">{service.title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Présentation du service
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">{service.description}</p>
          </div>

          {service.details && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Prestations & Accompagnement inclus
              </h4>
              <div className="space-y-2.5">
                {service.details.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2 text-xs text-blue-900 font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Garantie de conformité locale</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-900 font-semibold">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Délai de traitement optimisé</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-white transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={() => {
              onClose();
              onRequestQuote(service.title);
            }}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>Demander un devis / Accompagnement</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
