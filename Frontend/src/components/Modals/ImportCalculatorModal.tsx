import React, { useEffect, useState } from 'react';
import { X, Calculator, ArrowRight, CheckCircle2, Ship, Plane, ShieldCheck, Loader2, AlertCircle, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { SimulationRates, SimulationResult } from '../../lib/models';
import { useAuth } from '../../context/AuthContext';

interface ImportCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Calcul instantané à partir de la grille tarifaire stockée en base (même formule que l'API). */
function computeLandedCost(
  rates: SimulationRates,
  input: { destCountry: string; category: string; fobValue: number; shippingMode: 'sea' | 'air'; containerType: '20ft' | '40ft' | 'lcl' },
): SimulationResult | null {
  const tariff = rates.tariffs.find((t) => t.country === input.destCountry && t.category === input.category);
  const mode = input.shippingMode === 'air' ? 'air' : `sea-${input.containerType}`;
  const freight = rates.freight.find((f) => f.country === input.destCountry && f.mode === mode);
  if (!tariff || !freight) return null;

  const fob = Math.max(0, input.fobValue || 0);
  const insuranceCost = Math.round(fob * rates.insuranceRate);
  const cifValue = fob + freight.cost + insuranceCost;
  const dutyAmount = Math.round(cifValue * tariff.dutyRate);
  const vatAmount = Math.round((cifValue + dutyAmount) * tariff.vatRate);
  return {
    customsDutyRate: Math.round(tariff.dutyRate * 1000) / 10,
    vatRate: Math.round(tariff.vatRate * 1000) / 10,
    freightCost: freight.cost,
    insuranceCost,
    cifValue,
    dutyAmount,
    vatAmount,
    portFees: tariff.portFees,
    totalLandedCost: cifValue + dutyAmount + vatAmount + tariff.portFees,
    transitTime: freight.transitTime,
    port: tariff.port,
  };
}

export const ImportCalculatorModal: React.FC<ImportCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [destCountry, setDestCountry] = useState('Tunisie');
  const [category, setCategory] = useState('machinery');
  const [fobValue, setFobValue] = useState<number>(25000);
  const currency = 'USD';
  const [shippingMode, setShippingMode] = useState<'sea' | 'air'>('sea');
  const [containerType, setContainerType] = useState<'20ft' | '40ft' | 'lcl'>('20ft');
  const [rates, setRates] = useState<SimulationRates | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [quoteStep, setQuoteStep] = useState<'idle' | 'form' | 'sent'>('idle');
  const [quoteForm, setQuoteForm] = useState({ fullName: '', email: '', phone: '', notes: '' });
  const [quoteReference, setQuoteReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuoteStep('idle');
    setQuoteError(null);
    setQuoteForm((current) => ({ ...current, fullName: user?.fullName ?? current.fullName, email: user?.email ?? current.email }));
    if (!rates) {
      api
        .get<SimulationRates>('/simulations/rates')
        .then(setRates)
        .catch((err) => setRatesError(err.message));
    }
  }, [isOpen, user, rates]);

  if (!isOpen) return null;

  const calc = rates
    ? computeLandedCost(rates, { destCountry, category, fobValue, shippingMode, containerType })
    : null;

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setQuoteError(null);
    try {
      const response = await api.post<{ reference: string }>('/simulations/quote', {
        destCountry,
        category,
        fobValue,
        shippingMode,
        containerType,
        fullName: quoteForm.fullName,
        email: quoteForm.email,
        phone: quoteForm.phone || undefined,
        notes: quoteForm.notes || undefined,
      });
      setQuoteReference(response.reference);
      setQuoteStep('sent');
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Simulateur de coûts d'importation</h3>
              <p className="text-xs text-slate-500">Chine ➔ Afrique du Nord (Fret, Douane & Taxes)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pays de destination */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pays de destination (Afrique du Nord)
              </label>
              <select
                value={destCountry}
                onChange={(e) => setDestCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 font-medium"
              >
                <option value="Tunisie">🇹🇳 Tunisie (Port de Radès / Sfax)</option>
                <option value="Algérie">🇩🇿 Algérie (Port d'Alger / Oran / Djendjen)</option>
                <option value="Maroc">🇲🇦 Maroc (Tanger Med / Casablanca)</option>
                <option value="Égypte">🇪🇬 Égypte (Alexandrie / Port-Saïd)</option>
              </select>
            </div>

            {/* Type de marchandise */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catégorie de produit / Code SH
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 font-medium"
              >
                <option value="machinery">Machines industrielles & Outillage (Droits réduits ~5%)</option>
                <option value="electronics">Matériel électronique & Informatique (~20%)</option>
                <option value="textile">Textiles, tissus & habillement (~30%)</option>
                <option value="raw_materials">Matières premières pour transformation (0% DD)</option>
                <option value="medical">Dispositifs médicaux certifiés (0% DD / TVA 7%)</option>
              </select>
            </div>

            {/* Valeur FOB */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valeur marchande FOB (Facture fournisseur en Chine)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={fobValue}
                  onChange={(e) => setFobValue(Number(e.target.value))}
                  className="w-full pl-3.5 pr-14 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {currency}
                </span>
              </div>
            </div>

            {/* Mode de transport */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mode de transport international
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShippingMode('sea')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                    shippingMode === 'sea' ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Ship className="w-3.5 h-3.5" />
                  <span>Maritime (FCL/LCL)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShippingMode('air')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                    shippingMode === 'air' ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>Aérien Express</span>
                </button>
              </div>
              {shippingMode === 'sea' && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {([
                    ['20ft', 'Conteneur 20’'],
                    ['40ft', 'Conteneur 40’'],
                    ['lcl', 'Groupage LCL'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setContainerType(value)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        containerType === value ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results Summary Box */}
          {!calc ? (
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex items-center justify-center gap-2 text-sm text-slate-300">
              {ratesError ? (
                <>
                  <AlertCircle className="w-4 h-4 text-red-400" /> {ratesError}
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Chargement de la grille tarifaire...
                </>
              )}
            </div>
          ) : (
          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Décomposition détaillée de l'estimation
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {calc.transitTime} · {calc.port}
              </div>
            </div>

            <div className="space-y-2 text-xs border-b border-slate-800 pb-4">
              <div className="flex justify-between text-slate-300">
                <span>Valeur Marchande FOB (Chine)</span>
                <span className="font-bold text-white">${(fobValue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Fret international estimé ({shippingMode === 'sea' ? 'Maritime' : 'Aérien'})</span>
                <span className="font-bold text-white">${calc.freightCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Assurance maritime (0.6% CIF)</span>
                <span className="font-bold text-white">${calc.insuranceCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-blue-300 font-semibold pt-1 border-t border-slate-800">
                <span>Valeur en douane CIF (Base de calcul)</span>
                <span>${calc.cifValue.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs border-b border-slate-800 pb-4">
              <div className="flex justify-between text-slate-300">
                <span>Droits de Douane ({calc.customsDutyRate}%)</span>
                <span className="font-bold text-red-400">+ ${calc.dutyAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>TVA à l'importation ({calc.vatRate}%)</span>
                <span className="font-bold text-red-400">+ ${calc.vatAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Frais portuaires & magasinage estimés</span>
                <span className="font-bold text-white">+ ${calc.portFees.toLocaleString()}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-sm font-bold text-slate-300">Coût de revient total estimé (DDP)</div>
                <div className="text-[11px] text-slate-400">Rendu porte à destination</div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-400">
                ${calc.totalLandedCost.toLocaleString()} {currency}
              </div>
            </div>
          </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Besoin d'un audit de conformité douanière ou d'un transitaire certifié ? Les experts QIAO vous accompagnent dans le dédouanement prioritaire.
            </span>
          </div>

          {quoteStep === 'sent' ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Demande de cotation {quoteReference} enregistrée</div>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Un transitaire certifié QIAO vous enverra une cotation ferme sous 24h à {quoteForm.email}.
                </p>
              </div>
            </div>
          ) : quoteStep === 'form' ? (
            <form onSubmit={handleQuoteSubmit} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="text-sm font-bold text-slate-900">Recevoir une cotation ferme pour cette simulation</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Nom complet *"
                  value={quoteForm.fullName}
                  onChange={(e) => setQuoteForm({ ...quoteForm, fullName: e.target.value })}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                />
                <input
                  required
                  type="email"
                  placeholder="E-mail professionnel *"
                  value={quoteForm.email}
                  onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                />
                <input
                  type="tel"
                  placeholder="Téléphone / WhatsApp"
                  value={quoteForm.phone}
                  onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                />
                <input
                  placeholder="Produit, code SH, volume..."
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                />
              </div>
              {quoteError && <div className="text-xs text-red-600 font-semibold">{quoteError}</div>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuoteStep('idle')}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Envoyer la demande
                </button>
              </div>
            </form>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Fermer
            </button>
            {quoteStep === 'idle' && (
              <button
                onClick={() => setQuoteStep('form')}
                disabled={!calc}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>Demander une cotation réelle</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
