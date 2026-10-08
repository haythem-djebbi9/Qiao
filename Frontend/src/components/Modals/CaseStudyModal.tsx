import React from 'react';
import { X, CheckCircle2, TrendingDown, Clock, ShieldCheck, ArrowRight, Building2 } from 'lucide-react';
import { CaseStudy } from '../../types';

interface CaseStudyModalProps {
  study: CaseStudy | null;
  onClose: () => void;
  onStartSimilarProject: () => void;
}

export const CaseStudyModal: React.FC<CaseStudyModalProps> = ({
  study,
  onClose,
  onStartSimilarProject,
}) => {
  if (!study) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header Hero */}
        <div className="relative h-48 sm:h-56 w-full shrink-0 bg-slate-950">
          <img
            src={study.image}
            alt={study.company}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
              {study.tag}
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold">{study.company}</h3>
            <p className="text-xs text-slate-300 mt-1">{study.title}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          {/* Key metrics grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Résultats clés mesurés
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {study.metrics.map((m, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
                  <div className="text-sm font-bold text-slate-900">{m.label}</div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase mt-1">{m.type}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Full story */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Déroulement & Accompagnement QIAO
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {study.fullStory ||
                `L'équipe biculturelle QIAO a pris en charge l'ensemble des négociations directes auprès des fabricants en Chine, les audits d'usines sur site à Ningbo et Shenzhen, ainsi que la structuration des contrats bilingues et le suivi douanier jusqu'à la livraison complète aux installations en Afrique du Nord.`}
            </p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-emerald-900">Projet 100% sécurisé et conforme</div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Livraison dans les délais convenus sans aucun blocage réglementaire ni surcoût imprévu.
              </p>
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
              onStartSimilarProject();
            }}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>Lancer un projet similaire</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
