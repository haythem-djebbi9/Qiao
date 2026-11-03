// Crée les comptes de test de la version déployée (client et expert) par l'API, avec des mots de passe aléatoires.
// Écrit une ligne « rôle | e-mail | mot de passe » par compte créé ; un compte existant n'est pas modifié.
// Usage (dans le conteneur) : node Backend/scripts/deploy/create-accounts.mjs qiao-china.io
import { randomBytes } from 'crypto';

const DOMAIN = process.argv[2];
if (!DOMAIN) throw new Error('Indiquez le domaine : node create-accounts.mjs qiao-china.io');
const API = process.env.API_URL ?? `http://127.0.0.1:${process.env.PORT ?? 4000}/api`;

async function call(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

async function createAccount(role, account) {
  const password = `Qiao-${randomBytes(12).toString('base64url')}`;
  const res = await call('POST', '/auth/register', null, { ...account, password, acceptTerms: true });
  if (res.status === 409) {
    console.log(`${role} | ${account.email} | existe déjà (mot de passe inchangé)`);
    return null;
  }
  if (!res.json?.token) throw new Error(`Création de ${account.email} impossible : ${res.status} ${JSON.stringify(res.json)}`);
  console.log(`${role} | ${account.email} | ${password}`);
  return res.json.token;
}

await createAccount('Membre client (test)', {
  fullName: 'Client Test QIAO',
  email: `client.test@${DOMAIN}`,
  company: 'Compte de test',
  accountType: 'enterprise',
  origin: 'north-africa',
});

const expertToken = await createAccount('Expert / prestataire (test)', {
  fullName: 'Expert Test QIAO',
  email: `expert.test@${DOMAIN}`,
  company: 'Compte de test',
  accountType: 'expert',
  origin: 'china',
});
if (expertToken) {
  const profile = await call('PUT', '/community/me/expert', expertToken, {
    headline: 'Compte de test : sourcing et audit en Chine',
    biography: "Compte de test de la plateforme QIAO, à retirer avant l'ouverture au public.",
    categories: ['import-export', 'logistics'],
    countriesServed: ['Chine', 'Tunisie'],
    languages: ['fr', 'zh'],
    yearsExperience: 5,
    listed: true,
  });
  if (profile.status >= 400) throw new Error(`Profil expert impossible : ${profile.status} ${JSON.stringify(profile.json)}`);
}
