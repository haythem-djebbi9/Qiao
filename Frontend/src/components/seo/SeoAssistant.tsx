import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, ChevronDown, Copy, Loader2, MessageSquare, Send, Sparkles, Wand2, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { CheckStatus, SeoAnalysis, SeoFields, SeoKind, localSeoScore, scoreBar, scoreTone } from '../../lib/seo';
import { useToast } from '../../context/ToastContext';
import { errorMessage, inputClass } from '../community/ui';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const STATUS_ICONS: Record<CheckStatus, React.ReactNode> = {
  ok: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />,
  problem: <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />,
};

const QUICK_PROMPTS = [
  'Propose 3 titres plus accrocheurs',
  'Comment améliorer le score GEO ?',
  'Quels mots-clés vise mon public ?',
];

/** Statut de la clé Gemini, demandé une fois par session. */
let statusCache: Promise<{ configured: boolean }> | null = null;

const ScoreGauge: React.FC<{ label: string; hint: string; score: number }> = ({ label, hint, score }) => (
  <div className="flex-1 min-w-0">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11px] font-bold text-slate-700" title={hint}>
        {label}
      </span>
      <span className={`text-lg font-black ${scoreTone(score)}`}>
        {score}
        <span className="text-[10px] text-slate-400 font-semibold">/100</span>
      </span>
    </div>
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
      <div className={`h-full ${scoreBar(score)} transition-all duration-500`} style={{ width: `${score}%` }} />
    </div>
  </div>
);

const copy = async (value: string, notify: ReturnType<typeof useToast>['notify']) => {
  try {
    await navigator.clipboard.writeText(value);
    notify('Copié dans le presse-papiers.');
  } catch {
    notify('Copie impossible : sélectionnez le texte manuellement.', 'error');
  }
};

/**
 * Assistant SEO / GEO des formulaires d'ajout : score instantané pendant la saisie, analyse Gemini à la demande
 * (suggestions applicables au formulaire) et conversation avec l'assistant. Rien n'est enregistré sans « Enregistrer ».
 */
