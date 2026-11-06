/**
 * Traduction de tout le site, à partir du français du code et de la base.
 *
 * Les textes affichés sont remplacés dans le DOM juste après le rendu de React, avant que le navigateur ne peigne :
 * dictionnaire généré d'avance (public/i18n/<langue>.json, voir scripts/i18n) complété par les contenus publiés depuis
 * par l'administration (GET /api/i18n/<langue>). Un texte absent du dictionnaire (nom de membre, message, publication)
 * reste tel quel, comme tout élément marqué translate="no" (logo). Le français reste la langue source : changer de langue
 * ne recharge pas la page.
 */
export type Language = 'FR' | 'EN' | 'ZH' | 'AR';

const STORAGE_KEY = 'qiao.language';
const LOCALES: Record<Language, string> = { FR: 'fr-FR', EN: 'en-GB', ZH: 'zh-CN', AR: 'ar-TN' };
const TRANSLATED_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'];
const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);
const IGNORED_ZONE = '[translate="no"], [contenteditable="true"]';
const MAX_MISSES = 5000;

interface Translated {
  source: string;
  shown: string;
}
interface Template {
  pattern: RegExp;
  target: string;
}

let language: Language = 'FR';
let requestId = 0;
let exact = new Map<string, string>();
let folded = new Map<string, string>();
let templates = new Map<string, Template[]>();
let resolved = new Map<string, string | null>();
const dictionaries = new Map<Language, Record<string, string>>();
const textState = new WeakMap<Text, Translated>();
const attributeState = new WeakMap<Element, Map<string, Translated>>();
const misses = new Set<string>();

const sourceTitle = document.title;
const metaDescription = document.querySelector('meta[name="description"]');
const sourceDescription = metaDescription?.getAttribute('content') ?? '';

const normalize = (text: string) => text.replace(/[\s  ]+/g, ' ').trim();
const foldCase = (text: string) => text.toLocaleLowerCase('fr');
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templateBucket = (text: string) => foldCase(text).slice(0, 5);

export const isRtl = (code: Language = language) => code === 'AR';
export const getLanguage = () => language;
export const appLocale = () => LOCALES[language];

export function toLanguage(code: string | null | undefined): Language {
  const upper = (code ?? '').toUpperCase();
  return upper === 'EN' || upper === 'ZH' || upper === 'AR' ? upper : 'FR';
}

