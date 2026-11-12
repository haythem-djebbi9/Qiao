// Extrait du code source tous les textes visibles par l'utilisateur (interface, catalogue de départ, messages de l'API).
// Résultat : scripts/i18n/source-strings.json, utilisé par translate.mjs. Le fichier n'est pas versionné.
// Usage : node scripts/i18n/extract.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(HERE, '../..');
const BACKEND = path.resolve(FRONTEND, '../Backend');

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]));
const isSource = (file) => /\.tsx?$/.test(file) && !file.endsWith('.d.ts');

const SOURCES = [
  { files: walk(path.join(FRONTEND, 'src')).filter((f) => isSource(f) && !/countryMapPaths|[\\/]i18n[\\/]/.test(f)), strict: false },
  { files: walk(path.join(BACKEND, 'src/database/data')).filter(isSource), strict: false },
  { files: walk(path.join(BACKEND, 'src/modules')).filter((f) => isSource(f) && !/\.(entity|entities)\.ts$|gateway[\\/]/.test(f)), strict: true },
];

/** Attributs et propriétés techniques, jamais affichés. */
const TECHNICAL_ATTRS = new Set(
  'className style key id href src type name htmlFor d fill stroke strokeWidth strokeLinecap strokeLinejoin viewBox xmlns rel target role loading referrerPolicy width height autoComplete accept method allow sandbox tabIndex x y x1 x2 y1 y2 cx cy r rx ry dataKey stopColor offset points transform gradientUnits gradientTransform clipPath mask filter fontFamily textAnchor dominantBaseline lang dir pattern inputMode'.split(' '),
);
const TECHNICAL_PROPS = new Set(
  'id iconName icon image img photo avatar logo cover src href url link className color accentColor badgeColor bg gradient slug key code countryCode path d tone flag variant theme route provider purpose mime fileId field dataKey ref method headers Authorization cx cy x y lat lng iso iso2 iso3 hex stroke fill'.split(' '),
);
const TECHNICAL_CALLS = /^(api\.|fetch|useApi|console\.|navigateDashboard|navigateCommunity|fetchObjectUrl|downloadFile|apiUrl|localStorage\.|sessionStorage\.|readStorage|writeStorage|document\.|window\.|Logger|createQueryBuilder|\w+\.(select|addSelect|where|andWhere|orWhere|innerJoin|leftJoin|innerJoinAndSelect|leftJoinAndSelect|orderBy|addOrderBy|groupBy|query|get|hit|log|warn|error|setHeader|getRepository)$)/;

const ENTITIES = { '&amp;': '&', '&nbsp;': ' ', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'", '&rarr;': '→', '&larr;': '←', '&mdash;': '—', '&ndash;': '–', '&hellip;': '…', '&copy;': '©', '&middot;': '·' };
const decode = (text) => text.replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity] ?? entity);
const normalize = (text) => text.replace(/[\s  ]+/g, ' ').trim();
const hasLetters = (text) => /\p{L}{2}/u.test(text);

const CLASS_TOKEN = /^[!a-z0-9:[\]\-/.#%_()&>,'"=+*~]+$/;
function looksHuman(text, strict) {
  if (text.length < 2 || !hasLetters(text)) return false;
  if (/^(https?:|\/|\.\/|\.\.\/|#|rgb|hsl|var\(|data:|mailto:|tel:|M\d|\{|\[|<|SELECT |INSERT |UPDATE |DELETE |CREATE |ALTER |COALESCE|CASE )/i.test(text)) return false;
  if (/^[\w.-]+@[\w.-]+$/.test(text) || /\.(png|jpe?g|svg|webp|gif|pdf|mp4|css|js|ts|tsx)(\?|$)/i.test(text)) return false;
  const tokens = text.split(' ');
  if (tokens.length === 1) {
    if (/^[a-z][a-z0-9_-]*$/.test(text) || /^[a-z]+([A-Z][a-z0-9]*)+$/.test(text) || /[._:/\\]/.test(text)) return false;
  } else if (tokens.every((token) => CLASS_TOKEN.test(token)) && tokens.some((token) => /[-:]/.test(token))) {
    return false;
  }
  if (strict) {
    // Code du backend : seuls les vrais messages en français sont retenus.
    if (tokens.length < 2 || !/^[\p{Lu}«"'À-Ý]/u.test(text)) return false;
    if (!/[àâäçéèêëîïôöùûüÿœ«»’']|\b(le|la|les|un|une|des|du|de|et|ou|pour|dans|sur|est|sont|votre|vos|ce|cette|à|au|aux|ne|pas)\b/i.test(text)) return false;
  }
  return true;
}

function isTechnicalContext(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isImportTypeNode(parent)) return true;
    if (ts.isLiteralTypeNode(parent) || ts.isTypeAliasDeclaration(parent) || ts.isInterfaceDeclaration(parent)) return true;
    if (ts.isDecorator(parent)) return true;
    if (ts.isJsxAttribute(parent) && TECHNICAL_ATTRS.has(parent.name.getText())) return true;
    if (ts.isPropertyAssignment(parent) && TECHNICAL_PROPS.has(parent.name.getText().replace(/['"]/g, ''))) return true;
    if (ts.isCallExpression(parent) && TECHNICAL_CALLS.test(parent.expression.getText())) return true;
    if (ts.isBinaryExpression(parent) && /[=!]==?/.test(parent.operatorToken.getText())) return true;
    if (ts.isCaseClause(parent)) return true;
    if (ts.isJsxElement(parent) || ts.isFunctionLike(parent)) break;
  }
  return false;
}

const strings = new Set();
const add = (raw, strict) => {
  const text = normalize(decode(raw));
  if (looksHuman(text, strict)) strings.add(text);
};

for (const { files, strict } of SOURCES) {
  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = (node) => {
      if (ts.isJsxText(node)) {
        const text = normalize(decode(node.getText()));
        if (hasLetters(text)) strings.add(text);
      } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        if (!isTechnicalContext(node)) add(node.text, strict);
      } else if (ts.isTemplateExpression(node)) {
        if (!isTechnicalContext(node)) {
          const parts = [node.head.text, ...node.templateSpans.flatMap((span, index) => [`{${index}}`, span.literal.text])];
          const text = normalize(parts.join(''));
          const literal = text.replace(/\{\d+\}/g, '');
          if (hasLetters(literal) && !/[{}]{2}|^\//.test(literal)) add(text, strict);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
}

// Textes composés à l'exécution, absents du code sous cette forme.
for (const extra of JSON.parse(fs.readFileSync(path.join(HERE, 'extra-strings.json'), 'utf8'))) strings.add(normalize(extra));

const sorted = [...strings].sort((a, b) => a.localeCompare(b, 'fr'));
fs.writeFileSync(path.join(HERE, 'source-strings.json'), JSON.stringify(sorted, null, 1));
const chars = sorted.reduce((sum, text) => sum + text.length, 0);
console.log(`${sorted.length} textes, ${chars} caractères`);
