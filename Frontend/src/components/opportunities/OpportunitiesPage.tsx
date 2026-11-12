import React, { useMemo, useState } from 'react';
import { useSiteContentVersion } from '../../lib/siteContent';
import { ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, Globe, Handshake, Search, Target } from 'lucide-react';
import { useAppActions } from '../../context/AppActionsContext';
import { useApi } from '../../hooks/useApi';
import { resolveImage } from '../../lib/assets';
import { Opportunity } from '../../lib/models';
import { OPPORTUNITY_COUNTRIES, OpportunityEntry, STATIC_OPPORTUNITIES, fromRecord, opportunityRoute } from '../../lib/opportunities';
import { useQueryParam } from '../../lib/routes';
import { formatDate, matchesText, normalize } from '../../lib/text';
import { CountryFlag } from '../common/CountryFlag';

const OpportunityCard: React.FC<{ entry: OpportunityEntry }> = ({ entry }) => (
  <button
    onClick={() => opportunityRoute({ id: entry.id, country: entry.country })}
    className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-400 hover:shadow-md transition-all flex items-start gap-3 group cursor-pointer"
  >
    {entry.countryCode ? <CountryFlag code={entry.countryCode} size="md" /> : <Globe className="w-5 h-5 text-slate-400 shrink-0" />}
    <span className="flex-1 min-w-0">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-red-600">{entry.type}</span>
      <span className="block font-bold text-sm text-[#0a1c3d] leading-snug mt-0.5 group-hover:text-red-600 transition-colors">{entry.title}</span>
      <span className="block text-xs text-slate-500 mt-1">
        <span className="font-semibold text-slate-700">{entry.country}</span> · {entry.sectorLabel}
      </span>
      {entry.amount && <span className="block text-xs font-semibold text-slate-800 mt-1">{entry.amount}</span>}
    </span>
    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0a1c3d] shrink-0 mt-1" />
  </button>
);

const Fact: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0 text-sm">
    <dt className="text-slate-500">{label}</dt>
    <dd className="font-semibold text-slate-900 text-right">{value}</dd>
  </div>
);