export function storedLanguage(): Language {
  try {
    return toLanguage(localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'FR';
  }
}

// --- Dictionnaire ---------------------------------------------------------------------

function buildIndexes(dictionary: Record<string, string>) {
  exact = new Map();
  folded = new Map();
  templates = new Map();
  resolved = new Map();
  for (const [source, target] of Object.entries(dictionary)) {
    const key = normalize(source);
    exact.set(key, target);
    folded.set(foldCase(key), target);
    if (/\{\d+\}/.test(key)) {
      // « Virez {0} en indiquant {1} » : les valeurs dynamiques sont capturées et réinjectées dans la traduction.
      const pieces = key.split(/\{\d+\}/);
      const order = [...key.matchAll(/\{(\d+)\}/g)].map((match) => Number(match[1]));
      if (pieces.join('').trim().length < 2) continue;
      // Une valeur peut être vide (marque du pluriel absente : « Messages (0 non lu) »).
      const pattern = new RegExp(`^${pieces.map(escapeRegExp).join('(.*?)')}$`, 'u');
      const entry = { pattern, target: order.reduce((text, index, position) => text.replace(`{${index}}`, `\u0001${position}\u0001`), target) };
      const bucket = templateBucket(pieces[0]);
      templates.set(bucket, [...(templates.get(bucket) ?? []), entry]);
    }
  }
}

function matchTemplate(text: string): string | null {
  const buckets = [templates.get(templateBucket(text)), templates.get('')];
  for (const bucket of buckets) {
    for (const { pattern, target } of bucket ?? []) {
      const match = text.match(pattern);
      if (match) {
        return target.replace(/\u0001(\d+)\u0001/g, (_, position) => {
          const value = match[Number(position) + 1] ?? '';
          return lookup(value) ?? value;
        });
      }
    }
  }
  return null;
}

function lookup(text: string): string | null {
  const known = resolved.get(text);
  if (known !== undefined) return known;
  let result = exact.get(text) ?? null;
  if (!result) {
    const insensitive = folded.get(foldCase(text));
    if (insensitive) result = text === text.toLocaleUpperCase('fr') ? insensitive.toLocaleUpperCase() : insensitive;
  }
  if (!result) result = matchTemplate(text);
  resolved.set(text, result);
  return result;
}

/** Traduction d'une chaîne hors DOM (valeurs passées à des bibliothèques, boîtes de dialogue du navigateur). */
export function translate(text: string): string {
  if (language === 'FR') return text;
  return lookup(normalize(text)) ?? text;
}

function translateKeepingSpaces(value: string): string | null {
  const core = normalize(value);
  if (!core) return null;
  const translated = lookup(core);
  if (!translated) {
    // Texte latin non traduit : les libellés déjà écrits en arabe ou en chinois ne sont pas des oublis.
    if (/\p{Script=Latin}{2}/u.test(core) && misses.size < MAX_MISSES) misses.add(core);
    return null;
  }
  const start = value.match(/^\s*/)?.[0] ?? '';
  const end = value.match(/\s*$/)?.[0] ?? '';
  return `${start}${translated}${end}`;
}

// --- DOM -------------------------------------------------------------------------------

const isIgnored = (element: Element | null) => !element || IGNORED_TAGS.has(element.tagName) || element.closest(IGNORED_ZONE) !== null;

function processText(node: Text) {
  const value = node.nodeValue ?? '';
  const state = textState.get(node);
  if (state && state.shown === value) return;
  if (state) textState.delete(node);
  if (!value.trim() || isIgnored(node.parentElement)) return;
  const translated = translateKeepingSpaces(value);
  if (!translated || translated === value) return;
  // Une option sans « value » renvoie son texte au code : sa valeur reste le français d'origine.
  const parent = node.parentElement;
  if (parent?.tagName === 'OPTION' && !parent.hasAttribute('value')) parent.setAttribute('value', value.trim());
  textState.set(node, { source: value, shown: translated });
  node.nodeValue = translated;
}

function processAttribute(element: Element, name: string) {
  const value = element.getAttribute(name);
  if (value === null) return;
  const states = attributeState.get(element);
  const state = states?.get(name);
  if (state && state.shown === value) return;
  if (state) states?.delete(name);
  if (!value.trim() || isIgnored(element)) return;
  const translated = translateKeepingSpaces(value);
  if (!translated || translated === value) return;
  const map = states ?? new Map<string, Translated>();
  map.set(name, { source: value, shown: translated });
  attributeState.set(element, map);
  element.setAttribute(name, translated);
}

function processTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    processText(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) processText(node as Text);
  const scope = root as Element | Document;
  const selector = TRANSLATED_ATTRIBUTES.map((name) => `[${name}]`).join(',');
  if (root.nodeType === Node.ELEMENT_NODE) {
    for (const name of TRANSLATED_ATTRIBUTES) if ((root as Element).hasAttribute(name)) processAttribute(root as Element, name);
  }
  scope.querySelectorAll(selector).forEach((element) => {
    for (const name of TRANSLATED_ATTRIBUTES) if (element.hasAttribute(name)) processAttribute(element, name);
  });
}

function restoreOriginals() {
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const state = textState.get(node as Text);
    if (state) {
      if (node.nodeValue === state.shown) node.nodeValue = state.source;
      textState.delete(node as Text);
    }
  }
  document.querySelectorAll(TRANSLATED_ATTRIBUTES.map((name) => `[${name}]`).join(',')).forEach((element) => {
    const states = attributeState.get(element);
    if (!states) return;
    states.forEach((state, name) => {
      if (element.getAttribute(name) === state.shown) element.setAttribute(name, state.source);
    });
    attributeState.delete(element);
  });
}

const observer = new MutationObserver((records) => {
  for (const record of records) {
    if (record.type === 'characterData') processText(record.target as Text);
    else if (record.type === 'attributes') processAttribute(record.target as Element, record.attributeName ?? '');
    else record.addedNodes.forEach(processTree);
  }
  // Nos propres écritures n'ont pas besoin d'être retraitées.
  observer.takeRecords();
});

function startObserving() {
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: TRANSLATED_ATTRIBUTES });
}

