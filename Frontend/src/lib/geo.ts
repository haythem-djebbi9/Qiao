/** Détection automatique de la position du visiteur (sans autorisation navigateur). */

export type Region = 'china' | 'north-africa';

export interface VisitorLocation {
  region: Region | null;
  country: string | null;
  countryCode: string | null;
  source: 'account' | 'timezone' | 'language' | 'unknown';
}

const TIMEZONES: Record<string, { country: string; code: string; region: Region }> = {
  'Asia/Shanghai': { country: 'Chine', code: 'CN', region: 'china' },
  'Asia/Chongqing': { country: 'Chine', code: 'CN', region: 'china' },
  'Asia/Chungking': { country: 'Chine', code: 'CN', region: 'china' },
  'Asia/Harbin': { country: 'Chine', code: 'CN', region: 'china' },
  'Asia/Urumqi': { country: 'Chine', code: 'CN', region: 'china' },
  'Asia/Kashgar': { country: 'Chine', code: 'CN', region: 'china' },
  'Asia/Hong_Kong': { country: 'Chine', code: 'CN', region: 'china' },
  'Asia/Macau': { country: 'Chine', code: 'CN', region: 'china' },
  PRC: { country: 'Chine', code: 'CN', region: 'china' },
  'Africa/Tunis': { country: 'Tunisie', code: 'TN', region: 'north-africa' },
  'Africa/Algiers': { country: 'Algérie', code: 'DZ', region: 'north-africa' },
  'Africa/Casablanca': { country: 'Maroc', code: 'MA', region: 'north-africa' },
  'Africa/El_Aaiun': { country: 'Maroc', code: 'MA', region: 'north-africa' },
  'Africa/Cairo': { country: 'Égypte', code: 'EG', region: 'north-africa' },
  Egypt: { country: 'Égypte', code: 'EG', region: 'north-africa' },
  'Africa/Tripoli': { country: 'Libye', code: 'LY', region: 'north-africa' },
  Libya: { country: 'Libye', code: 'LY', region: 'north-africa' },
};

const LANGUAGE_COUNTRIES: Record<string, { country: string; code: string; region: Region }> = {
  CN: { country: 'Chine', code: 'CN', region: 'china' },
  HK: { country: 'Chine', code: 'CN', region: 'china' },
  MO: { country: 'Chine', code: 'CN', region: 'china' },
  TN: { country: 'Tunisie', code: 'TN', region: 'north-africa' },
  DZ: { country: 'Algérie', code: 'DZ', region: 'north-africa' },
  MA: { country: 'Maroc', code: 'MA', region: 'north-africa' },
  EG: { country: 'Égypte', code: 'EG', region: 'north-africa' },
  LY: { country: 'Libye', code: 'LY', region: 'north-africa' },
};

function fromTimezone(): VisitorLocation | null {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const match = TIMEZONES[zone];
    return match ? { region: match.region, country: match.country, countryCode: match.code, source: 'timezone' } : null;
  } catch {
    return null;
  }
}

function fromLanguage(): VisitorLocation | null {
  const languages = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [];
  for (const language of languages) {
    const [lang, area] = language.split('-');
    const match = area ? LANGUAGE_COUNTRIES[area.toUpperCase()] : undefined;
    if (match) return { region: match.region, country: match.country, countryCode: match.code, source: 'language' };
    if (lang?.toLowerCase() === 'zh') return { region: 'china', country: 'Chine', countryCode: 'CN', source: 'language' };
  }
  return null;
}

/**
 * Position du visiteur : région déclarée sur son compte, sinon fuseau horaire de l'appareil,
 * sinon langue du navigateur.
 */
export function detectVisitorLocation(account?: { origin: Region; location: string | null } | null): VisitorLocation {
  if (account) {
    const detected = fromTimezone() ?? fromLanguage();
    // Le pays détecté n'est conservé que s'il appartient à la région déclarée sur le compte.
    const sameRegion = detected?.region === account.origin ? detected : null;
    return {
      region: account.origin,
      country: sameRegion?.country ?? (account.origin === 'china' ? 'Chine' : 'Afrique du Nord'),
      countryCode: sameRegion?.countryCode ?? (account.origin === 'china' ? 'CN' : null),
      source: 'account',
    };
  }
  return fromTimezone() ?? fromLanguage() ?? { region: null, country: null, countryCode: null, source: 'unknown' };
}