/** Fiche d'une opportunité : la candidature n'est demandée que si le visiteur la choisit. */
const OpportunityDetail: React.FC<{ entry: OpportunityEntry; others: OpportunityEntry[]; heading: string }> = ({ entry, others, heading }) => {
  const { applyToOpportunity, contactUs, openAppointment } = useAppActions();
  const requestInformation = () =>
    contactUs({
      subject: 'Partenariat commercial & distribution',
      message: `Bonjour, je souhaite en savoir plus sur l'opportunité « ${entry.title} » (${entry.country}).\n\nMon projet : `,
    });

  return (
    <>
      <button
        onClick={() => opportunityRoute({ country: entry.country })}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-600 cursor-pointer mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> {heading}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <article className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {entry.image && <img src={resolveImage(entry.image)} alt={entry.title} className="w-full h-56 sm:h-72 object-cover" />}
          <div className="p-5 sm:p-7 space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 uppercase tracking-wide">{entry.type}</span>
                {entry.urgent && <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">Urgent</span>}
                {entry.verified && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 inline-flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> Vérifiée par QIAO
                  </span>
                )}
              </div>
              <h2 className="mt-3 text-xl sm:text-2xl font-black text-[#0a1c3d] leading-snug">{entry.title}</h2>
            </div>

            {entry.description && <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed whitespace-pre-line">{entry.description}</p>}

            {entry.sector && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#0a1c3d]">Le secteur en bref</h3>
                  <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{entry.sector.overviewDescription}</p>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0a1c3d]">Comment QIAO vous accompagne</h3>
                  <ul className="mt-2 space-y-2">
                    {entry.sector.services.map((service) => (
                      <li key={service.id} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-900">{service.title}</strong> : {service.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </article>

        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-2">
              {entry.countryCode && <CountryFlag code={entry.countryCode} size="md" />}
              <span className="font-bold text-[#0a1c3d]">{entry.country}</span>
            </div>
            <dl>
              <Fact label="Secteur" value={entry.sectorLabel} />
              <Fact label="Type" value={entry.type} />
              {entry.amount && <Fact label="Montant" value={entry.amount} />}
              {entry.partner && <Fact label="Partenaire recherché" value={entry.partner} />}
              {entry.from && entry.to && (
                <Fact
                  label="Corridor"
                  value={
                    <>
                      {entry.from} → {entry.to}
                    </>
                  }
                />
              )}
              {entry.deadline && <Fact label="Date limite" value={formatDate(entry.deadline)} />}
              {entry.published && <Fact label="Publiée le" value={formatDate(entry.published)} />}
            </dl>
            <div className="mt-4 space-y-2">
              {entry.record?.hasApplied ? (
                <div className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold text-center">Candidature déjà envoyée</div>
              ) : entry.record ? (
                <button
                  onClick={() => applyToOpportunity(entry.record!)}
                  className="w-full px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                >
                  Postuler à cette opportunité
                </button>
              ) : (
                <button onClick={requestInformation} className="w-full px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer">
                  Manifester mon intérêt
                </button>
              )}
              <button
                onClick={() => openAppointment({ specialty: 'partenariat', source: 'opportunite' })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Handshake className="w-4 h-4" /> Parler à un expert QIAO
              </button>
            </div>
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-black text-[#0a1c3d] mb-3">Autres opportunités</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {others.slice(0, 6).map((other) => (
              <OpportunityCard key={other.id} entry={other} />
            ))}
          </div>
        </section>
      )}
    </>
  );
};

/** Page des opportunités : une page par pays et une fiche par opportunité, avec leur propre adresse. */
export const OpportunitiesPage: React.FC = () => {
  const countryParam = useQueryParam('pays');
  const opportunityId = useQueryParam('op');
  const sectorId = useQueryParam('secteur');
  const [search, setSearch] = useState('');
  const { data: records, loading } = useApi<Opportunity[]>('/opportunities', undefined, []);

  const contentVersion = useSiteContentVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const all = useMemo(() => [...(records ?? []).map(fromRecord), ...STATIC_OPPORTUNITIES], [records, contentVersion]);
  const country = OPPORTUNITY_COUNTRIES.find((item) => normalize(item.name) === normalize(countryParam));
  const heading = country?.heading ?? 'Toutes les opportunités';
  const selected = opportunityId ? all.find((entry) => entry.id === opportunityId) ?? null : null;
  const sectorLabel = sectorId ? STATIC_OPPORTUNITIES.find((entry) => entry.sector?.id === sectorId)?.sectorLabel ?? null : null;

  const inCountry = all.filter((entry) => !country || normalize(entry.country) === normalize(country.name));
  const visible = inCountry.filter(
    (entry) => (!sectorId || entry.sector?.id === sectorId) && matchesText(search, entry.title, entry.sectorLabel, entry.type, entry.country),
  );
  const countOf = (name: string) => all.filter((entry) => normalize(entry.country) === normalize(name)).length;

  return (
    <main className="flex-1 w-full bg-[#f6f8fb]">
      <section className="bg-[#0a1c3d] text-white pt-24 pb-8 sm:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400">
            <Target className="w-4 h-4" /> QIAO Opportunités
          </div>
          <h1 className="mt-2 text-2xl sm:text-4xl font-black tracking-tight">{heading}</h1>
          <p className="mt-2 text-sm text-slate-300 max-w-2xl">Projets, partenariats et investissements entre la Chine et l'Afrique du Nord, présentés pays par pays.</p>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => opportunityRoute({ sector: sectorId ?? undefined })}
              className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${!country ? 'bg-white text-[#0a1c3d]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Tous les pays
            </button>
            {OPPORTUNITY_COUNTRIES.map((item) => (
              <button
                key={item.code}
                onClick={() => opportunityRoute({ country: item.name, sector: sectorId ?? undefined })}
                className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                  country?.code === item.code ? 'bg-white text-[#0a1c3d]' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <CountryFlag code={item.code} size="sm" />
                {item.name}
                <span className="opacity-70">({countOf(item.name)})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {opportunityId ? (
          selected ? (
            <OpportunityDetail
              entry={selected}
              heading={OPPORTUNITY_COUNTRIES.find((item) => item.name === selected.country)?.heading ?? 'Toutes les opportunités'}
              others={all.filter((entry) => entry.id !== selected.id && normalize(entry.country) === normalize(selected.country))}
            />
          ) : loading ? null : (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-500 space-y-3">
              <p>Cette opportunité n'est plus disponible.</p>
              <button onClick={() => opportunityRoute()} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer">
                Voir toutes les opportunités
              </button>
            </div>
          )
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un projet, un secteur..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                />
              </div>
              {sectorLabel && (
                <button
                  onClick={() => opportunityRoute({ country: country?.name })}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {sectorLabel} ✕
                </button>
              )}
              <div className="text-xs font-semibold text-slate-500 shrink-0">
                {visible.length} <span>{visible.length > 1 ? 'opportunités' : 'opportunité'}</span>
              </div>
            </div>
            {visible.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-500">Aucune opportunité ne correspond à votre recherche.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {visible.map((entry) => (
                  <OpportunityCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};