function applyDocumentAttributes(code: Language) {
  const root = document.documentElement;
  root.lang = code.toLowerCase();
  root.dir = isRtl(code) ? 'rtl' : 'ltr';
  document.title = code === 'FR' ? sourceTitle : translate(sourceTitle);
  metaDescription?.setAttribute('content', code === 'FR' ? sourceDescription : translate(sourceDescription));
}

// --- Formats de date et de nombre : tout le site suit la langue choisie -------------------

function patchLocaleFormatting() {
  const follow = (locales: Intl.LocalesArgument) => (locales === undefined || locales === 'fr-FR' || locales === 'fr' ? LOCALES[language] : locales);
  const dateProto = Date.prototype;
  const { toLocaleDateString, toLocaleTimeString, toLocaleString: dateToLocaleString } = dateProto;
  const numberToLocaleString = Number.prototype.toLocaleString;
  dateProto.toLocaleDateString = function (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) {
    return toLocaleDateString.call(this, follow(locales), options);
  } as typeof dateProto.toLocaleDateString;
  dateProto.toLocaleTimeString = function (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) {
    return toLocaleTimeString.call(this, follow(locales), options);
  } as typeof dateProto.toLocaleTimeString;
  dateProto.toLocaleString = function (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) {
    return dateToLocaleString.call(this, follow(locales), options);
  } as typeof dateProto.toLocaleString;
  Number.prototype.toLocaleString = function (locales?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions) {
    return numberToLocaleString.call(this, follow(locales), options);
  } as typeof Number.prototype.toLocaleString;
}

// --- Changement de langue ----------------------------------------------------------------

async function loadDictionary(code: Language): Promise<Record<string, string>> {
  const cached = dictionaries.get(code);
  if (cached) return cached;
  const lower = code.toLowerCase();
  const [base, dynamic] = await Promise.all([
    fetch(`/i18n/${lower}.json`).then((response) => (response.ok ? response.json() : {})),
    // Contenus ajoutés depuis par l'administration : facultatif, le site reste utilisable sans.
    fetch(`/api/i18n/${lower}`)
      .then((response) => (response.ok ? response.json() : {}))
      .catch(() => ({})),
  ]);
  const dictionary = { ...base, ...dynamic } as Record<string, string>;
  dictionaries.set(code, dictionary);
  return dictionary;
}

/** Applique une langue. La locale change immédiatement ; le texte dès que le dictionnaire est chargé. */
export async function setLanguage(code: Language): Promise<void> {
  const id = ++requestId;
  const previous = language;
  language = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Préférence non persistée (stockage indisponible).
  }
  if (code === 'FR') {
    observer.disconnect();
    if (previous !== 'FR') restoreOriginals();
    applyDocumentAttributes('FR');
    return;
  }
  let dictionary: Record<string, string> = {};
  try {
    dictionary = await loadDictionary(code);
  } catch {
    // Dictionnaire indisponible (réseau) : le site reste affiché en français.
  }
  if (id !== requestId) return;
  observer.disconnect();
  if (previous !== 'FR') restoreOriginals();
  buildIndexes(dictionary);
  misses.clear();
  applyDocumentAttributes(code);
  processTree(document.body);
  observer.takeRecords();
  startObserving();
}

/** Boîtes de dialogue du navigateur : leur message n'est pas dans le DOM. */
function patchNativeDialogs() {
  const { confirm, alert, prompt } = window;
  window.confirm = (message) => confirm.call(window, translate(String(message ?? '')));
  window.alert = (message) => alert.call(window, translate(String(message ?? '')));
  window.prompt = (message, value) => prompt.call(window, translate(String(message ?? '')), value);
}

/** À appeler une fois, avant le premier rendu : évite d'afficher le français à un visiteur d'une autre langue. */
export async function initLanguage() {
  patchLocaleFormatting();
  patchNativeDialogs();
  const code = storedLanguage();
  applyDocumentAttributes(code);
  if (code !== 'FR') await Promise.race([setLanguage(code), new Promise((resolve) => setTimeout(resolve, 2500))]);
}

// Textes affichés sans traduction : outil de contrôle (scripts/i18n/README.md).
(window as unknown as { __qiaoI18nMisses: () => string[] }).__qiaoI18nMisses = () => [...misses];
