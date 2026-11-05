import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Handshake } from 'lucide-react';
import { useAppActions } from '../../context/AppActionsContext';
import { SectorData, SubSector } from '../../data/sectorsData';
import { opportunityRoute } from '../../lib/opportunities';
import { setQueryParams } from '../../lib/routes';
import { CountryFlag } from '../common/CountryFlag';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80';

/** Sous-page d'un sous-secteur : présentation, autres sous-secteurs, opportunités et services du secteur. */
export const SubSectorView: React.FC<{ sector: SectorData; subSector: SubSector; onProject: () => void }> = ({ sector, subSector, onProject }) => {
  const { openAppointment } = useAppActions();
  const open = (id: string | null) => setQueryParams({ sub: id });

  return (
    <main className="flex-1 w-full bg-[#f6f8fb]">
      <section className="relative pt-20 bg-[#0a1c3d] text-white overflow-hidden">
        <img
          src={subSector.image}
          alt={subSector.title}
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <button onClick={() => open(null)} className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> {sector.title}
          </button>
          <h1 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight">{subSector.title}</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-100 max-w-2xl">{subSector.description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={onProject} className="px-5 py-2.5 rounded-full bg-[#e01a22] hover:bg-[#c9141b] text-white text-xs font-bold cursor-pointer">
              Présenter mon projet
            </button>
            <button
              onClick={() => openAppointment({ specialty: 'partenariat', source: `sous-secteur-${subSector.id}` })}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-[#0a1c3d] text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Handshake className="w-4 h-4" /> Parler à un expert QIAO
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sector.subSectors.map((item) => (
            <button
              key={item.id}
              onClick={() => open(item.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap border cursor-pointer ${
                item.id === subSector.id ? 'bg-[#0a1c3d] text-white border-[#0a1c3d]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-black text-[#0a1c3d]">Opportunités du secteur</h2>
              <button onClick={() => opportunityRoute({ sector: sector.id })} className="text-xs font-bold text-[#e01a22] hover:underline cursor-pointer shrink-0">
                Voir toutes les opportunités
              </button>
            </div>
            <div className="space-y-2">
              {sector.opportunities.map((item) => (
                <button
                  key={item.id}
                  onClick={() => opportunityRoute({ id: `${sector.id}-${item.id}`, country: item.country })}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 flex items-center gap-3 group cursor-pointer"
                >
                  <CountryFlag code={item.countryCode} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-xs text-[#0a1c3d] group-hover:text-[#e01a22]">{item.title}</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      {item.country} | {item.type}
                    </span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-lg font-black text-[#0a1c3d] mb-3">Comment QIAO vous accompagne</h2>
            <ul className="space-y-3">
              {sector.services.map((service) => (
                <li key={service.id} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="block text-slate-900 text-xs">{service.title}</strong>
                    <span className="text-xs text-slate-600">{service.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
};