export const SeoAssistant: React.FC<{
  kind: SeoKind;
  fields: SeoFields;
  onApply: { title?: (value: string) => void; description?: (value: string) => void };
}> = ({ kind, fields, onApply }) => {
  const { notify } = useToast();
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<'analyse' | 'chat'>('analyse');
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [analysis, setAnalysis] = useState<SeoAnalysis | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [chatting, setChatting] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const local = useMemo(() => localSeoScore(kind, fields), [kind, fields]);
  // L'analyse IA porte sur un état précis du formulaire : signalée comme ancienne dès que le titre ou la description change.
  const snapshot = `${fields['Titre'] ?? ''}|${fields['Description'] ?? ''}`;
  const [analysedSnapshot, setAnalysedSnapshot] = useState('');
  const stale = Boolean(analysis) && analysedSnapshot !== snapshot;

  useEffect(() => {
    statusCache ??= api.get<{ configured: boolean }>('/seo/status').catch(() => ({ configured: false }));
    statusCache.then((s) => setConfigured(s.configured));
  }, []);
  useEffect(() => {
    // Accolades obligatoires : scrollIntoView peut renvoyer une promesse, qu'un effet ne doit pas retourner.
    chatEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, chatting]);

  const analyse = async () => {
    setAnalysing(true);
    try {
      setAnalysis(await api.post<SeoAnalysis>('/seo/analyze', { kind, fields }));
      setAnalysedSnapshot(snapshot);
    } catch (err) {
      notify(errorMessage(err, 'Analyse impossible.'), 'error');
    } finally {
      setAnalysing(false);
    }
  };

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || chatting) return;
    const next = [...messages, { role: 'user' as const, text: question }];
    setMessages(next);
    setDraft('');
    setChatting(true);
    try {
      const { reply } = await api.post<{ reply: string }>('/seo/chat', { kind, fields, messages: next });
      setMessages([...next, { role: 'assistant', text: reply }]);
    } catch (err) {
      notify(errorMessage(err, "L'assistant n'a pas pu répondre."), 'error');
      setMessages(messages);
      setDraft(question);
    } finally {
      setChatting(false);
    }
  };

  const apply = (field: 'title' | 'description', value: string) => {
    onApply[field]?.(value);
    notify(field === 'title' ? 'Titre remplacé : pensez à enregistrer.' : 'Description remplacée : pensez à enregistrer.');
  };

  const scores = analysis && !stale ? { seo: analysis.seoScore, geo: analysis.geoScore } : local;
  const checks = analysis && !stale ? analysis.checks : local.checks;
  const pill = (active: boolean) =>
    `px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 ${active ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`;
  const small = 'px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 shrink-0';

  return (
    <section className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/60 to-white">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 p-3 text-left cursor-pointer" aria-expanded={open}>
        <span className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-bold text-slate-900">Assistant SEO & GEO</span>
          <span className="block text-[10px] text-slate-500 truncate">
            Référencement Google (SEO) et visibilité dans les réponses des IA (GEO){configured ? ' · Gemini' : ''}
          </span>
        </span>
        <span className={`text-xs font-black ${scoreTone(scores.seo)}`}>SEO {scores.seo}</span>
        <span className={`text-xs font-black ${scoreTone(scores.geo)}`}>GEO {scores.geo}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          <div className="flex gap-4">
            <ScoreGauge label="SEO" hint="Référencement dans les moteurs de recherche" score={scores.seo} />
            <ScoreGauge label="GEO" hint="Generative Engine Optimization : être cité par ChatGPT, Gemini, Perplexity" score={scores.geo} />
          </div>
          <div className="text-[10px] text-slate-400">
            {analysis && !stale
              ? `Analyse IA (${analysis.model})`
              : stale
                ? 'Le texte a changé depuis l’analyse IA : score instantané affiché, relancez l’analyse.'
                : 'Score instantané, recalculé pendant la saisie.'}
          </div>

          <div className="inline-flex p-0.5 rounded-full bg-slate-100">
            <button type="button" className={pill(tab === 'analyse')} onClick={() => setTab('analyse')}>
              <Wand2 className="w-3 h-3" /> Analyse & suggestions
            </button>
            <button type="button" className={pill(tab === 'chat')} onClick={() => setTab('chat')}>
              <MessageSquare className="w-3 h-3" /> Discuter
            </button>
          </div>

          {configured === false && (
            <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5">
              Assistant IA non configuré (GEMINI_API_KEY côté serveur) : seul le score instantané est disponible.
            </p>
          )}

          {tab === 'analyse' && (
            <div className="space-y-3">
              <ul className="space-y-1.5">
                {checks.slice(0, 8).map((check, index) => (
                  <li key={`${check.label}-${index}`} className="flex items-start gap-2 text-[11px]">
                    {STATUS_ICONS[check.status]}
                    <span className="min-w-0">
                      <span className="font-bold text-slate-800">
                        <span className="uppercase text-[9px] text-slate-400 mr-1">{check.area}</span>
                        {check.label}
                      </span>
                      {check.status !== 'ok' && <span className="block text-slate-500">{check.advice}</span>}
                    </span>
                  </li>
                ))}
                {checks.length === 0 && <li className="text-[11px] text-emerald-700 font-semibold">Aucun point bloquant détecté.</li>}
              </ul>

              <button
                type="button"
                disabled={analysing || configured === false}
                onClick={analyse}
                className="px-4 py-2 rounded-full bg-[#071329] hover:bg-slate-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {analysing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {analysing ? 'Analyse en cours…' : analysis ? "Relancer l'analyse IA" : 'Analyser et suggérer (IA)'}
              </button>

              {analysis && (
                <div className={`space-y-3 ${stale ? 'opacity-70' : ''}`}>
                  {analysis.summary && <p className="text-[11px] text-slate-700 bg-white border border-slate-200 rounded-xl p-2.5">{analysis.summary}</p>}
                  {analysis.suggestions.title && (
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Titre proposé · {analysis.suggestions.title.length} car.</span>
                        {onApply.title && (
                          <button type="button" onClick={() => apply('title', analysis.suggestions.title)} className={`${small} bg-red-600 hover:bg-red-700 text-white`}>
                            <Wand2 className="w-3 h-3" /> Appliquer
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-900">{analysis.suggestions.title}</p>
                    </div>
                  )}
                  {analysis.suggestions.description && (
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Description proposée</span>
                        {onApply.description && (
                          <button type="button" onClick={() => apply('description', analysis.suggestions.description)} className={`${small} bg-red-600 hover:bg-red-700 text-white`}>
                            <Wand2 className="w-3 h-3" /> Appliquer
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-700 whitespace-pre-line max-h-40 overflow-y-auto">{analysis.suggestions.description}</p>
                      {/\[à préciser\]/i.test(analysis.suggestions.description) && (
                        <p className="text-[10px] text-amber-700 mt-1">Complétez les mentions « [à préciser] » avant d’enregistrer.</p>
                      )}
                    </div>
                  )}
                  {analysis.suggestions.metaDescription && (
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Méta-description · {analysis.suggestions.metaDescription.length} car.</span>
                        <button type="button" onClick={() => copy(analysis.suggestions.metaDescription, notify)} className={`${small} border border-slate-200 text-slate-600 hover:bg-slate-50`}>
                          <Copy className="w-3 h-3" /> Copier
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-700">{analysis.suggestions.metaDescription}</p>
                    </div>
                  )}
                  {analysis.suggestions.keywords.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Mots-clés visés</span>
                        <button type="button" onClick={() => copy(analysis.suggestions.keywords.join(', '), notify)} className={`${small} border border-slate-200 text-slate-600 hover:bg-slate-50`}>
                          <Copy className="w-3 h-3" /> Copier
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {analysis.suggestions.keywords.map((keyword) => (
                          <span key={keyword} className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.suggestions.faq.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Questions-réponses (GEO)</span>
                        <div className="flex items-center gap-1">
                          {onApply.description && (
                            <button
                              type="button"
                              onClick={() =>
                                apply(
                                  'description',
                                  `${String(fields['Description'] ?? '').trim()}\n\nQuestions fréquentes\n${analysis.suggestions.faq.map((f) => `- ${f.question}\n${f.answer}`).join('\n')}`,
                                )
                              }
                              className={`${small} border border-slate-200 text-slate-600 hover:bg-slate-50`}
                            >
                              Ajouter à la description
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => copy(analysis.suggestions.faq.map((f) => `${f.question}\n${f.answer}`).join('\n\n'), notify)}
                            className={`${small} border border-slate-200 text-slate-600 hover:bg-slate-50`}
                          >
                            <Copy className="w-3 h-3" /> Copier
                          </button>
                        </div>
                      </div>
                      <dl className="space-y-1.5">
                        {analysis.suggestions.faq.map((f) => (
                          <div key={f.question}>
                            <dt className="text-[11px] font-bold text-slate-800">{f.question}</dt>
                            <dd className="text-[11px] text-slate-600">{f.answer}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'chat' && (
            <div className="space-y-2">
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {messages.length === 0 && (
                  <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" /> Posez une question sur ce contenu : l'assistant connaît les champs du formulaire en cours.
                  </p>
                )}
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-[11px] whitespace-pre-line ${
                        message.role === 'user' ? 'bg-red-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                      }`}
                    >
                      {message.text}
                      {message.role === 'assistant' && (
                        <button type="button" onClick={() => copy(message.text, notify)} className="block mt-1 text-[10px] font-semibold text-slate-400 hover:text-red-600 cursor-pointer">
                          Copier
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {chatting && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" /> L'assistant rédige…
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-1">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={configured === false}
                      onClick={() => send(prompt)}
                      className="px-2.5 py-1 rounded-full border border-slate-200 bg-white text-[10px] font-semibold text-slate-600 hover:border-red-300 hover:text-red-600 cursor-pointer disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
              {/* Pas de <form> imbriqué : la conversation vit à l'intérieur du formulaire de l'événement ou de la formation. */}
              <div className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      send(draft);
                    }
                  }}
                  maxLength={2000}
                  disabled={configured === false}
                  placeholder="Ex. : réécris la description pour des importateurs algériens"
                  className={inputClass}
                />
                <button
                  type="button"
                  disabled={chatting || !draft.trim() || configured === false}
                  onClick={() => send(draft)}
                  aria-label="Envoyer"
                  className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {messages.length > 0 && (
                <button type="button" onClick={() => setMessages([])} className="text-[10px] font-semibold text-slate-400 hover:text-red-600 cursor-pointer">
                  Nouvelle conversation
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
