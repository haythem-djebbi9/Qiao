// Traduit les textes extraits (source-strings.json) avec Gemini et complète public/i18n/<langue>.json.
// Seuls les textes manquants sont envoyés ; le script peut être relancé autant de fois que nécessaire.
// La clé GEMINI_API_KEY est lue dans Backend/.env. Usage : node scripts/i18n/translate.mjs [en zh ar]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(HERE, '../..');
const OUTPUT = path.join(FRONTEND, 'public/i18n');
const ENV = fs.readFileSync(path.resolve(FRONTEND, '../Backend/.env'), 'utf8');
const API_KEY = ENV.match(/^GEMINI_API_KEY=(.*)$/m)?.[1]?.trim();
if (!API_KEY) throw new Error('GEMINI_API_KEY absent de Backend/.env');

// Offre gratuite de Gemini : peu de requêtes par minute et par jour, donc de gros lots et une répartition sur plusieurs modèles.
const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash'];
const MAX_STRINGS = 200;
const MAX_CHARS = 12000;
const CONCURRENCY = 2;
const exhausted = new Set();

const LANGUAGES = {
  en: {
    name: 'professional international business English',
    notes: 'Community stays "Community", Academy stays "Academy".',
  },
  zh: {
    name: 'Simplified Chinese (zh-CN), natural for Chinese business readers',
    notes: 'Community = 社区, Academy = 学院, North Africa = 北非, Tunisia = 突尼斯, Morocco = 摩洛哥, Algeria = 阿尔及利亚, Egypt = 埃及, Libya = 利比亚.',
  },
  ar: {
    name: 'Modern Standard Arabic, natural for North African business readers, with Western digits (0-9)',
    notes: 'Community = المجتمع, Academy = الأكاديمية, North Africa = شمال أفريقيا, China = الصين. Keep Latin brand names in Latin script.',
  },
};

const systemPrompt = (language) => `You translate the French user interface and content of QIAO (桥), a B2B platform connecting China and North Africa (Tunisia, Morocco, Algeria, Egypt, Libya): services, market intelligence, trade hub, academy, community, events, secure payments.

Translate every French string of the input JSON array into ${language.name}.

Rules:
- Return only a JSON array of strings: same length and same order as the input, one translation per input string.
- Write what a native professional would write on a business website, not word for word. Menu items and buttons stay short.
- Keep exactly as they are: QIAO, QIAO Academy, QIAO Community, QIAO Connect, QIAO Intelligence, brand, company and people's names, placeholders such as {0} and {1}, numbers, currency codes (TND, USD, EUR), URLs, e-mail addresses, emojis and symbols (→, ·, —, ✓).
- Some strings are fragments displayed next to a dynamic value: keep them as fragments, with their leading or trailing punctuation.
- Translate country names, months, and units.
- If a string is not French (an English term, a brand, a proper noun), return it unchanged.
- Never add notes, quotes or explanations.
${language.notes}`;

const placeholdersOf = (text) => (text.match(/\{\d+\}/g) ?? []).sort().join();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callModel(model, language, texts) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    signal: AbortSignal.timeout(120_000),
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt(language) }] },
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(texts) }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 16000,
        responseMimeType: 'application/json',
        responseSchema: { type: 'ARRAY', items: { type: 'STRING' } },
        ...(model.startsWith('gemini-2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      },
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = new Error(`${model} ${response.status}`);
    error.status = response.status;
    const details = JSON.stringify(body?.error?.details ?? '');
    if (/PerDay/.test(details)) {
      if (!exhausted.has(model)) console.log(`[${model}] quota du jour atteint`);
      exhausted.add(model);
    }
    error.retryAfter = Number(details.match(/"retryDelay":"(\d+)/)?.[1] ?? 0);
    throw error;
  }
  const json = await response.json();
  const parsed = JSON.parse(json.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') ?? '[]');
  if (!Array.isArray(parsed) || parsed.length !== texts.length) throw new Error(`${model} : ${parsed.length} réponses pour ${texts.length}`);
  return parsed;
}

async function translateBatch(language, texts) {
  let malformed = 0;
  // Quota ou saturation : on patiente, sans gaspiller de requêtes. Réponse mal formée : le lot est coupé en deux.
  for (let round = 0; round < 40 && malformed < 3; round += 1) {
    const models = MODELS.filter((model) => !exhausted.has(model));
    if (models.length === 0) return texts.map(() => null);
    for (const model of models) {
      try {
        return await callModel(model, language, texts);
      } catch (err) {
        if (err.status !== 429 && !(err.status >= 500)) malformed += 1;
      }
    }
    if (malformed < 3) await wait(20_000);
  }
  if (texts.length === 1) return [null];
  // Lot refusé ou mal formé : il est coupé en deux.
  const middle = Math.ceil(texts.length / 2);
  return [...(await translateBatch(language, texts.slice(0, middle))), ...(await translateBatch(language, texts.slice(middle)))];
}

function makeBatches(texts) {
  const batches = [];
  let current = [];
  let chars = 0;
  for (const text of texts) {
    if (current.length >= MAX_STRINGS || chars + text.length > MAX_CHARS) {
      batches.push(current);
      current = [];
      chars = 0;
    }
    current.push(text);
    chars += text.length;
  }
  if (current.length) batches.push(current);
  return batches;
}

const sources = JSON.parse(fs.readFileSync(path.join(HERE, 'source-strings.json'), 'utf8'));
fs.mkdirSync(OUTPUT, { recursive: true });
const requested = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(LANGUAGES);

for (const code of requested) {
  const language = LANGUAGES[code];
  const file = path.join(OUTPUT, `${code}.json`);
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const dictionary = Object.fromEntries(sources.filter((text) => existing[text]).map((text) => [text, existing[text]]));
  const save = () => fs.writeFileSync(file, JSON.stringify(dictionary, Object.keys(dictionary).sort(), 0));
  // Les textes courts d'abord : menus, boutons et titres sont les plus visibles.
  const missing = sources.filter((text) => !dictionary[text]).sort((a, b) => a.length - b.length);
  const batches = makeBatches(missing);
  console.log(`[${code}] ${Object.keys(dictionary).length} déjà traduits, ${missing.length} à traduire en ${batches.length} lots`);

  let done = 0;
  let rejected = 0;
  const worker = async () => {
    for (let batch = batches.shift(); batch && exhausted.size < MODELS.length; batch = batches.shift()) {
      const translations = await translateBatch(language, batch);
      batch.forEach((text, index) => {
        const translation = translations[index]?.trim();
        if (translation && placeholdersOf(translation) === placeholdersOf(text)) dictionary[text] = translation;
        else rejected += 1;
      });
      done += batch.length;
      save();
      console.log(`[${code}] ${done}/${missing.length}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  save();
  console.log(`[${code}] terminé : ${Object.keys(dictionary).length}/${sources.length} traduits, ${rejected} rejetés (relancer le script pour les reprendre)`);
}
