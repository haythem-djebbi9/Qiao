import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService, RateLimiter } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { SeoChatMessageDto, SeoKind } from './seo.dto';

type Admin = Pick<User, 'id' | 'fullName'>;

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
/** Gemini 4 d'abord ; repli automatique sur des modèles rapides s'il est saturé ou hors quota. */
const DEFAULT_MODELS = 'gemini-4-argon,gemini-3.5-flash-lite,gemini-2.5-flash';
const ATTEMPT_TIMEOUT_MS = 25_000;
/** Un modèle hors quota (429) ou saturé (503) est mis de côté quelques minutes. */
const COOLDOWN_MS = 10 * 60_000;

const KIND_LABELS: Record<SeoKind, string> = {
  course: 'une formation QIAO Academy',
  path: 'un parcours de formation QIAO Academy',
  event: 'un événement QIAO (salon, forum, webinaire, mission d’affaires)',
};

const SYSTEM_PROMPT = `Tu es l'expert SEO et GEO de QIAO, plateforme francophone qui relie la Chine et l'Afrique du Nord (Tunisie, Algérie, Maroc, Libye, Mauritanie) : commerce, import-export, formations, événements.
- SEO : référencement dans Google (titre de 30 à 65 caractères commençant par le mot-clé principal, description claire et riche en mots-clés que tapent des importateurs, entrepreneurs et décideurs francophones, intention locale : villes, pays).
- GEO (Generative Engine Optimization) : être compris et cité par les moteurs IA (ChatGPT, Gemini, Perplexity) : faits explicites et vérifiables (qui, quoi, quand, où, pour qui, combien), entités nommées, phrases courtes et autonomes, bénéfices concrets, questions-réponses.
Règles : réponds en français ; n'invente jamais de fait (date, chiffre, partenaire, intervenant, prix) absent des champs fournis : écris « [à préciser] » à la place ; respecte le ton professionnel de QIAO ; garde les noms propres tels quels.`;

const ANALYSIS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    seoScore: { type: 'INTEGER', description: 'Score SEO de 0 à 100' },
    geoScore: { type: 'INTEGER', description: 'Score GEO de 0 à 100' },
    summary: { type: 'STRING', description: 'Diagnostic en une ou deux phrases' },
    checks: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          area: { type: 'STRING', enum: ['seo', 'geo'] },
          status: { type: 'STRING', enum: ['ok', 'warning', 'problem'] },
          label: { type: 'STRING' },
          advice: { type: 'STRING' },
        },
        required: ['area', 'status', 'label', 'advice'],
      },
    },
    suggestions: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Titre amélioré (65 caractères maximum)' },
        description: { type: 'STRING', description: 'Description améliorée, prête à remplacer celle du formulaire' },
        metaDescription: { type: 'STRING', description: 'Méta-description de 140 à 160 caractères' },
        keywords: { type: 'ARRAY', items: { type: 'STRING' } },
        faq: {
          type: 'ARRAY',
          items: { type: 'OBJECT', properties: { question: { type: 'STRING' }, answer: { type: 'STRING' } }, required: ['question', 'answer'] },
        },
      },
      required: ['title', 'description', 'metaDescription', 'keywords', 'faq'],
    },
  },
  required: ['seoScore', 'geoScore', 'summary', 'checks', 'suggestions'],
};

export interface SeoAnalysis {
  seoScore: number;
  geoScore: number;
  summary: string;
  checks: { area: 'seo' | 'geo'; status: 'ok' | 'warning' | 'problem'; label: string; advice: string }[];
  suggestions: { title: string; description: string; metaDescription: string; keywords: string[]; faq: { question: string; answer: string }[] };
}

class GeminiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Assistant SEO / GEO des formulaires d'administration, propulsé par l'API Gemini (clé serveur, jamais exposée). */
@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);
  private readonly cooldown = new Map<string, number>();

  constructor(
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly rateLimiter: RateLimiter,
  ) {}

  private get apiKey() {
    return this.config.get<string>('GEMINI_API_KEY')?.trim() || '';
  }

  private get models() {
    return (this.config.get<string>('GEMINI_MODELS') || DEFAULT_MODELS)
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
  }

  status() {
    const now = Date.now();
    return {
      configured: Boolean(this.apiKey),
      models: this.models.map((name) => ({ name, available: (this.cooldown.get(name) ?? 0) <= now })),
    };
  }

  async analyze(admin: Admin, kind: SeoKind, rawFields: Record<string, unknown>) {
    this.rateLimiter.hit(`seo:${admin.id}`, 60, 60 * 60_000, "Trop d'analyses en une heure : réessayez un peu plus tard.");
    const fields = this.cleanFields(rawFields);
    const prompt = `Analyse ${KIND_LABELS[kind]} en cours de saisie dans l'administration, puis propose des améliorations.

Champs du formulaire :
${this.describe(fields)}

Évalue le SEO et le GEO (scores sévères mais justes), liste 4 à 8 contrôles concrets, et propose : un titre amélioré, une description améliorée (même langue, même faits, mieux structurée pour le SEO et le GEO), une méta-description, 5 à 10 mots-clés et 3 questions-réponses fidèles aux faits fournis.`;
    const { text, model } = await this.generate(
      { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
      { responseMimeType: 'application/json', responseSchema: ANALYSIS_SCHEMA, maxOutputTokens: 4096, temperature: 0.4 },
    );
    let analysis: SeoAnalysis;
    try {
      analysis = this.normalize(JSON.parse(text));
    } catch {
      throw new ServiceUnavailableException("Réponse de l'assistant illisible : relancez l'analyse.");
    }
    await this.audit.log(
      admin,
      'seo.analyze',
      { type: `seo_${kind}`, id: kind, label: String(fields['Titre'] ?? '').slice(0, 200) || null },
      { model, seoScore: analysis.seoScore, geoScore: analysis.geoScore },
    );
    return { ...analysis, model };
  }

  async chat(admin: Admin, kind: SeoKind, rawFields: Record<string, unknown>, messages: SeoChatMessageDto[]) {
    this.rateLimiter.hit(`seo-chat:${admin.id}`, 120, 60 * 60_000, 'Trop de messages en une heure : réessayez un peu plus tard.');
    const fields = this.cleanFields(rawFields);
    const context = `Contexte : l'administrateur rédige ${KIND_LABELS[kind]}. Champs actuels du formulaire :
${this.describe(fields)}

Réponds à ses questions sur le SEO et le GEO de ce contenu : concret, concis (10 lignes maximum), avec des propositions prêtes à copier quand c'est utile. Pas de titres Markdown ; listes à puces autorisées.`;
    const contents = [
      { role: 'user', parts: [{ text: context }] },
      { role: 'model', parts: [{ text: 'Compris. Je suis prêt à vous aider sur ce contenu.' }] },
      ...messages.slice(-12).map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
    ];
    const { text, model } = await this.generate({ contents }, { maxOutputTokens: 1200, temperature: 0.6 });
    return { reply: text.trim(), model };
  }

  // ==========================================================================

  /** Essaie chaque modèle dans l'ordre ; un modèle hors quota ou saturé est mis de côté quelques minutes. */
  private async generate(body: { contents: unknown[] }, generationConfig: Record<string, unknown>) {
    if (!this.apiKey) {
      throw new ServiceUnavailableException("Assistant IA non configuré : ajoutez GEMINI_API_KEY dans Backend/.env.");
    }
    const now = Date.now();
    const candidates = this.models.filter((m) => (this.cooldown.get(m) ?? 0) <= now);
    let lastError = 'aucun modèle disponible';
    for (const model of candidates.length ? candidates : this.models) {
      try {
        const text = await this.call(model, body, generationConfig);
        return { text, model };
      } catch (err) {
        const status = err instanceof GeminiError ? err.status : 0;
        lastError = `${model} : ${err instanceof Error ? err.message : String(err)}`;
        this.logger.warn(`Gemini ${lastError.slice(0, 200)}`);
        if (status === 429 || status === 503 || status === 404) this.cooldown.set(model, Date.now() + COOLDOWN_MS);
        if (status === 400 || status === 401 || status === 403) break;
      }
    }
    throw new ServiceUnavailableException("L'assistant IA est momentanément indisponible. Le score calculé localement reste affiché ; réessayez dans un instant.");
  }

  private async call(model: string, body: { contents: unknown[] }, generationConfig: Record<string, unknown>) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
    // Les modèles 2.5 « réfléchissent » par défaut : inutile ici et beaucoup plus lent.
    const thinking = model.startsWith('gemini-2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {};
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          ...body,
          generationConfig: { ...generationConfig, ...thinking },
        }),
      });
      const json = (await response.json().catch(() => null)) as {
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
        error?: { message?: string };
      } | null;
      if (!response.ok) throw new GeminiError(response.status, json?.error?.message?.slice(0, 160) ?? `HTTP ${response.status}`);
      const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      if (!text.trim()) throw new GeminiError(502, `réponse vide (${json?.candidates?.[0]?.finishReason ?? 'inconnue'})`);
      return text;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw new GeminiError(504, 'délai dépassé');
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Seules des valeurs texte courtes sont transmises au modèle (20 champs, 3 000 caractères chacun). */
  private cleanFields(raw: Record<string, unknown>) {
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw ?? {}).slice(0, 20)) {
      const text = Array.isArray(value) ? value.filter((v) => typeof v === 'string').join(', ') : typeof value === 'string' || typeof value === 'number' ? String(value) : '';
      if (text.trim()) fields[key.slice(0, 60)] = text.trim().slice(0, 3000);
    }
    return fields;
  }

  private describe(fields: Record<string, string>) {
    const lines = Object.entries(fields).map(([key, value]) => `- ${key} : ${value}`);
    return lines.length ? lines.join('\n') : '- (formulaire encore vide)';
  }

  private normalize(raw: Partial<SeoAnalysis>): SeoAnalysis {
    const score = (value: unknown) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    const str = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
    const s = (raw.suggestions ?? {}) as Partial<SeoAnalysis['suggestions']>;
    return {
      seoScore: score(raw.seoScore),
      geoScore: score(raw.geoScore),
      summary: str(raw.summary, 600),
      checks: (Array.isArray(raw.checks) ? raw.checks : [])
        .filter((c) => c && typeof c.label === 'string')
        .slice(0, 10)
        .map((c) => ({
          area: c.area === 'geo' ? 'geo' : 'seo',
          status: (['ok', 'warning', 'problem'] as const).includes(c.status) ? c.status : 'warning',
          label: str(c.label, 160),
          advice: str(c.advice, 500),
        })),
      suggestions: {
        title: str(s.title, 200),
        description: str(s.description, 5000),
        metaDescription: str(s.metaDescription, 320),
        keywords: (Array.isArray(s.keywords) ? s.keywords : []).filter((k) => typeof k === 'string').slice(0, 12).map((k) => k.trim().slice(0, 60)),
        faq: (Array.isArray(s.faq) ? s.faq : [])
          .filter((f) => f && typeof f.question === 'string' && typeof f.answer === 'string')
          .slice(0, 5)
          .map((f) => ({ question: str(f.question, 200), answer: str(f.answer, 800) })),
      },
    };
  }
}
