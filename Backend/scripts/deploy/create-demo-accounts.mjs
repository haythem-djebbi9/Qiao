// Crée les comptes de démonstration de la version déployée, trois par rôle, par l'API et avec des mots de passe aléatoires.
// Écrit une ligne « rôle | e-mail | mot de passe » par compte créé ; un compte existant n'est pas modifié.
// Les profils experts de démonstration ne sont pas affichés dans l'annuaire public.
// Usage (dans le conteneur) : node Backend/scripts/deploy/create-demo-accounts.mjs qiao-china.io [membres|admins|tous]
//   « admins » promeut les comptes demo.admin* : il se connecte avec ADMIN_EMAIL / ADMIN_PASSWORD (variables du conteneur).
import { randomBytes } from 'crypto';

const DOMAIN = process.argv[2];
const PART = process.argv[3] ?? 'membres';
if (!DOMAIN) throw new Error('Indiquez le domaine : node create-demo-accounts.mjs qiao-china.io [membres|admins|tous]');
const API = process.env.API_URL ?? `http://127.0.0.1:${process.env.PORT ?? 4000}/api`;

async function call(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

/** Crée le compte ; renvoie { token, user } ou null s'il existe déjà. */
async function createAccount(role, account) {
  const password = `Qiao-${randomBytes(9).toString('base64url')}`;
  const res = await call('POST', '/auth/register', null, { ...account, password, acceptTerms: true });
  if (res.status === 409) {
    console.log(`${role} | ${account.email} | existe déjà (mot de passe inchangé)`);
    return null;
  }
  if (!res.json?.token) throw new Error(`Création de ${account.email} impossible : ${res.status} ${JSON.stringify(res.json)}`);
  console.log(`${role} | ${account.email} | ${password}`);
  return res.json;
}

const N = [1, 2, 3];

if (PART === 'membres' || PART === 'tous') {
  for (const n of N) {
    await createAccount('Démo - entreprise', {
      fullName: `Entreprise Démo ${n}`,
      email: `demo.entreprise${n}@${DOMAIN}`,
      company: `Société Démo ${n}`,
      accountType: 'enterprise',
      origin: n === 2 ? 'china' : 'north-africa',
    });
  }
  for (const n of N) {
    await createAccount('Démo - particulier', {
      fullName: `Particulier Démo ${n}`,
      email: `demo.particulier${n}@${DOMAIN}`,
      accountType: 'individual',
      origin: n === 2 ? 'china' : 'north-africa',
    });
  }
  for (const n of N) {
    const created = await createAccount('Démo - expert / prestataire', {
      fullName: `Expert Démo ${n}`,
      email: `demo.expert${n}@${DOMAIN}`,
      company: 'Compte de démonstration',
      accountType: 'expert',
      origin: n === 1 ? 'china' : 'north-africa',
    });
    if (created) {
      const profile = await call('PUT', '/community/me/expert', created.token, {
        headline: 'Compte de démonstration QIAO',
        biography: 'Compte de démonstration pour découvrir l’espace expert de QIAO.',
        categories: ['import-export', 'logistics'],
        countriesServed: ['Chine', 'Tunisie', 'Maroc'],
        languages: ['fr', 'zh'],
        yearsExperience: 5,
        listed: false,
      });
      if (profile.status >= 400) throw new Error(`Profil expert impossible : ${profile.status} ${JSON.stringify(profile.json)}`);
    }
  }
}

if (PART === 'admins' || PART === 'tous') {
  const login = await call('POST', '/auth/login', null, { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  const adminToken = login.json?.token;
  if (!adminToken) throw new Error(`Connexion administrateur impossible : ${login.status}`);
  for (const n of N) {
    const created = await createAccount('Démo - administrateur', {
      fullName: `Administrateur Démo ${n}`,
      email: `demo.admin${n}@${DOMAIN}`,
      company: 'QIAO',
      accountType: 'enterprise',
      origin: 'north-africa',
    });
    if (created) {
      const promoted = await call('PATCH', `/community/admin/members/${created.user.id}/role`, adminToken, { role: 'admin' });
      if (promoted.status >= 400) throw new Error(`Rôle administrateur impossible : ${promoted.status} ${JSON.stringify(promoted.json)}`);
    }
  }
}
