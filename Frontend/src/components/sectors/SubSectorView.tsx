import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, TrendingUp } from 'lucide-react';
import { SectorData, SubSector } from '../../data/sectorsData';
import { SUB_SECTOR_DETAILS, subSectorOpportunityId } from '../../data/subSectorDetails';
import { useAppActions } from '../../context/AppActionsContext';
import { setQueryParams } from '../../lib/routes';
import { CountryFlag } from '../common/CountryFlag';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80';

const scrollToOpportunities = () => document.getElementById('opportunites-sous-secteur')?.scrollIntoView({ behavior: 'smooth' });

/**
 * Page d'information d'un sous-secteur : présentation, chiffres clés, enjeux, pays où agir, opportunités propres
 * (chacune avec sa page) et accompagnement QIAO. Aucun formulaire : la page informe, les opportunités mènent à leur fiche.
 */
export const SubSectorView: React.FC<{ sector: SectorData; subSector: SubSector }> = ({ sector, subSector }) => {
  const { openOpportunities } = useAppActions();
  const open = (id: string | null) => setQueryParams({ sub: id });
  const detail = SUB_SECTOR_DETAILS[subSector.id];
  const others = sector.subSectors.filter((item) => item.id !== subSector.id);

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
          {detail && (
            <button
              onClick={scrollToOpportunities}
              className="mt-5 px-5 py-2.5 rounded-full bg-[#e01a22] hover:bg-[#c9141b] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              Voir les opportunités <ArrowRight className="w-4 h-4" />
            </button>
          )}
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

        {detail && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {detail.figures.map((figure) => (
                <div key={figure.label} className="bg-white border border-slate-200 rounded-2xl p-4">
                  <div className="text-xl sm:text-2xl font-black text-[#0a1c3d] leading-tight">{figure.value}</div>
                  <div className="mt-1 text-xs text-slate-600 leading-snug">{figure.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              <section className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
                <h2 className="text-lg font-black text-[#0a1c3d]">Présentation</h2>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">{detail.intro}</p>
                <h3 className="mt-5 text-sm font-black text-[#0a1c3d] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#e01a22]" /> Enjeux et tendances
                </h3>
                <ul className="mt-2 space-y-2">
                  {detail.trends.map((trend) => (
                    <li key={trend} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#e01a22] shrink-0" />
                      <span>{trend}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
                <h2 className="text-lg font-black text-[#0a1c3d] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#e01a22]" /> Où agir
                </h2>
                <ul className="mt-3 space-y-3">
                  {detail.markets.map((market) => (
                    <li key={market.code + market.text} className="flex items-start gap-3">
                      <CountryFlag code={market.code} size="md" />
                      <span className="min-w-0">
                        <strong className="block text-xs text-[#0a1c3d]">{market.country}</strong>
                        <span className="block text-xs text-slate-600 leading-snug">{market.text}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <section id="opportunites-sous-secteur" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-black text-[#0a1c3d]">Opportunités</h2>
              <button onClick={() => openOpportunities({ sector: sector.id })} className="text-xs font-bold text-[#e01a22] hover:underline cursor-pointer shrink-0">
                Voir toutes les opportunités
              </button>
            </div>
            <div className="space-y-2">
              {(detail?.opportunities ?? sector.opportunities).map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    openOpportunities({
                      id: detail ? subSectorOpportunityId(sector.id, subSector.id, item.id) : `${sector.id}-${item.id}`,
                      country: item.country,
                    })
                  }
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
              {detail
                ? detail.services.map((service) => (
                    <li key={service} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-700 leading-relaxed">{service}</span>
                    </li>
                  ))
                : sector.services.map((service) => (
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

        {others.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-[#0a1c3d] mb-3">Autres sous-secteurs</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {others.map((item) => (
                <button
                  key={item.id}
                  onClick={() => open(item.id)}
                  className="text-left bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-400 hover:shadow-sm cursor-pointer group"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    className="w-full h-24 object-cover"
                  />
                  <span className="block p-3">
                    <span className="block text-xs font-bold text-[#0a1c3d] group-hover:text-[#e01a22]">{item.title}</span>
                    <span className="block mt-0.5 text-[11px] text-slate-500 leading-snug line-clamp-2">{item.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};
